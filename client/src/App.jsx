import { useState, useEffect, useMemo } from 'react';
import { API_BASE } from './config/api';
import { apiFetch } from './config/apiFetch';
import { useInvestigationSession } from './features/codescope/store/useInvestigationSession';
import { useWorkspaceStore } from './features/codescope/store/useWorkspaceStore';
import LaunchExperience from './features/codescope/ui/LaunchExperience';
import WorkspaceRoot from './features/codescope/ui/v2/WorkspaceRoot';
import LoginPage from './features/auth/ui/LoginPage/LoginPage';
import { subscribeToAuthChanges } from './auth/authService';
import './App.css';

function App() {
  const [appState, setAppState] = useState('loading');
  const [user, setUser] = useState(null);
  const [repos, setRepos] = useState([]);
  const [activeDashboardRepoId, setActiveDashboardRepoId] = useState(null);
  
  const [isConnecting, setIsConnecting] = useState(false);
  
  const { selectedRepo, setSelectedRepo, activeInvestigationId, setActiveInvestigationId, setUserSelectedFile } = useWorkspaceStore();
  
  // Investigation States
  const [investigations, setInvestigations] = useState([]);

  const hasIndexingRepo = useMemo(() => {
    const activeStatuses = ['cloning', 'indexing', 'mapping', 'syncing'];
    return repos.some(r => activeStatuses.includes(r.status));
  }, [repos]);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Do not force 'launch' here. Let the initial load effect handle hydration
        // and resolve the correct appState (workspace or launch).
      } else {
        setAppState('login');
        setRepos([]);
        setActiveDashboardRepoId(null);
        useWorkspaceStore.getState().resetWorkspace();
        localStorage.removeItem('codescope_last_repo_id');
      }
    });
    return () => unsubscribe();
  }, []);

  // Initial load effect
  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    
    apiFetch(`${API_BASE}/api/repo`, { signal: controller.signal })
      .then(r => r.json())
      .then(d => { 
        if (Array.isArray(d)) {
          setRepos(d); 
          
          let resolvedAppState = 'launch';
          let resolvedDashboardRepoId = null;

          const lastRepoId = localStorage.getItem('codescope_last_repo_id');
          if (lastRepoId) {
            const restoredRepo = d.find(r => r.id === lastRepoId);
            if (!restoredRepo) {
              localStorage.removeItem('codescope_last_repo_id');
            } else if (restoredRepo.status === 'ready') {
              setSelectedRepo(restoredRepo);
              resolvedAppState = 'workspace';
            } else if (restoredRepo.status === 'error') {
              resolvedDashboardRepoId = restoredRepo.id;
            } else {
              // syncing, cloning, indexing, mapping
              setSelectedRepo(restoredRepo);
              resolvedDashboardRepoId = restoredRepo.id;
            }
          }

          if (resolvedAppState === 'launch' && !resolvedDashboardRepoId) {
             const active = d.find(r => ['cloning', 'indexing', 'mapping', 'syncing'].includes(r.status));
             if (active) resolvedDashboardRepoId = active.id;
          }

          if (resolvedDashboardRepoId) {
            setActiveDashboardRepoId(resolvedDashboardRepoId);
          }
          setAppState(resolvedAppState);
        }
      })
      .catch(e => {
        if (e.name !== 'AbortError') {
          console.error(e);
          setAppState('launch');
        }
      });

    return () => controller.abort();
  }, [user, setSelectedRepo]);

  // Dedicated Polling Effect for Indexing/Syncing
  useEffect(() => {
    if (!user || !hasIndexingRepo) return;
    
    let isPolling = true;
    let pollTimeout;
    const controller = new AbortController();

    const poll = async () => {
      try {
        const response = await apiFetch(`${API_BASE}/api/repo`, { signal: controller.signal });
        const data = await response.json();
        if (!Array.isArray(data)) return; // Guard: ignore non-array (e.g. auth error response)
        setRepos(data);
        
        const activeStatuses = ['cloning', 'indexing', 'mapping', 'syncing'];
        if (isPolling && data.some(r => activeStatuses.includes(r.status))) {
          pollTimeout = setTimeout(poll, 5000);
        }
      } catch (e) {
        if (e.name !== 'AbortError') console.error(e);
      }
    };

    pollTimeout = setTimeout(poll, 5000);

    return () => {
      isPolling = false;
      clearTimeout(pollTimeout);
      controller.abort();
    };
  }, [user, hasIndexingRepo]);

  const handleConnect = async (urlOrPath) => {
    if (urlOrPath === '__demo__') {
      setSelectedRepo(null);
      setAppState('workspace');
      return;
    }

    if (urlOrPath.startsWith('__repo__')) {
      const repoId = urlOrPath.replace('__repo__', '');
      const existing = repos.find(r => r.id === repoId);
      if (existing) {
        if (existing.status !== 'ready') return;
        handleSelectRepo(existing);
        return;
      }
    }

    try {
      setIsConnecting(true);
      const isLocal = !urlOrPath.startsWith('http') && !urlOrPath.startsWith('git@');
      let response;
      if (isLocal) {
        const dirName = urlOrPath.replace(/\\/g, '/').split('/').pop() || 'local-repo';
        response = await apiFetch(`${API_BASE}/api/repo/index-local`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ localPath: urlOrPath, name: dirName })
        });
      } else {
        response = await apiFetch(`${API_BASE}/api/repo/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repoUrl: urlOrPath })
        });
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to connect repository');

      setRepos(prev => [data, ...prev]);
      setActiveDashboardRepoId(data.id);
      setUserSelectedFile(null); // Clear previous file selection
      setSelectedRepo(data);
      localStorage.setItem('codescope_last_repo_id', data.id);
      useInvestigationSession.getState().resetSession(data.id);
      
      if (data.status === 'ready') {
        setAppState('workspace');
        if (window.location.hash !== '#workspace') {
          window.history.pushState({ appState: 'workspace' }, '', '#workspace');
        }
      }
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSelectRepo = (repo) => {
    setUserSelectedFile(null); // Bug Fix: clear any ghost file selection from previous repo
    setSelectedRepo(repo);
    localStorage.setItem('codescope_last_repo_id', repo.id);
    useInvestigationSession.getState().resetSession(repo.id);
    setAppState('workspace');
    if (window.location.hash !== '#workspace') {
      window.history.pushState({ appState: 'workspace' }, '', '#workspace');
    }
  };

  const handleConnectNew = (fromPopState) => {
    const isPop = fromPopState === true;
    setUserSelectedFile(null); // Clear file selection when going back to home
    setActiveDashboardRepoId(null); // Reset active analysis card
    localStorage.removeItem('codescope_last_repo_id');
    setAppState('launch');
    if (!isPop && window.location.hash === '#workspace') {
      window.history.back();
    }
  };

  const activeInvestigation = useMemo(() => {
    return investigations.find(i => i.id === activeInvestigationId) || null;
  }, [investigations, activeInvestigationId]);

  useEffect(() => {
    return useInvestigationSession.subscribe((state) => {
      if (activeInvestigationId) {
        if (state.sessionState === 'completed' || state.sessionState === 'error') {
          setInvestigations(prev => prev.map(inv => {
            if (inv.id === activeInvestigationId) {
              return {
                ...inv,
                status: state.sessionState === 'completed' ? 'completed' : 'failed',
                conclusion: state.focusContext.answer || state.currentReason || 'Investigation closed'
              };
            }
            return inv;
          }));
        }
      }
    });
  }, [activeInvestigationId]);

  useEffect(() => {
    const handlePopState = (e) => {
      // If the back button is pressed and we're no longer on the investigation hash, clear it
      if (activeInvestigationId && window.location.hash !== '#investigation') {
        clearInvestigation(true);
      } 
      // If we are in the workspace but the hash is now empty (back past #workspace)
      else if (!activeInvestigationId && appState === 'workspace' && window.location.hash === '') {
        handleConnectNew(true);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeInvestigationId, appState]);

  const startNewInvestigation = async (queryText, mode = 'investigation') => {
    // Cancel any existing backend investigation first
    if (selectedRepo?.id) {
      try {
        await apiFetch(`${API_BASE}/api/repo/${selectedRepo.id}/investigate`, {
          method: 'DELETE'
        });
      } catch (e) {
        // Ignore — there may not be an active investigation
      }
    }

    // Bug Fix: Clear any manually selected file so the AI can control the active tab during investigation
    setUserSelectedFile(null);

    const newId = Date.now().toString();
    const newInv = {
      id: newId,
      title: queryText,
      query: queryText,
      mode: mode,
      status: 'running',
      operations: [
        { id: '1', label: `Starting investigation for "${queryText}"`, status: 'running' }
      ],
      evidence: null,
      conclusion: null
    };

    setInvestigations(prev => [newInv, ...prev]);
    setActiveInvestigationId(newId);

    // Push history state so the browser back button can be used to exit the investigation
    if (window.location.hash !== '#investigation') {
      window.history.pushState({ investigation: newId }, '', '#investigation');
    }
  };

  const clearInvestigation = async (fromPopState) => {
    const isPop = fromPopState === true;
    if (selectedRepo?.id) {
      try {
        await apiFetch(`${API_BASE}/api/repo/${selectedRepo.id}/investigate`, { method: 'DELETE' });
      } catch (e) { }
    }
    setActiveInvestigationId(null);
    setUserSelectedFile(null);

    // If cleared from UI, pop the state to keep browser history consistent
    if (!isPop && window.location.hash === '#investigation') {
      window.history.back();
    }
  };

  return (
    <div className="w-full h-full min-h-screen overflow-hidden" style={{ background: 'var(--cs-bg)' }}>
      {appState === 'loading' && (
        <div className="w-full h-full min-h-screen flex items-center justify-center bg-[var(--cs-bg)]" />
      )}
      {appState === 'login' && (
        <LoginPage />
      )}
      {appState === 'launch' && (
        <LaunchExperience 
          onConnect={handleConnect} 
          activeRepo={repos.find(r => r.id === activeDashboardRepoId)} 
          isConnectingProp={isConnecting} 
        />
      )}
      {appState === 'workspace' && (
        <WorkspaceRoot
          onBack={handleConnectNew}
          activeInvestigation={activeInvestigation}
          onNewInvestigation={startNewInvestigation}
          onClearInvestigation={clearInvestigation}
        />
      )}
    </div>
  );
}

export default App;
