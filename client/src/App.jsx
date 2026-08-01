import { useState, useEffect, useMemo } from 'react';
import { API_BASE } from './config/api';
import { useInvestigationSession } from './features/codescope/store/useInvestigationSession';
import { useWorkspaceStore } from './features/codescope/store/useWorkspaceStore';
import LaunchExperience from './features/codescope/ui/LaunchExperience';
import WorkspaceRoot from './features/codescope/ui/v2/WorkspaceRoot';
import './App.css';

function App() {
  const [appState, setAppState] = useState('launch');
  const [repos, setRepos] = useState([]);
  
  const { selectedRepo, setSelectedRepo, activeInvestigationId, setActiveInvestigationId } = useWorkspaceStore();
  
  // Investigation States
  const [investigations, setInvestigations] = useState([]);

  // Sync health and repositories
  const fetchRepos = () => {
    fetch(`${API_BASE}/api/repo`)
      .then(r => r.json())
      .then(d => {
        setRepos(d);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchRepos();
  }, []);

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
        handleSelectRepo(existing);
        return;
      }
    }

    try {
      const isLocal = !urlOrPath.startsWith('http') && !urlOrPath.startsWith('git@');
      let response;
      if (isLocal) {
        const dirName = urlOrPath.replace(/\\/g, '/').split('/').pop() || 'local-repo';
        response = await fetch(`${API_BASE}/api/repo/index-local`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ localPath: urlOrPath, name: dirName })
        });
      } else {
        response = await fetch(`${API_BASE}/api/repo/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repoUrl: urlOrPath })
        });
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to connect repository');

      setRepos(prev => [data, ...prev]);
      setSelectedRepo(data);
      useInvestigationSession.getState().resetSession(data.id);
      setAppState('workspace');
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const handleSelectRepo = (repo) => {
    setSelectedRepo(repo);
    useInvestigationSession.getState().resetSession(repo.id);
    setAppState('workspace');
  };

  const handleConnectNew = () => {
    setAppState('launch');
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

  const startNewInvestigation = async (queryText, mode = 'investigation') => {
    // Cancel any existing backend investigation first
    if (selectedRepo?.id) {
      try {
        await fetch(`${API_BASE}/api/repo/${selectedRepo.id}/investigate`, {
          method: 'DELETE'
        });
      } catch (e) {
        // Ignore — there may not be an active investigation
      }
    }

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
  };

  return (
    <div className="w-full h-full min-h-screen overflow-hidden" style={{ background: 'var(--cs-bg)' }}>
      {appState === 'launch' && (
        <LaunchExperience onConnect={handleConnect} repos={repos} />
      )}
      {appState === 'workspace' && (
        <WorkspaceRoot
          onBack={handleConnectNew}
          activeInvestigation={activeInvestigation}
          onNewInvestigation={startNewInvestigation}
        />
      )}
    </div>
  );
}

export default App;
