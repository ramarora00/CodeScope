import { useMemo } from 'react';
import { useInvestigationSession, SESSION_STATES } from './useInvestigationSession';
import { useWorkspaceStore } from './useWorkspaceStore';

/**
 * Rule 16: WorkspacePresentationModel Adapter
 * 
 * This hook is the ONLY place that understands both the investigation engine
 * (FocusContext/Zustand) and the premium UI presentation components.
 * It transforms raw backend state into the exact presentation contracts expected
 * by the v2 UI components. UI components must remain pure, render-only functions.
 */
export function useWorkspacePresentationModel() {
  const aiFocusFile = useInvestigationSession(s => s.aiFocusFile);
  const currentLine = useInvestigationSession(s => s.currentLine);
  const currentReason = useInvestigationSession(s => s.currentReason);
  const processedEvents = useInvestigationSession(s => s.processedEvents);
  const focusContext = useInvestigationSession(s => s.focusContext);
  const sessionState = useInvestigationSession(s => s.sessionState);

  const userSelectedFile = useWorkspaceStore(s => s.userSelectedFile);

  // Deriving display state: User interaction takes precedence over AI focus
  const displayedFile = userSelectedFile || aiFocusFile;

  // ── 1. AIOverlayEditor Contract ──
  const attention = useMemo(() => {
    if (!displayedFile) return {};
    const filePath = typeof displayedFile === 'string'
      ? displayedFile
      : displayedFile?.path;
      
    // If the user selected a file, the AI isn't reading it, so don't show the 'read' animation
    const isAiControlling = !userSelectedFile || userSelectedFile === aiFocusFile;
      
    return {
      file: filePath,
      line: isAiControlling ? (currentLine || 1) : null,
      type: (isAiControlling && sessionState === SESSION_STATES.PLAYING) ? 'read' : 'appear',
      reason: isAiControlling ? currentReason : 'User Selection',
    };
  }, [displayedFile, userSelectedFile, aiFocusFile, currentLine, currentReason, sessionState]);

  const runtimeStatus = useMemo(() => {
    if (focusContext.status === 'review') return 'resolved';
    if (sessionState === SESSION_STATES.PLAYING) return 'reading';
    return 'idle';
  }, [focusContext.status, sessionState]);

  const insight = useMemo(() => {
    if (!focusContext.findings || focusContext.findings.length === 0) return null;
    return focusContext.findings[focusContext.findings.length - 1]?.text || null;
  }, [focusContext.findings]);

  const aiPhase = useMemo(() => {
    switch (focusContext.status) {
      case 'planning':     return 'understanding';
      case 'investigating':return 'connecting';
      case 'review':       return 'concluding';
      default:             return 'searching';
    }
  }, [focusContext.status]);

  const tabs = useMemo(() => {
    const seen = new Set();
    const eventFiles = processedEvents
      .filter(e => (e.type === 'file.selected' || e.type === 'appear') && e.file)
      .map(e => e.file);
      
    // Always ensure userSelectedFile is in the tabs if they clicked it
    if (userSelectedFile) {
       eventFiles.push(typeof userSelectedFile === 'string' ? userSelectedFile : userSelectedFile.path);
    }
    
    return eventFiles.filter(f => {
        if (seen.has(f)) return false;
        seen.add(f);
        return true;
      })
      .map(f => ({ id: f, name: f, path: f }));
  }, [processedEvents, userSelectedFile]);

  const activeTabId = useMemo(() => {
    if (!displayedFile) return null;
    return typeof displayedFile === 'string'
      ? displayedFile
      : displayedFile?.path;
  }, [displayedFile]);

  // ── 2. InvestigationPanel Contract ──
  const timelineEvents = useMemo(() => {
    const events = [];
    let idCounter = 1;
    for (const e of processedEvents) {
      if (e.type === 'file.selected') {
        events.push({ id: idCounter++, type: e.type, title: 'Selected File', description: e.reason || e.file, time: new Date(e.timestamp || Date.now()).toLocaleTimeString() });
      } else if (e.type === 'planner.completed') {
        events.push({ id: idCounter++, type: e.type, title: 'Plan Generated', description: e.plan?.hypothesis || 'Created execution plan', time: new Date(e.timestamp || Date.now()).toLocaleTimeString() });
      } else if (e.type === 'jump.started') {
        events.push({ id: idCounter++, type: e.type, title: 'Jumping', description: e.reason || `Jumping to ${e.target}`, time: new Date(e.timestamp || Date.now()).toLocaleTimeString() });
      } else if (e.type === 'evidence.added') {
        events.push({ id: idCounter++, type: e.type, title: 'Fact Discovered', description: e.fact, time: new Date(e.timestamp || Date.now()).toLocaleTimeString() });
      }
    }
    
    // Set status on the last event to active, others to done
    if (events.length > 0) {
      for (let i = 0; i < events.length - 1; i++) {
        events[i].status = 'done';
      }
      events[events.length - 1].status = (focusContext.status === 'review' || sessionState === SESSION_STATES.IDLE || sessionState === SESSION_STATES.ERROR) ? 'done' : 'active';
    }
    
    return events;
  }, [processedEvents, focusContext.status, sessionState]);

  const planSteps = useMemo(() => {
    // If the backend has a mission/plan, extract steps. Otherwise fallback to mock for visuals
    if (!focusContext.mission) return [];
    
    const steps = [];
    if (focusContext.mission) {
      steps.push({ id: 1, label: focusContext.mission, active: focusContext.status === 'investigating', done: focusContext.status === 'review' });
    }
    if (focusContext.currentStep) {
      steps.push({ id: 2, label: focusContext.currentStep, active: true, done: false });
    }
    return steps;
  }, [focusContext]);

  // ── 3. KnowledgePanel Contract ──
  const findings = useMemo(() => {
    return (focusContext.findings || []).map(f => {
      const filePath = typeof f.source === 'string' ? f.source : f.source?.file;
      return {
        name: filePath ? filePath.split('/').pop() : 'Finding',
        filePath: filePath,
        active: true,
        text: f.fact
      };
    });
  }, [focusContext.findings]);

  const relatedSymbols = useMemo(() => {
    return (focusContext.relatedNodes || []).map(r => ({
      symbol: r.name || r.id,
      file: r.file || 'unknown',
      line: r.line || 1
    }));
  }, [focusContext.relatedNodes]);

  const answer = focusContext.answer;
  const selectedTimelineEventId = useWorkspaceStore(s => s.selectedTimelineEventId);
  const onReturnToPresent = () => useWorkspaceStore.getState().setSelectedTimelineEventId(null);
  
  const selectedRepo = useWorkspaceStore(s => s.selectedRepo);
  const onSelectFile = (file) => useWorkspaceStore.getState().setUserSelectedFile(file);
  const repositoryContext = useInvestigationSession(s => s.repositoryContext);
  const isUnderstandingMode = useInvestigationSession(s => s.metadata.isUnderstandingMode);

  // ── 4. Camera Ownership Contract ──
  const userCamera = useWorkspaceStore(s => s.userCamera);
  // Derived AI camera based on aiFocusFile
  const aiCamera = useMemo(() => {
    if (!aiFocusFile) return null;
    return { node: aiFocusFile, x: 0, y: 0, zoom: 1 };
  }, [aiFocusFile]);
  
  const currentCamera = userCamera || aiCamera;
  const onReturnToAI = () => {
    useWorkspaceStore.getState().setUserSelectedFile(null);
    useWorkspaceStore.getState().setUserCamera(null);
  };

  return {
    presentation: {
      attention,
      runtimeStatus,
      insight,
      aiPhase,
      tabs,
      activeTabId,
      timelineEvents,
      planSteps,
      findings,
      relatedSymbols,
      answer,
      selectedTimelineEventId,
      onReturnToPresent,
      selectedRepo,
      userSelectedFile,
      onSelectFile,
      repositoryContext,
      isUnderstandingMode,
      currentCamera,
      userCamera,
      onReturnToAI
    },
    raw: {
      sessionState,
      focusContext
    }
  };
}
