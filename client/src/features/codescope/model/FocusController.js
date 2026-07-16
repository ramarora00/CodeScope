/**
 * Focus Controller - Coordinated Attention System
 * Dispatches active file, line, and symbol updates to visual consumers.
 */

export class FocusController {
  constructor() {
    this.listeners = new Set();
    this.currentAttention = {
      file: null,
      line: null,
      symbol: null,
      reason: null,
      confidence: null,
      nextTarget: null
    };
  }

  subscribe(listener) {
    this.listeners.add(listener);
    // Emit current state on subscribe
    listener(this.currentAttention);
    return () => this.listeners.delete(listener);
  }

  updateAttention(updates) {
    this.currentAttention = {
      ...this.currentAttention,
      ...updates
    };
    this.listeners.forEach(listener => listener(this.currentAttention));
  }

  focusFile(filePath) {
    this.updateAttention({
      file: filePath,
      line: null,
      symbol: null,
      reason: 'Focused file by developer',
      confidence: 100,
      nextTarget: null
    });
  }

  focusLine(filePath, lineNum, reason = '') {
    this.updateAttention({
      file: filePath,
      line: lineNum,
      symbol: null,
      reason: reason || `Reading line ${lineNum}`,
      confidence: 100,
      nextTarget: null
    });
  }

  focusSymbol(filePath, lineNum, symbol, reason = '') {
    this.updateAttention({
      file: filePath,
      line: lineNum,
      symbol: symbol,
      reason: reason || `Auditing symbol ${symbol}`,
      confidence: 100,
      nextTarget: null
    });
  }
}
export const globalFocusController = new FocusController();
