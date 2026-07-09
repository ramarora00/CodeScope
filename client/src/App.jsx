import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Activity, Layers, PlayCircle, Share2, Network,
  FolderTree, GitBranch, Sparkles, Database, Command, Search,
  ChevronRight, BarChart2, Plus
} from 'lucide-react'

import RepositoryConnection from './features/repository/ui/RepositoryConnection'
import RepoList from './components/RepoList'
import FileExplorer from './components/FileExplorer'
import FileViewer from './components/FileViewer'
import KnowledgeGraph from './components/DependencyGraph'
import ImpactScreen from './components/ImpactAnalysis'
import ArchitectureScreen from './components/ArchitectureInsights'
import CodeScopeHome from './features/codescope/ui/CodeScopeHome'

import './App.css'

/* ─── Seeded star positions ─── */
const STARS = Array.from({ length: 60 }, (_, i) => ({
  top:      `${(i * 17.3) % 100}%`,
  left:     `${(i * 23.7 + 11.1) % 100}%`,
  duration: `${14 + (i % 7) * 3}s`,
  delay:    `-${(i % 11) * 1.8}s`,
  opacity:   0.08 + (i % 5) * 0.04,
  size:      i % 4 === 0 ? 1.5 : 1,
}));

/* ─── Nav items ─── */
const NAV = [
  { id: 'overview',   label: 'Overview',        icon: Activity,  section: 'Observatory' },
  { id: 'domains',    label: 'Domains',          icon: Layers,    section: 'Observatory' },
  { id: 'execution',  label: 'Execution',        icon: PlayCircle, section: 'Observatory' },
  { id: 'impact',     label: 'Impact',           icon: Share2,    section: 'Observatory' },
  { id: 'knowledge',  label: 'Knowledge Graph',  icon: Network,   section: 'Observatory' },
  { id: 'explorer',   label: 'Explorer',         icon: FolderTree, section: 'Implementation' },
  { id: 'arch',       label: 'Architecture',     icon: BarChart2,  section: 'Implementation' },
];

function App() {
  const [activeTab, setActiveTab] = useState('overview')
  const [health, setHealth] = useState({ status: 'loading' })
  const [repos, setRepos] = useState([])
  const [selectedRepo, setSelectedRepo] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [showConnect, setShowConnect] = useState(false)

  useEffect(() => {
    fetch('http://localhost:5000/api/health')
      .then(r => r.json())
      .then(d => setHealth({ status: 'ok', message: d.message }))
      .catch(() => setHealth({ status: 'error' }))

    fetch('http://localhost:5000/api/repo')
      .then(r => r.json())
      .then(d => setRepos(d))
      .catch(() => {})
  }, [])

  const handleUploadSuccess = (newRepo) => {
    setRepos(prev => [newRepo, ...prev])
    setSelectedRepo(newRepo)
    setShowConnect(false)
    setActiveTab('overview')
  }

  const handleRepoSelect = (repo) => {
    setSelectedRepo(repo)
    setActiveTab('overview')
  }

  /* Group nav items by section */
  const sections = useMemo(() => {
    const result = {};
    NAV.forEach(n => {
      if (!result[n.section]) result[n.section] = [];
      result[n.section].push(n);
    });
    return result;
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#05070B' }}>

      {/* ── Subtle Star Field ── */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        {STARS.map((s, i) => (
          <div key={i} style={{
            position: 'absolute',
            top: s.top, left: s.left,
            width: s.size, height: s.size,
            borderRadius: '50%',
            background: '#D8DCE6',
            opacity: s.opacity,
            animation: `starDrift ${s.duration} ease-in-out infinite`,
            animationDelay: s.delay,
          }} />
        ))}
        {/* Nebula blobs */}
        <div style={{ position: 'absolute', top: '20%', left: '30%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(74,85,104,0.04) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: '15%', right: '20%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(74,99,88,0.04) 0%, transparent 70%)', filter: 'blur(50px)' }} />
      </div>

      {/* ── Grid Layout ── */}
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'grid',
        gridTemplateColumns: '236px 1fr',
        gridTemplateRows: '52px 1fr',
        gridTemplateAreas: '"sidebar topbar" "sidebar main"',
        width: '100%', height: '100%',
      }}>

        {/* ── Left Navigation ── */}
        <aside style={{ gridArea: 'sidebar', background: 'rgba(8,10,15,0.92)', borderRight: '1px solid #1C2331', display: 'flex', flexDirection: 'column', height: '100vh', backdropFilter: 'blur(12px)' }}>
          
          {/* Logo */}
          <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #1C2331' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: '#10141C', border: '1px solid #1C2331', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={14} color="#8E97A8" />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.02em', color: '#D8DCE6', fontFamily: 'Inter' }}>
                Nexus OS
              </span>
            </div>
          </div>

          {/* Repository selector */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #1C2331' }}>
            {selectedRepo ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5C657A', marginBottom: 3 }}>Active Repository</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#D8DCE6', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {selectedRepo.name?.replace(/repo-?/i, '') || selectedRepo.name}
                  </div>
                </div>
                <button
                  onClick={() => setShowConnect(!showConnect)}
                  style={{ flexShrink: 0, width: 22, height: 22, borderRadius: 6, background: '#10141C', border: '1px solid #1C2331', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#5C657A' }}
                >
                  <Plus size={11} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowConnect(!showConnect)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#10141C', border: '1px solid #1C2331', borderRadius: 8, cursor: 'pointer', color: '#8E97A8', fontSize: 11 }}
              >
                <GitBranch size={13} />
                <span>Connect Repository</span>
              </button>
            )}
          </div>

          {/* Nav items */}
          <nav style={{ flex: 1, padding: '12px 12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0 }}>
            {Object.entries(sections).map(([section, items]) => (
              <div key={section} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#3A4258', padding: '6px 8px 4px', marginBottom: 2 }}>
                  {section}
                </div>
                {items.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                        padding: '7px 9px', borderRadius: 7, marginBottom: 1,
                        background: isActive ? '#10141C' : 'transparent',
                        border: isActive ? '1px solid #1C2331' : '1px solid transparent',
                        cursor: 'pointer',
                        color: isActive ? '#D8DCE6' : '#5C657A',
                        fontSize: 11, fontFamily: 'Inter', fontWeight: isActive ? 600 : 400,
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={e => { if (!isActive) { e.currentTarget.style.color = '#8E97A8'; e.currentTarget.style.background = '#0A0E15'; } }}
                      onMouseLeave={e => { if (!isActive) { e.currentTarget.style.color = '#5C657A'; e.currentTarget.style.background = 'transparent'; } }}
                    >
                      <Icon size={13} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid #1C2331' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#0A0E15', border: '1px solid #1C2331', borderRadius: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: health.status === 'ok' ? '#7A8F7B' : '#8B6B6B', flexShrink: 0, ...(health.status === 'ok' ? { boxShadow: '0 0 6px #7A8F7B' } : {}) }} />
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5C657A' }}>
                {health.status === 'ok' ? 'System Live' : health.status === 'loading' ? 'Connecting...' : 'System Down'}
              </span>
            </div>
          </div>
        </aside>

        {/* ── Top Bar ── */}
        <header style={{ gridArea: 'topbar', background: 'rgba(10,14,21,0.85)', borderBottom: '1px solid #1C2331', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 16 }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#5C657A', marginRight: 'auto' }}>
            <span>Projects</span>
            <ChevronRight size={12} />
            <span style={{ color: selectedRepo ? '#D8DCE6' : '#5C657A', fontWeight: selectedRepo ? 500 : 400 }}>
              {selectedRepo ? (selectedRepo.name?.replace(/repo-?/i, '') || selectedRepo.name) : 'No Project'}
            </span>
            {activeTab !== 'overview' && (
              <>
                <ChevronRight size={12} />
                <span style={{ color: '#8E97A8', textTransform: 'capitalize' }}>{activeTab}</span>
              </>
            )}
          </div>

          {/* Command palette search */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: 380 }}>
            <div style={{ position: 'absolute', left: 10, color: '#3A4258', display: 'flex', alignItems: 'center' }}>
              <Search size={13} />
            </div>
            <input
              type="text"
              placeholder="Search symbols, routes, files, domains..."
              style={{
                width: '100%', background: '#10141C', border: '1px solid #1C2331',
                borderRadius: 8, padding: '6px 64px 6px 32px', fontSize: 11,
                color: '#D8DCE6', fontFamily: 'Inter', outline: 'none',
              }}
              onFocus={e => { e.target.style.borderColor = '#283245'; }}
              onBlur={e => { e.target.style.borderColor = '#1C2331'; }}
            />
            <div style={{ position: 'absolute', right: 8, display: 'flex', alignItems: 'center', gap: 3 }}>
              <span style={{ background: '#10141C', border: '1px solid #1C2331', borderRadius: 4, padding: '1px 5px', fontSize: 9, color: '#3A4258', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 2 }}>
                ⌘K
              </span>
            </div>
          </div>
        </header>

        {/* ── Main Content ── */}
        <main style={{ gridArea: 'main', background: '#0A0E15', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {showConnect && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: '#05070B', display: 'flex', flexDirection: 'column' }}>
              <RepositoryConnection 
                onUploadSuccess={handleUploadSuccess} 
                existingRepos={repos} 
                onCancel={() => setShowConnect(false)} 
              />
            </div>
          )}

          {!selectedRepo ? (
            /* ── Welcome / Landing ── */
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'auto' }}>
              <RepositoryConnection 
                onUploadSuccess={handleUploadSuccess} 
                existingRepos={repos} 
              />
              {repos.length > 0 && (
                <div style={{ width: '100%', maxWidth: 520, padding: 24 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#3A4258', marginBottom: 12 }}>Indexed Projects</div>
                  <RepoList repos={repos} fetchRepos={() => fetch('http://localhost:5000/api/repo').then(r => r.json()).then(setRepos)} onSelect={handleRepoSelect} />
                </div>
              )}
            </div>
          ) : (
            /* ── Active Views ── */
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {activeTab === 'overview' && <CodeScopeHome repo={selectedRepo} />}

              {activeTab === 'knowledge' && (
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <KnowledgeGraph repoId={selectedRepo.id} />
                </div>
              )}

              {activeTab === 'impact' && (
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <ImpactScreen repo={selectedRepo} selectedFile={selectedFile} />
                </div>
              )}

              {activeTab === 'arch' && (
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <ArchitectureScreen repo={selectedRepo} />
                </div>
              )}

              {activeTab === 'explorer' && (
                <div style={{ flex: 1, overflow: 'hidden', display: 'flex', gap: 1, background: '#0A0E15' }}>
                  <div style={{ width: 240, flexShrink: 0, borderRight: '1px solid #1C2331', overflow: 'auto' }}>
                    <FileExplorer repo={selectedRepo} onFileSelect={setSelectedFile} />
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <FileViewer repo={selectedRepo} file={selectedFile} />
                  </div>
                </div>
              )}

              {activeTab === 'domains' && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
                  <Layers size={28} color="#3A4258" />
                  <p style={{ color: '#3A4258', fontSize: 12, fontFamily: 'monospace' }}>Domain Galaxy — Phase B full build coming next</p>
                </div>
              )}

              {activeTab === 'execution' && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
                  <PlayCircle size={28} color="#3A4258" />
                  <p style={{ color: '#3A4258', fontSize: 12, fontFamily: 'monospace' }}>Execution Graph — Phase C full build coming next</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* CSS keyframes for stars */}
      <style>{`
        @keyframes starDrift {
          0%, 100% { transform: translateY(0) translateX(0); opacity: var(--op, 0.1); }
          50%       { transform: translateY(-8px) translateX(4px); opacity: calc(var(--op, 0.1) * 2); }
        }
        * { font-family: 'Inter', system-ui, sans-serif; }
        button { font-family: 'Inter', system-ui, sans-serif; }
        input, textarea { font-family: 'Inter', system-ui, sans-serif; }
      `}</style>
    </div>
  );
}

export default App;
