const { GeminiProvider } = require('./GeminiProvider');
const { FallbackProvider } = require('./FallbackProvider');
const { LLMProvider } = require('./LLMProvider');

/**
 * ProviderRouter
 * 
 * Manages provider health and gracefully routes to a fallback provider 
 * if the primary encounters a retryable transient failure (e.g. 429, 503).
 */
class ProviderRouter extends LLMProvider {
  constructor() {
    super();
    this.primary = null;
    this.fallback = null;
    
    try {
      this.primary = new GeminiProvider();
    } catch (e) {
      console.warn('[ProviderRouter] Primary provider (Gemini) not configured:', e.message);
    }
    
    try {
      this.fallback = new FallbackProvider();
    } catch (e) {
      console.warn('[ProviderRouter] Fallback provider not configured:', e.message);
    }

    this.state = {
      primaryStatus: 'healthy', // 'healthy' | 'cooling_down'
      retryAfter: 0
    };
  }

  async generatePlan(mission, context, constraints) {
    // 1. If Primary is cooling down, skip it
    if (this.state.primaryStatus === 'cooling_down' && Date.now() < this.state.retryAfter) {
      console.log('[ProviderRouter] Primary is cooling down, routing to fallback immediately.');
      return this._executeFallback(mission, context, constraints);
    }

    // 2. Recover primary if cooldown passed
    if (this.state.primaryStatus === 'cooling_down' && Date.now() >= this.state.retryAfter) {
      console.log('[ProviderRouter] Primary cooldown expired, restoring to healthy.');
      this.state.primaryStatus = 'healthy';
    }

    if (!this.primary) {
      console.log('[ProviderRouter] No primary configured, routing to fallback.');
      return this._executeFallback(mission, context, constraints);
    }

    try {
      console.log('[ProviderRouter] Requesting plan from Primary Provider (Gemini)...');
      return await this.primary.generatePlan(mission, context, constraints);
    } catch (error) {
      // 3. Classify error severity
      if (this._isRecoverableTransientError(error)) {
        console.warn(`[ProviderRouter] Primary hit retryable error (${error.message}). Marking for cooldown.`);
        this.state.primaryStatus = 'cooling_down';
        this.state.retryAfter = Date.now() + 60000; // 60s cooldown
        
        return this._executeFallback(mission, context, constraints);
      }
      
      // If it's a fatal error (bad API key, invalid request, application bug), fail fast.
      console.error('[ProviderRouter] Fatal primary error. No fallback triggered.');
      throw error;
    }
  }

  async _executeFallback(mission, context, constraints) {
    if (!this.fallback) {
      throw new Error('ProviderRouter: Primary failed and no Fallback provider is configured.');
    }
    console.log('[ProviderRouter] Executing Fallback Provider...');
    return await this.fallback.generatePlan(mission, context, constraints);
  }

  /**
   * Identifies meaningful transient errors vs fatal errors
   */
  _isRecoverableTransientError(error) {
    const msg = error.message?.toLowerCase() || '';
    const status = error.status || 0;
    
    // 429 Quota/Rate Limit
    if (status === 429 || msg.includes('429') || msg.includes('quota') || msg.includes('rate limit')) return true;
    
    // 5xx Server Errors / Temporary Overload
    if ((status >= 500 && status < 600) || msg.includes('500') || msg.includes('503') || msg.includes('502') || msg.includes('overloaded')) return true;
    
    // Timeouts and network drops
    if (status === 408 || msg.includes('timeout') || msg.includes('fetch failed') || msg.includes('econnreset')) return true;
    
    // Fatal (Not recoverable)
    // - 400 Bad Request / Schema invalid
    // - API_KEY_INVALID
    
    return false;
  }
}

module.exports = { ProviderRouter };
