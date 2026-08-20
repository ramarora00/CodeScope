import { useState, useEffect, useRef } from 'react';
import { useInvestigationSession, SESSION_STATES } from '../store/useInvestigationSession';
import { API_BASE } from '../../../config/api';

/**
 * useWorkspaceLifecycle
 * 
 * Manages the boot sequence and transition states of the workspace.
 * Extracted from WorkspaceRoot to decouple presentation from boot logic.
 */
export function useWorkspaceLifecycle({ repo, activeInvestigation, onNewInvestigation, rawSessionState }) {
  const [bootPhase, setBootPhase] = useState('booting');
  const [bootStatus, setBootStatus] = useState('Connecting...');
  const [currentFile, setCurrentFile] = useState(null);
  const [currentLine, setCurrentLine] = useState(null);
  const [currentContent, setCurrentContent] = useState(null);
  const bootStartedRef = useRef(false);

  useEffect(() => {
    // Only reset if we are changing to a completely new repo
    if (bootStartedRef.current !== repo?.id) {
      if (repo?.status === 'ready') {
        setBootPhase('ready');
        setBootStatus('Workspace ready');
      } else {
        setBootPhase('booting');
        setBootStatus('Connecting...');
      }
      bootStartedRef.current = repo?.id;
    }

    if (!repo?.id) {
      setBootPhase('ready');
      return;
    }

    // If we're already past booting, do nothing here
    if (bootPhase === 'ready' || bootPhase === 'understanding') {
      return;
    }

    if (repo.status === 'ready') {
      if (!repo.understandingHash && !activeInvestigation) {
        setBootStatus('Initializing understanding pass...');
        setBootPhase('ready'); // Instantly unlock the workspace UI
        if (onNewInvestigation) {
          onNewInvestigation('Repository Understanding', 'understanding');
        }
      } else {
        setBootStatus('Workspace ready');
        setBootPhase('ready');
      }
      return;
    }

    const STEP_LABELS = {
      cloning:         'Cloning repository...',
      reading:         'Reading files...',
      parsing:         'Parsing AST...',
      resolve_imports: 'Resolving imports...',
      call_graph:      'Building call graph...',
      embeddings:      'Building embeddings...',
      ready:           'Analysis complete',
    };

    const eventSource = new EventSource(`${API_BASE}/api/repo/${repo.id}/progress`);
    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.step && data.status === 'running') {
          setBootStatus(STEP_LABELS[data.step] || data.step);
          
          if (data.file) {
            setCurrentFile(data.file);
            if (data.line) setCurrentLine(data.line);
            if (data.content) setCurrentContent(data.content);
          }
        }
        if (data.step === 'ready' && data.status === 'done') {
          eventSource.close();
          setBootStatus('Analysis complete. Initializing understanding pass...');
          setBootPhase('understanding');
          if (onNewInvestigation) {
            onNewInvestigation('Repository Understanding', 'understanding');
          }
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
  }, [repo, activeInvestigation, onNewInvestigation, bootPhase]);

  useEffect(() => {
    if (bootPhase === 'understanding' && rawSessionState === SESSION_STATES.COMPLETED) {
      setBootPhase('ready');
    }
  }, [bootPhase, rawSessionState]);

  return { bootPhase, bootStatus, currentFile, currentLine, currentContent };
}
