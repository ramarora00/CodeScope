import React from 'react';

/**
 * ReviewPanel
 * 
 * Displays the final synthesized answer from the investigation or an error message (like quota limits).
 * Features a modern, premium dark aesthetic matching the v2 design system.
 */
export default function ReviewPanel({ answer, error }) {
  if (!answer && !error) return null;

  return (
    <div className="flex flex-col h-full w-[320px] bg-[var(--cs-panel)] text-[var(--cs-text)]">
      <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid var(--cs-border)' }}>
        {error ? (
          <div className="w-6 h-6 rounded-full flex items-center justify-center bg-red-500/10 text-red-400">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full flex items-center justify-center bg-green-500/10 text-green-400">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
        )}
        <span className="text-sm font-medium">
          {error ? 'Investigation Failed' : 'Investigation Complete'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
        {error ? (
          <div className="flex flex-col gap-4">
            <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/10 text-[13px] leading-relaxed text-red-200/90">
              <span className="block mb-2 font-medium text-red-400">API Error Detected</span>
              {error}
            </div>
            
            {error.toLowerCase().includes('429') && (
              <div className="p-4 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]">
                <h4 className="text-[13px] font-medium mb-2 text-[rgba(255,255,255,0.9)]">Possible Solutions for Quota Limit</h4>
                <ul className="text-[12px] text-[rgba(255,255,255,0.6)] space-y-2 list-disc pl-4">
                  <li><strong>Wait and Retry:</strong> The Gemini free tier has rate limits (e.g., 15 RPM). Wait a minute and try again.</li>
                  <li><strong>Add Fallback Models:</strong> Implement logic in the backend to fallback to another provider (e.g., Anthropic Claude or OpenAI) if Gemini fails.</li>
                  <li><strong>Upgrade API Key:</strong> Use a paid tier Google AI Studio API key to bypass free tier constraints.</li>
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="text-[13px] leading-relaxed opacity-90 whitespace-pre-wrap">
            {answer}
          </div>
        )}
      </div>
    </div>
  );
}
