import { useState, useEffect, useRef } from 'react';
import { useInvestigationSession, SESSION_STATES } from '../store/useInvestigationSession';

/**
 * useWorkspaceLifecycle
 * 
 * Manages the boot sequence and transition states of the workspace.
 * Extracted from WorkspaceRoot to decouple presentation from boot logic.
 */
export function useWorkspaceLifecycle({ repo, activeInvestigation, onNewInvestigation, rawSessionState }) {
  const [bootPhase, setBootPhase] = useState('booting');
  const [bootStatus, setBootStatus] = useState('Connecting...');
  const bootStartedRef = useRef(false);

  useEffect(() => {
    setBootPhase('booting');
    setBootStatus('Connecting...');
    bootStartedRef.current = false;

    if (!repo?.id) {
      // No real repo — boot immediately (demo mode)
      setTimeout(() => setBootPhase('ready'), 600);
      return;
    }

    if (repo.status === 'ready') {
      // Already indexed. If we haven't done understanding yet, trigger it.
      if (!useInvestigationSession.getState().repositoryContext.findings.length && !activeInvestigation) {
        setBootStatus('Initializing understanding pass...');
        setTimeout(() => {
          setBootPhase('understanding');
          if (onNewInvestigation) {
            onNewInvestigation('Repository Understanding', 'understanding');
          }
        }, 600);
      } else {
        setBootPhase('ready');
      }
      return;
    }

    // Repo is still indexing — subscribe to SSE progress
    const STEP_LABELS = {
      cloning:         'Cloning repository...',
      reading:         'Reading files...',
      parsing:         'Parsing AST...',
      resolve_imports: 'Resolving imports...',
      call_graph:      'Building call graph...',
      embeddings:      'Building embeddings...',
      ready:           'Analysis complete',
    };

    const eventSource = new EventSource(`http://localhost:5000/api/repo/${repo.id}/progress`);
    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.step && data.status === 'running') {
          setBootStatus(STEP_LABELS[data.step] || data.step);
        }
        if (data.step === 'ready' && data.status === 'done') {
          eventSource.close();
          setBootStatus('Analysis complete. Initializing understanding pass...');
          setTimeout(() => {
            setBootPhase('understanding');
            if (onNewInvestigation) {
              onNewInvestigation('Repository Understanding', 'understanding');
            }
          }, 600);
        }
        if (data.status === 'failed') {
          setBootStatus('Indexing failed — go back and retry');
          eventSource.close();
        }
      } catch (err) {
        console.error('[WorkspaceLifecycle] SSE parse error:', err);
      }
    };
    eventSource.onerror = () => eventSource.close();
    return () => eventSource.close();
  }, [repo, activeInvestigation, onNewInvestigation]);

  // Transition from understanding to ready when session completes
  useEffect(() => {
    if (bootPhase === 'understanding' && rawSessionState === SESSION_STATES.COMPLETED) {
      setBootPhase('ready');
    }
  }, [bootPhase, rawSessionState]);

  return { bootPhase, bootStatus };
}
