import React, { useState, useEffect, useRef } from 'react';
import WorkspaceLayout from './WorkspaceLayout';
import Dock from './Dock';
import CommandBar from './CommandBar';
import ActivitySidebar from './ActivitySidebar';
import MainWorkspace from './MainWorkspace';
import KnowledgePanel from './KnowledgePanel';
import { ClaudeRuntime, MOCK_FILES } from '../../model/ClaudeRuntime';
import { globalFocusController } from '../../model/FocusController';

export default function WorkspaceShell({
  repo,
  repos = [],
  onSelectRepo,
  onConnectNew,
  activeInvestigation,
  onNewInvestigation
}) {
  const [activeDockTab, setActiveDockTab] = useState('explorer');
  const [tabs, setTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);

  // Unified Attention Model State
  const [attention, setAttention] = useState({
    file: null,
    line: null,
    symbol: null,
    reason: null,
    confidence: null,
    nextTarget: null
  });

  // Runtime reasoning status: 'idle' | 'reading' | 'resolved'
  const [runtimeStatus, setRuntimeStatus] = useState('idle');
  const [resolveText, setResolveText] = useState(null);

  const runtimeRef = useRef(null);

  // ── File content: backend first, mock fallback ──
  const [fileContent, setFileContent] = useState('');
  const [fileLoading, setFileLoading] = useState(false);

  // Resolve file content: simulation files always use MOCK_FILES,
  // real repo files fetch from backend with mock fallback.
  useEffect(() => {
    if (!activeTabId) {
      setFileContent('');
      return;
    }

    const activeFile = tabs.find(t => t.id === activeTabId);
    const filePath = activeFile ? activeFile.path : activeTabId;

    // Simulation files: ALWAYS use mock content. Never let the backend
    // override these — they are tied to the Claude Runtime script.
    const mockContent = MOCK_FILES[activeTabId] || MOCK_FILES[filePath] || null;
    if (mockContent) {
      setFileContent(mockContent);
      setFileLoading(false);
      return;
    }

    // Non-simulation files: try the backend, fall back to empty
    if (repo) {
      setFileLoading(true);
      fetch(`http://localhost:5000/api/repo/${repo.id}/file/content?filePath=${encodeURIComponent(filePath)}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          setFileContent(data?.content?.trim() ? data.content : '');
        })
        .catch(() => setFileContent(''))
        .finally(() => setFileLoading(false));
    } else {
      setFileContent('');
    }
  }, [repo, activeTabId, tabs]);

  // ── Initialize workspace and auto-start simulation ──
  useEffect(() => {
    // Seed initial tab
    const initialTabs = [
      { id: 'auth.ts', name: 'auth.ts', path: 'middleware/auth.ts', openedByAI: false }
    ];
    setTabs(initialTabs);
    setActiveTabId('auth.ts');
    setAttention({
      file: 'auth.ts',
      line: null,
      symbol: null,
      reason: 'Initializing workspace…',
      confidence: 100,
      nextTarget: null
    });

    // Auto-start the reasoning simulation after a brief mount delay
    const autoStartTimer = setTimeout(() => {
      startRuntime('Analyze authentication flow');
    }, 800);

    return () => clearTimeout(autoStartTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── FocusController sync ──
  useEffect(() => {
    const unsubscribeFocus = globalFocusController.subscribe((newAttention) => {
      setAttention(newAttention);
      if (newAttention.file) {
        const tabId = newAttention.file;
        setTabs((prev) => {
          if (prev.some(t => t.id === tabId)) return prev;
          return [
            ...prev,
            {
              id: tabId,
              name: tabId,
              path: tabId,
              openedByAI: newAttention.source === 'reasoning-engine'
            }
          ];
        });
        setActiveTabId(tabId);
      }
    });

    return () => {
      unsubscribeFocus();
      if (runtimeRef.current) {
        runtimeRef.current.stopSimulation();
      }
    };
  }, []);

  // ── Core runtime start function ──
  const startRuntime = (queryText) => {
    if (runtimeRef.current) {
      runtimeRef.current.stopSimulation();
    }

    setRuntimeStatus('reading');
    setResolveText(null);

    const runtime = new ClaudeRuntime();
    runtimeRef.current = runtime;

    runtime.subscribe((step) => {
      if (
        step.type === 'appear' ||
        step.type === 'read' ||
        step.type === 'follow' ||
        step.type === 'jump'
      ) {
        const targetFile = step.file || attention.file;

        if (targetFile) {
          setTabs((prev) => {
            if (prev.some(t => t.id === targetFile)) {
              if (step.type === 'jump') {
                return prev.map(t =>
                  t.id === targetFile ? { ...t, openedByAI: true } : t
                );
              }
              return prev;
            }
            return [
              ...prev,
              {
                id: targetFile,
                name: targetFile,
                path: targetFile,
                openedByAI: step.type === 'jump'
              }
            ];
          });
          setActiveTabId(targetFile);
        }

        globalFocusController.updateAttention({
          file: targetFile,
          line: step.line || null,
          symbol: step.symbol || null,
          reason: step.reason || '',
          confidence: step.confidence || 100,
          nextTarget: step.nextTarget || null,
          source: 'reasoning-engine'
        });
      } else if (step.type === 'pause') {
        // No-op for pause events — pacing is handled by runtime timer
      } else if (step.type === 'resolve') {
        setRuntimeStatus('resolved');
        setResolveText(step.reason);
        globalFocusController.updateAttention({
          file: attention.file,
          line: null,
          symbol: null,
          reason: step.reason,
          confidence: 100,
          source: 'reasoning-engine'
        });
      }
    });

    runtime.startSimulation();
  };

  // ── Handle user query from CommandBar ──
  const handleNewAnalysis = (queryText) => {
    if (onNewInvestigation) {
      onNewInvestigation(queryText);
    }
    startRuntime(queryText);
  };

  // ── Manual file select from Explorer ──
  const handleFileSelect = (file) => {
    globalFocusController.focusFile(file.path || file.name);
  };

  // ── Close tab ──
  const handleCloseTab = (tabId) => {
    setTabs((prev) => {
      const nextTabs = prev.filter(t => t.id !== tabId);
      if (activeTabId === tabId) {
        if (nextTabs.length > 0) {
          const nextActive = nextTabs[nextTabs.length - 1].id;
          setActiveTabId(nextActive);
          globalFocusController.focusFile(nextActive);
        } else {
          setActiveTabId(null);
          setAttention({
            file: null, line: null, symbol: null,
            reason: null, confidence: null, nextTarget: null
          });
        }
      }
      return nextTabs;
    });
  };

  const activeFile = tabs.find(t => t.id === activeTabId) || null;

  return (
    <WorkspaceLayout
      commandBar={
        <CommandBar
          repo={repo}
          repos={repos}
          onSelectRepo={onSelectRepo}
          onConnectNew={onConnectNew}
          onNewAnalysis={handleNewAnalysis}
          activeAnalysis={activeInvestigation}
          runtimeStatus={runtimeStatus}
        />
      }
      dock={
        <Dock
          activeTab={activeDockTab}
          onTabSelect={(tabId) => setActiveDockTab(tabId)}
        />
      }
      sidebar={
        <ActivitySidebar
          activeTab={activeDockTab}
          repo={repo}
          onFileSelect={handleFileSelect}
        />
      }
      main={
        <MainWorkspace
          tabs={tabs}
          activeTabId={activeTabId}
          onSelectTab={(tabId) => {
            setActiveTabId(tabId);
            globalFocusController.focusFile(tabId);
          }}
          onCloseTab={handleCloseTab}
          repo={repo}
          attention={attention}
          fileContent={fileContent}
          fileLoading={fileLoading}
          runtimeStatus={runtimeStatus}
          resolveText={resolveText}
        />
      }
      knowledge={
        <KnowledgePanel
          activeFile={activeFile}
          attention={attention}
        />
      }
    />
  );
}
