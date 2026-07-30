import { useState, useEffect, useMemo } from 'react';
import LaunchExperience from './features/codescope/ui/LaunchExperience';
// PRESENTATION LOCK (Rule 15): WorkspaceRoot is the canonical premium shell.
// Brain: Zustand useInvestigationSession + SSE event router.
// Presentation: frozen v2 layout (Dock, CommandBar, AIOverlayEditor, KnowledgePanel).
import WorkspaceRoot from './features/codescope/ui/v2/WorkspaceRoot';
import './App.css';

function App() {
  // Experience States: 'launch' | 'processing' | 'workspace'
  const [appState, setAppState] = useState('launch');
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);
  
  console.log('[App.jsx] Render. appState:', appState, 'selectedRepo:', selectedRepo);
  
  // Investigation States
  const [investigations, setInvestigations] = useState([]);
  const [activeInvestigationId, setActiveInvestigationId] = useState(null);

  // Sync health and repositories
  const fetchRepos = () => {
    fetch('http://localhost:5000/api/repo')
      .then(r => r.json())
      .then(d => {
        setRepos(d);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchRepos();
  }, []);

  // Connect repository action
  const handleConnect = async (urlOrPath) => {
    // Demo mode: bypass backend, go straight to workspace with null repo
    if (urlOrPath === '__demo__') {
      setSelectedRepo(null);
      setAppState('workspace');
      return;
    }

    // Quick-select an already-indexed repo by ID
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
        response = await fetch('http://localhost:5000/api/repo/index-local', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ localPath: urlOrPath, name: dirName })
        });
      } else {
        response = await fetch('http://localhost:5000/api/repo/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repoUrl: urlOrPath })
        });
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to connect repository');

      // Update lists — always go straight to workspace
      setRepos(prev => [data, ...prev]);
      setSelectedRepo(data);
      setAppState('workspace');
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const handleSelectRepo = (repo) => {
    setSelectedRepo(repo);
    setAppState('workspace');
  };

  const handleConnectNew = () => {
    setAppState('launch');
  };

  const handleProcessingComplete = () => {
    fetchRepos();
    setAppState('workspace');
  };

  // Find active investigation object
  const activeInvestigation = useMemo(() => {
    return investigations.find(i => i.id === activeInvestigationId) || null;
  }, [investigations, activeInvestigationId]);

  // Launch a new investigation query
  const startNewInvestigation = async (queryText, mode = 'investigation') => {
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
    
    // In the new architecture (v2 shell + Zustand), we do NOT fetch `/api/chat` here.
    // Setting `activeInvestigationId` causes `useInvestigationEventRouter` 
    // to mount and connect to `/api/repo/:id/investigate/stream`, which 
    // drives the entire UI via SSE events.
  };

  return (
    <div className="w-full h-full min-h-screen overflow-hidden" style={{ background: 'var(--cs-bg)' }}>
      {appState === 'launch' && (
        <LaunchExperience onConnect={handleConnect} repos={repos} />
      )}
      {appState === 'workspace' && (
        <WorkspaceRoot
          repo={selectedRepo}
          onBack={handleConnectNew}
          activeInvestigation={activeInvestigation}
          onNewInvestigation={startNewInvestigation}
        />
      )}
    </div>
  );
}

export default App;
