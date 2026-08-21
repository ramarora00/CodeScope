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
  const investigationState = useInvestigationSession(s => s.investigationState);
  const isAsset = useInvestigationSession(s => s.isAsset);
  const activeCognitiveEvent = useInvestigationSession(s => s.activeCognitiveEvent);
  const commitActiveCognitiveEvent = useInvestigationSession(s => s.commitActiveCognitiveEvent);
  const startLine = useInvestigationSession(s => s.startLine);
  const endLine = useInvestigationSession(s => s.endLine);

  const lockedAttention = useInvestigationSession(s => s.lockedAttention);

  const userSelectedFile = useWorkspaceStore(s => s.userSelectedFile);

  // Deriving display state: User interaction takes precedence over AI focus
  const displayedFile = userSelectedFile || aiFocusFile;

  // ── 1. AIOverlayEditor Contract ──
  //
  // Canonical resolver — strictly ordered, never hybrid:
  //   1. lockedAttention  (atomic: file+startLine+endLine+reason from ONE event boundary)
  //   2. committed state  (fallback: before first file.read.started)
  //   3. user selected    (user took control — no AI attention fields shown)
  //
  // INVARIANT: attention.file, .startLine, .endLine, .reason must always be
  // consistent with each other. Never mix fields from different events.
  const attention = useMemo(() => {
    // User selected a different file — show it, but no AI attention fields
    const isAiControlling = !userSelectedFile ||
      (typeof userSelectedFile === 'string'
        ? userSelectedFile === aiFocusFile
        : userSelectedFile?.path === aiFocusFile);

    if (!isAiControlling) {
      const filePath = typeof userSelectedFile === 'string'
        ? userSelectedFile
        : userSelectedFile?.path;
      return {
        file: filePath,
        line: null,
        startLine: null,
        endLine: null,
        reason: 'User Selection',
        type: 'appear',
      };
    }

    if (!aiFocusFile) return {};

    const aiFocusFilePath = typeof aiFocusFile === 'string'
      ? aiFocusFile
      : aiFocusFile?.path;

    const isPlaying = sessionState === SESSION_STATES.PLAYING;

    // Priority 1: lockedAttention — atomically set on file.read.started
    // All 4 fields guaranteed to be from the same event boundary
    if (lockedAttention && lockedAttention.file === aiFocusFilePath) {
      return {
        file: lockedAttention.file,
        line: currentLine || lockedAttention.startLine || 1,
        startLine: lockedAttention.startLine,
        endLine: lockedAttention.endLine,
        reason: lockedAttention.reason,
        type: isPlaying ? 'read' : 'appear',
      };
    }

    // Priority 2: committed state (before file.read.started fires, or after file.read.completed)
    // Still from the same file — no stale line ranges from a different file can leak in
    return {
      file: aiFocusFilePath,
      line: currentLine || 1,
      startLine: startLine,
      endLine: endLine,
      reason: currentReason,
      type: isPlaying ? 'read' : 'appear',
    };
  }, [lockedAttention, aiFocusFile, userSelectedFile, currentLine, startLine, endLine, currentReason, sessionState]);

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
    return focusContext.findings || [];
  }, [focusContext.findings]);

  const relatedSymbols = useMemo(() => {
    return (focusContext.relatedNodes || []).map(r => ({
      symbol: r.name || r.id,
      type: r.type,
      location: typeof r.source === 'string' ? r.source : r.source?.file
    }));
  }, [focusContext.relatedNodes]);

  const intelligenceStream = useMemo(() => {
    const stream = [];
    let idCounter = 1;
    for (const e of processedEvents) {
      if (e.type === 'evidence.added') {
        stream.push({ id: idCounter++, type: 'Evidence', text: e.fact, source: e.source, active: true });
      } else if (e.type === 'knowledge.added') {
        stream.push({ id: idCounter++, type: 'Just learned', text: e.knowledge, source: e.source, active: true });
      } else if (e.type === 'symbol.discovered') {
        stream.push({ id: idCounter++, type: 'Following', text: `Discovered ${e.symbol}`, source: e.source, active: true });
      }
    }
    return stream.reverse();
  }, [processedEvents]);

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

  const isResolving = focusContext.status === 'review';

  // ── 3. AI Memory Map Contract (FileExplorer) ──
  const aiMemoryMap = useMemo(() => {
    const map = {};
    for (const e of processedEvents) {
      const ts = new Date(e.timestamp || Date.now()).getTime();
      if (e.type === 'file.selected' || e.type === 'jump.completed') {
        const file = e.file || e.to;
        if (!file) continue;
        if (!map[file]) map[file] = { state: 'scanned', summary: null, lastInvestigatedTime: ts };
        map[file].lastInvestigatedTime = ts;
      }
      if (e.type === 'file.read.completed') {
        if (!map[e.file]) map[e.file] = { state: 'scanned', summary: null, lastInvestigatedTime: ts };
        map[e.file].state = 'investigated';
        map[e.file].lastInvestigatedTime = ts;
      }
      if (e.type === 'evidence.added') {
        const file = e.source;
        if (file) {
          if (!map[file]) map[file] = { state: 'scanned', summary: null, lastInvestigatedTime: ts };
          map[file].state = 'core';
          map[file].summary = e.fact;
          map[file].lastInvestigatedTime = ts;
        }
      }
    }
    return map;
  }, [processedEvents]);

  return {
    presentation: {
      attention,
      isAsset,
      runtimeStatus,
      insight,
      aiPhase,
      tabs,
      activeTabId,
      timelineEvents,
      planSteps,
      findings,
      relatedSymbols,
      intelligenceStream,
      answer,
      providerUsed: focusContext.providerUsed,
      isResolving,
      aiMemoryMap,
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
    orchestration: {
      activeCognitiveEvent,
      commitActiveCognitiveEvent
    },
    raw: {
      sessionState,
      investigationState,
      focusContext
    }
  };
}
