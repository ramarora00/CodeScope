import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Loader2, Network, GitBranch, Activity, FileCode2, BookOpen, Zap, Target, GitMerge, Search, MessageSquare } from 'lucide-react';

const CONTEXT_SOURCES = [
  { label: 'Knowledge Graph', icon: Network,   pct: 97 },
  { label: 'Execution Traces', icon: GitBranch, pct: 94 },
  { label: 'Semantic Search', icon: Search,     pct: 91 },
  { label: 'Documentation',   icon: BookOpen,   pct: 72 },
];

const SUGGESTED_ACTIONS = [
  { label: 'Trace Route',       icon: Activity,  prompt: 'Trace the execution path for all routes in this repository' },
  { label: 'Impact Analysis',   icon: Zap,       prompt: 'What would break if I modify the selected file?' },
  { label: 'Show Callers',      icon: GitMerge,  prompt: 'What functions call into the selected file or service?' },
  { label: 'Find Similar',      icon: Search,    prompt: 'Find code patterns similar to the currently selected file' },
  { label: 'Explain Flow',      icon: MessageSquare, prompt: 'Explain the overall architecture and request flow of this repository' },
  { label: 'Domain Map',        icon: Target,    prompt: 'Map all business domains and their responsibilities in this codebase' },
];

const AIObservatory = ({ selectedRepo, selectedFile }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hello! I'm your Codebase AI.\nI can reason over your entire system,\ntrace execution paths, and predict impact.", ts: null }
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [view, setView] = useState('chat'); // 'chat' | 'sources'
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || sending) return;
    setInput('');
    setSending(true);
    setMessages(prev => [...prev, { role: 'user', text: msg, ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);

    try {
      const res = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: msg, repoId: selectedRepo?.id, filePath: selectedFile?.path })
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: data.answer || "I couldn't process that.",
        contextMeta: data.contextMeta,
        ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Error: Failed to connect to AI service.', ts: null }]);
    } finally { setSending(false); }
  };

  return (
    <div className="flex flex-col h-full" style={{ background: '#080A0F' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-bg-surface border border-border flex items-center justify-center">
            <Sparkles size={11} className="text-text-secondary" />
          </div>
          <span className="text-[10px] font-bold tracking-widest text-text-primary uppercase">AI Copilot</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-bg-surface border border-border rounded-md">
            <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-[8px] font-bold uppercase tracking-wider text-text-muted">ONLINE</span>
          </div>
          <span className="text-[8px] font-mono text-text-muted px-1.5 py-0.5 bg-bg-surface border border-border rounded">
            NEXUS OS v2.1
          </span>
        </div>
      </div>

      {/* Context sources */}
      <div className="px-4 py-3 border-b border-border flex-shrink-0" style={{ background: '#0A0E15' }}>
        <div className="text-[8px] font-bold uppercase tracking-widest text-text-muted mb-2.5">Context Sources</div>
        <div className="flex flex-col gap-1.5">
          {CONTEXT_SOURCES.map(({ label, icon: Icon, pct }) => (
            <div key={label} className="flex items-center gap-2">
              <Icon size={10} className="text-text-muted flex-shrink-0" />
              <span className="text-[10px] text-text-secondary flex-1">{label}</span>
              <div className="w-16 h-1 rounded-full bg-bg-hover overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct >= 90 ? '#7A8F7B' : pct >= 70 ? '#8B8475' : '#8B6B6B' }} />
              </div>
              <span className="text-[9px] font-mono" style={{ color: pct >= 90 ? '#7A8F7B' : '#8E97A8', width: 28, textAlign: 'right' }}>{pct}%</span>
            </div>
          ))}
        </div>

        {/* Active focus */}
        {(selectedRepo || selectedFile) && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="text-[8px] font-bold uppercase tracking-widest text-text-muted mb-1.5">Active Focus</div>
            <div className="flex items-center gap-2 p-2 bg-bg-surface border border-border rounded-lg">
              <Target size={10} className="text-text-muted flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold text-text-primary truncate">
                  {selectedFile ? selectedFile.name : selectedRepo?.name || 'Global'}
                </div>
                {selectedFile && (
                  <div className="text-[8px] text-text-muted truncate">{selectedFile.path}</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 flex flex-col gap-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[88%] px-3 py-2.5 rounded-xl text-[11px] leading-relaxed whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-bg-elevated border border-border text-text-primary rounded-tr-sm'
                : 'bg-bg-surface border border-border text-text-secondary rounded-tl-sm'
            }`}>
              {msg.text}

              {msg.contextMeta && (
                <div className="mt-2.5 pt-2 border-t border-border">
                  <div className="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                    <Network size={9} /> Context Injected
                  </div>
                  {msg.contextMeta.files?.slice(0, 3).map((f, fi) => (
                    <div key={fi} className="text-[9px] font-mono text-text-muted truncate">{f}</div>
                  ))}
                </div>
              )}
            </div>
            {msg.ts && <span className="text-[8px] text-text-muted mt-1 px-1">{msg.ts}</span>}
          </div>
        ))}
        {sending && (
          <div className="flex items-center gap-2 text-text-muted text-[10px]">
            <Loader2 size={10} className="animate-spin" />
            <span>Reasoning over codebase...</span>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Suggested actions */}
      <div className="px-4 pb-3 flex-shrink-0 border-t border-border pt-3" style={{ background: '#080A0F' }}>
        <div className="text-[8px] font-bold uppercase tracking-widest text-text-muted mb-2">Suggested Actions</div>
        <div className="grid grid-cols-3 gap-1.5">
          {SUGGESTED_ACTIONS.map(({ label, icon: Icon, prompt }) => (
            <button
              key={label}
              onClick={() => send(prompt)}
              disabled={!selectedRepo || sending}
              className="flex flex-col items-center gap-1 p-2 bg-bg-surface border border-border rounded-lg text-[8px] text-text-muted hover:text-text-secondary hover:border-border-strong transition-colors disabled:opacity-30"
            >
              <Icon size={11} />
              <span className="text-center leading-tight">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="px-4 pb-4 flex-shrink-0">
        <div className="relative">
          <textarea
            rows={2}
            placeholder={selectedRepo ? 'Ask anything about the codebase...' : 'Select a repository first...'}
            disabled={!selectedRepo || sending}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            className="w-full bg-bg-surface border border-border rounded-xl py-3 pl-4 pr-10 text-[11px] text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-border-strong transition-colors leading-relaxed"
            style={{ fontFamily: 'Inter, sans-serif' }}
          />
          <button
            onClick={() => send()}
            disabled={!selectedRepo || sending || !input.trim()}
            className="absolute right-2 bottom-2 p-1.5 text-text-muted hover:text-text-primary transition-colors disabled:opacity-30"
          >
            {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
          </button>
        </div>
        <div className="flex justify-between items-center mt-1.5 px-1">
          <span className="text-[8px] text-text-muted">{selectedFile ? `ctx: ${selectedFile.name}` : 'ctx: global repo'}</span>
          <span className="text-[8px] text-text-muted">Enter ↵ to send</span>
        </div>
      </div>
    </div>
  );
};

export default AIObservatory;
