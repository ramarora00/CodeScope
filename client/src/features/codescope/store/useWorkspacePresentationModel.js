import { useMemo } from 'react';
import { useInvestigationSession, SESSION_STATES } from './useInvestigationSession';

/**
 * Rule 16: WorkspacePresentationModel Adapter
 * 
 * This hook is the ONLY place that understands both the investigation engine
 * (FocusContext/Zustand) and the premium UI presentation components.
 * It transforms raw backend state into the exact presentation contracts expected
 * by the v2 UI components. UI components must remain pure, render-only functions.
 */
export function useWorkspacePresentationModel() {
  const currentActiveFile = useInvestigationSession(s => s.currentActiveFile);
  const currentLine       = useInvestigationSession(s => s.currentLine);
  const currentReason     = useInvestigationSession(s => s.currentReason);
  const processedEvents   = useInvestigationSession(s => s.processedEvents);
  const focusContext      = useInvestigationSession(s => s.focusContext);
  const sessionState      = useInvestigationSession(s => s.sessionState);

  // ── 1. AIOverlayEditor Contract ──
  const attention = useMemo(() => {
    if (!currentActiveFile) return {};
    const filePath = typeof currentActiveFile === 'string'
      ? currentActiveFile
      : currentActiveFile?.path;
    return {
      file:   filePath,
      line:   currentLine || 1,
      type:   sessionState === SESSION_STATES.PLAYING ? 'read' : 'appear',
      reason: currentReason,
    };
  }, [currentActiveFile, currentLine, currentReason, sessionState]);

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
    return processedEvents
      .filter(e => (e.type === 'file.selected' || e.type === 'appear') && e.file)
      .filter(e => {
        if (seen.has(e.file)) return false;
        seen.add(e.file);
        return true;
      })
      .map(e => ({ id: e.file, name: e.file, path: e.file }));
  }, [processedEvents]);

  const activeTabId = useMemo(() => {
    if (!currentActiveFile) return null;
    return typeof currentActiveFile === 'string'
      ? currentActiveFile
      : currentActiveFile?.path;
  }, [currentActiveFile]);

  // ── 2. InvestigationPanel Contract ──
  const timelineEvents = useMemo(() => {
    const events = [];
    let idCounter = 1;
    for (const e of processedEvents) {
      if (e.type === 'file.selected') {
        events.push({ id: idCounter++, title: 'Selected File', description: e.reason || e.file, time: new Date(e.timestamp || Date.now()).toLocaleTimeString() });
      } else if (e.type === 'planner.completed') {
        events.push({ id: idCounter++, title: 'Plan Generated', description: e.plan?.hypothesis || 'Created execution plan', time: new Date(e.timestamp || Date.now()).toLocaleTimeString() });
      } else if (e.type === 'jump.started') {
        events.push({ id: idCounter++, title: 'Jumping', description: e.reason || `Jumping to ${e.target}`, time: new Date(e.timestamp || Date.now()).toLocaleTimeString() });
      } else if (e.type === 'evidence.added') {
        events.push({ id: idCounter++, title: 'Fact Discovered', description: e.fact, time: new Date(e.timestamp || Date.now()).toLocaleTimeString() });
      }
    }
    return events;
  }, [processedEvents]);

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
    return (focusContext.findings || []).map(f => ({
      name: typeof f.source === 'string' ? f.source.split('/').pop() : f.source?.file || 'Finding',
      active: true,
      text: f.fact
    }));
  }, [focusContext.findings]);

  const relatedSymbols = useMemo(() => {
    return (focusContext.relatedNodes || []).map(r => ({
      symbol: r.name || r.id,
      file: r.file || 'unknown',
      line: r.line || 1
    }));
  }, [focusContext.relatedNodes]);

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
    },
    raw: {
      sessionState,
      focusContext
    }
  };
}
