import { useState, useEffect, useMemo } from 'react';
import LaunchExperience from './features/codescope/ui/LaunchExperience';
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
  const startNewInvestigation = async (queryText) => {
    if (!selectedRepo || !queryText.trim()) return;

    const newId = crypto.randomUUID();
    const newInv = {
      id: newId,
      title: queryText,
      status: 'Active',
      operations: [
        { id: '1', label: `Searching codebase for "${queryText}"`, status: 'running' },
        { id: '2', label: 'Extracting file structure...', status: 'pending' },
        { id: '3', label: 'Resolving dependency mappings...', status: 'pending' }
      ],
      evidence: null,
      conclusion: null
    };

    setInvestigations(prev => [newInv, ...prev]);
    setActiveInvestigationId(newId);

    try {
      const res = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: queryText, repoId: selectedRepo.id })
      });
      
      const data = await res.json();

      setInvestigations(prev => prev.map(inv => {
        if (inv.id !== newId) return inv;
        return {
          ...inv,
          operations: [
            { id: '1', label: `Searching codebase for "${queryText}"`, status: 'done' },
            { id: '2', label: 'Extracting file structure...', status: 'running' },
            { id: '3', label: 'Resolving dependency mappings...', status: 'pending' }
          ]
        };
      }));

      await new Promise(r => setTimeout(r, 400));

      setInvestigations(prev => prev.map(inv => {
        if (inv.id !== newId) return inv;
        return {
          ...inv,
          operations: [
            { id: '1', label: `Searching codebase for "${queryText}"`, status: 'done' },
            { id: '2', label: 'Extracting file structure...', status: 'done' },
            { id: '3', label: 'Resolving dependency mappings...', status: 'done' }
          ],
          evidence: {
            files: (data.contextMeta?.files || []).map(f => ({ name: f.split('/').pop(), path: f })),
            symbols: [],
            routes: []
          },
          conclusion: data.answer || 'No findings available.'
        };
      }));

    } catch (err) {
      console.error(err);
      setInvestigations(prev => prev.map(inv => {
        if (inv.id !== newId) return inv;
        return {
          ...inv,
          operations: [
            { id: '1', label: `Reasoning pipeline failed`, status: 'failed' }
          ],
          conclusion: 'Failed to complete analysis.'
        };
      }));
    }
  };

  return (
    <div className="w-full h-full min-h-screen overflow-hidden" style={{ background: 'var(--cs-bg)' }}>
      {appState === 'launch' && (
        <LaunchExperience onConnect={handleConnect} repos={repos} />
      )}
      {appState === 'workspace' && (
        <WorkspaceRoot repo={selectedRepo} onBack={handleConnectNew} />
      )}
    </div>
  );
}

export default App;
