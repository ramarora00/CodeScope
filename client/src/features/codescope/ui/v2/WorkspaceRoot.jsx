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
  const [aiPhase, setAiPhase]           = useState('searching'); // searching|understanding|connecting|verifying|concluding
  
  const [bootPhase, setBootPhase]       = useState('booting'); // 'booting' | 'ready'
  const [bootStatus, setBootStatus]     = useState('Repository');

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

      case 'phase': {
        setAiPhase(event.phase);
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

    let t1, t2, t3, t4;
    t1 = setTimeout(() => setBootStatus('Indexing'), 800);
    t2 = setTimeout(() => setBootStatus('Preparing graph'), 1800);
    t3 = setTimeout(() => setBootStatus('Ready'), 2600);
    t4 = setTimeout(() => {
      setBootPhase('ready');
      setStartedAt(Date.now());
      runtime.start();
    }, 2900);

    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4);
      runtime.stop();
      unsub();
    };
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
    <div
      className="w-screen h-screen flex flex-col"
      style={{
        background: '#09090B',
        padding: '16px 20px',
        gap: '12px',
        cursor: runtimeStatus !== 'resolved' ? 'none' : 'default',
      }}
    >
      {/* ── Command Bar ── */}
      <div
        className="animate-settle flex-shrink-0"
        style={{
          borderRadius: '12px',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.05)',
          overflow: 'hidden',
          animationDelay: '0ms',
        }}
      >
        <CommandBar repo={repo} branch="main" />
      </div>

      {/* ── Workspace body ── */}
      {bootPhase === 'booting' ? (
        <div className="flex flex-1 items-center justify-center min-h-0 animate-fade-in">
          <div className="flex flex-col items-center gap-6">
            <div className="w-5 h-5 rounded-full border-[1.5px] border-[rgba(255,255,255,0.05)] border-t-[var(--cs-accent)] animate-spin" />
            <span style={{ color: 'var(--cs-text)', fontSize: '13px', letterSpacing: '0.02em', fontWeight: 500 }} className="animate-pulse-dot">
              {bootStatus}
            </span>
          </div>
        </div>
      ) : (
      <div className="flex flex-1 min-h-0 gap-3">
        {/* Dock */}
        <div
          className="animate-settle flex-shrink-0"
          style={{
            borderRadius: '12px',
            background: 'var(--cs-panel)',
            border: '1px solid var(--cs-border)',
            boxShadow: 'var(--cs-shadow-panel)',
            overflow: 'hidden',
            animationDelay: '60ms',
          }}
        >
          <Dock activeItem={dockActive} onSelect={setDockActive} />
        </div>

        {/* Investigation */}
        <div
          className="animate-settle flex-shrink-0"
          style={{
            marginTop: '2px', // optical asymmetry
            borderRadius: '12px',
            background: 'var(--cs-panel)',
            border: '1px solid var(--cs-border)',
            boxShadow: 'var(--cs-shadow-panel)',
            overflow: 'hidden',
            animationDelay: '100ms',
          }}
        >
          <InvestigationPanel
            events={events}
            attention={attention}
            startedAt={startedAt}
            memoryFiles={memoryFiles}
          />
        </div>

        {/* AI Overlay Editor */}
        <div
          className="animate-settle flex-1 flex flex-col min-w-0"
          style={{
            borderRadius: '12px',
            background: 'var(--cs-panel)',
            border: '1px solid var(--cs-border)',
            boxShadow: 'var(--cs-shadow-panel)',
            overflow: 'hidden',
            animationDelay: '140ms',
          }}
        >
          <AIOverlayEditor
            tabs={tabs}
            activeTabId={activeTabId}
            onSelectTab={handleSelectTab}
            onCloseTab={handleCloseTab}
            attention={attention}
            insight={insight}
            runtimeStatus={runtimeStatus}
            aiPhase={aiPhase}
          />
        </div>

        {/* Knowledge */}
        <div
          className="animate-settle flex-shrink-0"
          style={{
            borderRadius: '12px',
            background: 'var(--cs-panel)',
            border: '1px solid var(--cs-border)',
            boxShadow: 'var(--cs-shadow-panel)',
            overflow: 'hidden',
            animationDelay: '180ms',
          }}
        >
          <KnowledgePanel
            searchStatus={runtimeStatus === 'idle' ? 'searching' : 'found'}
            filesTouchedCount={memoryFiles.length}
          />
        </div>
      </div>
      )}

      {/* ── Footer — live runtime metadata ── */}
      <div
        className="flex items-center gap-5 flex-shrink-0 px-2 animate-settle"
        style={{ color: 'rgba(255,255,255,0.28)', fontSize: '10.5px', fontWeight: 400, animationDelay: '220ms' }}
      >
        <span style={{ color: 'rgba(255,255,255,0.45)' }}>
          {memoryFiles.length > 0 ? `${memoryFiles.length} file${memoryFiles.length > 1 ? 's' : ''} touched` : 'Indexing...'}
        </span>
        <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
        <div className="flex items-center gap-1.5">
          <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#3FB950', opacity: 0.8 }} />
          <span>Live</span>
        </div>
        <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
        <span>Claude 3.7</span>
        <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
        <div className="flex items-center gap-1">
          <span style={{ color: 'rgba(191,200,216,0.4)', fontSize: '9px' }}>✦</span>
          <span>Sourcegraph MCP</span>
        </div>
        <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
        <span>Latency {runtimeStatus === 'reading' ? '38ms' : '—'}</span>
      </div>
    </div>
  );
}
