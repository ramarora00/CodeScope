import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createRuntime } from '../../model/RuntimeAdapter';
import CommandBar from './CommandBar';
import Dock from './Dock';
import InvestigationPanel from './InvestigationPanel';
import AIOverlayEditor from './AIOverlayEditor';
import KnowledgePanel from './KnowledgePanel';

/**
 * WorkspaceRoot — CodeScope V1 (Locked Spec)
 *
 * Layout: Dock (56) | Investigation (305) | AIOverlayEditor (flex-1) | Knowledge (320)
 *
 * Observation pane removed — AI reading is now an in-place overlay
 * inside the editor. Code never moves. Only AI attention moves.
 *
 * Runtime is decoupled via RuntimeAdapter. UI never knows if
 * events come from mock or real backend.
 */
export default function WorkspaceRoot({ repo = null }) {
  const [events, setEvents]             = useState([]);
  const [attention, setAttention]       = useState({});
  const [tabs, setTabs]                 = useState([]);
  const [activeTabId, setActiveTabId]   = useState(null);
  const [memoryFiles, setMemoryFiles]   = useState([]);
  const [runtimeStatus, setRuntimeStatus] = useState('idle');
  const [insight, setInsight]           = useState(null);
  const [startedAt, setStartedAt]       = useState(null);
  const [dockActive, setDockActive]     = useState('investigation');

  const runtimeRef = useRef(null);

  const handleEvent = useCallback((event) => {
    setEvents(prev => [...prev, event]);

    switch (event.type) {
      case 'appear': {
        const filename = event.file;
        setTabs(prev => {
          const exists = prev.some(t => t.name === filename);
          if (exists) return prev;
          return [...prev, { id: filename, name: filename, path: filename }];
        });
        setActiveTabId(filename);
        setAttention(prev => ({
          ...prev,
          file: filename,
          line: prev.file === filename ? prev.line : 1,
          symbol: null,
          type: 'appear',
        }));
        break;
      }

      case 'read': {
        setAttention(prev => ({
          ...prev,
          file: event.file,
          line: event.line,
          lineType: event.lineType,
          type: 'read',
        }));
        setRuntimeStatus('reading');
        break;
      }

      case 'follow': {
        setAttention(prev => ({
          ...prev,
          file: event.file,
          line: event.line,
          symbol: event.symbol,
          reason: event.reason,
          type: 'follow',
        }));
        break;
      }

      case 'jump': {
        if (attention.file) {
          setMemoryFiles(prev => {
            if (prev.some(m => m.file === attention.file)) return prev;
            return [...prev, { file: attention.file, lines: '—' }];
          });
        }
        break;
      }

      case 'insight': {
        setInsight(event.text);
        setAttention(prev => ({ ...prev, line: event.line, type: 'insight' }));
        break;
      }

      case 'resolve': {
        setRuntimeStatus('resolved');
        setInsight(event.reason);
        setAttention(prev => ({ ...prev, type: 'resolve' }));
        break;
      }

      default: break;
    }
  }, [attention.file]);

  useEffect(() => {
    // RuntimeAdapter decouples UI from mock vs real runtime
    const runtime = createRuntime(repo);
    runtimeRef.current = runtime;
    const unsub = runtime.subscribe(handleEvent);

    const t = setTimeout(() => {
      setStartedAt(Date.now());
      runtime.start();
    }, 600);

    return () => { clearTimeout(t); runtime.stop(); unsub(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectTab = useCallback(id => setActiveTabId(id), []);
  const handleCloseTab = useCallback(id => {
    setTabs(prev => {
      const next = prev.filter(t => t.id !== id);
      if (id === activeTabId && next.length > 0) setActiveTabId(next[next.length - 1].id);
      return next;
    });
  }, [activeTabId]);

  return (
    <div className="w-screen h-screen flex flex-col" style={{ background: '#09090B', padding: '16px 20px', gap: '16px' }}>
      {/* ── Command Bar ── */}
      <div 
        style={{ 
          borderRadius: '12px', 
          background: 'var(--cs-bg)', 
          boxShadow: '0 8px 30px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)', 
          overflow: 'hidden' 
        }}
      >
        <CommandBar repo={repo} branch="main" />
      </div>

      {/* ── Workspace body ── */}
      <div className="flex flex-1 min-h-0 gap-4">
        {/* Dock */}
        <div style={{ borderRadius: '12px', background: 'var(--cs-bg)', boxShadow: '0 8px 30px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)', overflow: 'hidden' }}>
          <Dock activeItem={dockActive} onSelect={setDockActive} />
        </div>

        {/* Investigation */}
        <div style={{ borderRadius: '12px', background: 'var(--cs-bg)', boxShadow: '0 8px 30px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)', overflow: 'hidden' }}>
          <InvestigationPanel
            events={events}
            attention={attention}
            startedAt={startedAt}
            memoryFiles={memoryFiles}
          />
        </div>

        {/* AI Overlay Editor */}
        <div className="flex-1 flex flex-col" style={{ borderRadius: '12px', background: 'var(--cs-bg)', boxShadow: '0 8px 30px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)', overflow: 'hidden' }}>
          <AIOverlayEditor
            tabs={tabs}
            activeTabId={activeTabId}
            onSelectTab={handleSelectTab}
            onCloseTab={handleCloseTab}
            attention={attention}
            insight={insight}
            runtimeStatus={runtimeStatus}
          />
        </div>

        {/* Knowledge */}
        <div style={{ borderRadius: '12px', background: 'var(--cs-bg)', boxShadow: '0 8px 30px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)', overflow: 'hidden' }}>
          <KnowledgePanel searchStatus={runtimeStatus === 'idle' ? 'searching' : 'found'} />
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center gap-6 flex-shrink-0 px-2" style={{ color: 'var(--cs-muted)', fontSize: '11px', fontWeight: 500 }}>
        <span>14 files touched</span>
        <div className="flex items-center gap-1.5 opacity-80">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
          <span>Live</span>
        </div>
        <span>Claude 3.7</span>
        <div className="flex items-center gap-1.5">
          <span style={{ color: 'var(--cs-accent)', fontSize: '10px' }}>✦</span>
          <span>Sourcegraph MCP</span>
        </div>
        <span style={{ color: 'var(--cs-hint)' }}>Latency 42ms</span>
      </div>
    </div>
  );
}
