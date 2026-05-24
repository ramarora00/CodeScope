import { useState, useEffect, useRef } from 'react'
import { 
  LayoutDashboard, 
  Upload, 
  MessageSquare, 
  Network, 
  Settings, 
  CheckCircle2, 
  XCircle,
  FileText,
  Search,
  Zap,
  ChevronRight,
  Terminal,
  Cpu,
  Loader2,
  Send
} from 'lucide-react'
import RepoUpload from './components/RepoUpload'
import RepoList from './components/RepoList'
import FileExplorer from './components/FileExplorer'
import FileViewer from './components/FileViewer'
import DependencyGraph from './components/DependencyGraph'
import ImpactAnalysis from './components/ImpactAnalysis'
import ArchitectureInsights from './components/ArchitectureInsights'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [viewMode, setViewMode] = useState('code') // code, graph, impact
  const [health, setHealth] = useState({ status: 'loading', message: '' })
  const [repos, setRepos] = useState([])
  const [selectedRepo, setSelectedRepo] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  
  // Chat State
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hello! I'm your Codebase Assistant. Connect a repository to get started with codebase-wide queries." }
  ])
  const [chatInput, setChatInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const chatEndRef = useRef(null)

  useEffect(() => {
    fetchHealth()
    fetchRepos()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchHealth = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/health')
      const data = await res.json()
      setHealth({ status: 'ok', message: data.message })
    } catch (err) {
      setHealth({ status: 'error', message: 'Backend unreachable' })
    }
  }

  const fetchRepos = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/repo')
      const data = await res.json()
      setRepos(data)
    } catch (err) {
      console.error('Failed to fetch repos')
    }
  }

  const handleUploadSuccess = (newRepo) => {
    setRepos([newRepo, ...repos])
    setActiveTab('dashboard')
  }

  const handleRepoSelect = (repo) => {
    setSelectedRepo(repo)
    setActiveTab('explorer')
    setMessages(prev => [...prev, { 
      role: 'assistant', 
      text: `Now analyzing ${repo.name.split('-')[0]}. You can ask me questions about this codebase!` 
    }])
  }

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault()
    if (!chatInput.trim() || isSending) return

    const userMessage = chatInput.trim()
    setMessages(prev => [...prev, { role: 'user', text: userMessage }])
    setChatInput('')
    setIsSending(true)

    try {
      const res = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userMessage,
          repoId: selectedRepo?.id,
          filePath: selectedFile?.path
        })
      })

      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', text: data.answer || "I'm sorry, I couldn't process that." }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: "Error: Failed to connect to AI service." }])
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="app-container">
      {/* Sidebar (Left) */}
      <aside className="sidebar-left">
        <div className="sidebar-header">
          <div className="flex items-center gap-3">
            <div className="logo-icon shadow-glow-subtle">
              <Zap size={18} color="white" fill="white" />
            </div>
            <h2 className="text-lg font-bold tracking-tight text-gradient-silver">Copilot AI</h2>
          </div>
        </div>
        
        <div className="sidebar-content">
          <nav className="flex flex-col">
            <button 
              className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <LayoutDashboard size={18} />
              <div className="flex-1 flex items-center justify-between">
                <span>Dashboard</span>
                <div className={`w-2 h-2 rounded-full ${health.status === 'ok' ? 'bg-success animate-pulse shadow-[0_0_8px_#10b981]' : 'bg-error'}`} />
              </div>
            </button>
            <button 
              className={`nav-item connect-btn ${activeTab === 'upload' ? 'active' : ''}`}
              onClick={() => setActiveTab('upload')}
            >
              <Upload size={18} />
              <span>Connect Repo</span>
            </button>

            {selectedRepo && (
              <>
                <div className="px-4 mt-6 mb-2 text-[10px] font-bold text-text-muted uppercase tracking-widest">
                  Current Project
                </div>
                <button 
                  className={`nav-item ${activeTab === 'explorer' ? 'active' : ''}`}
                  onClick={() => setActiveTab('explorer')}
                >
                  <FileText size={18} />
                  <span>File Explorer</span>
                </button>
              </>
            )}
          </nav>

          {activeTab === 'explorer' && selectedRepo && (
            <div className="px-2 mt-4">
              <FileExplorer repo={selectedRepo} onFileSelect={setSelectedFile} />
            </div>
          )}
        </div>

        <div className="sidebar-footer p-4 border-t border-border bg-bg-sidebar">
          <div className={`status-badge-premium ${health.status} flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider`}>
            <div className={`w-1.5 h-1.5 rounded-full ${health.status === 'ok' ? 'bg-success animate-pulse' : 'bg-error'}`} />
            {health.status === 'ok' ? 'System Live' : 'System Down'}
          </div>
        </div>
      </aside>

      {/* Main Panel (Center) */}
      <main className="main-panel">
        <header className="panel-header">
          <div className="flex items-center gap-3">
            <span className="text-xs text-text-muted">Projects</span>
            <ChevronRight size={12} className="text-text-muted" />
            <span className="text-xs text-text-primary font-medium">
              {selectedRepo ? selectedRepo.name.split('-')[0] : 'Overview'}
            </span>
          </div>

          <div className="view-toggles">
            <button 
              className={`toggle-btn ${viewMode === 'code' ? 'active' : ''}`}
              onClick={() => setViewMode('code')}
            >
              Code
            </button>
            <button 
              className={`toggle-btn ${viewMode === 'graph' ? 'active' : ''}`}
              onClick={() => setViewMode('graph')}
            >
              Graph
            </button>
            <button 
              className={`toggle-btn ${viewMode === 'impact' ? 'active' : ''}`}
              onClick={() => setViewMode('impact')}
            >
              Impact
            </button>
            <button 
              className={`toggle-btn ${viewMode === 'arch' ? 'active' : ''}`}
              onClick={() => setViewMode('arch')}
            >
              Arch
            </button>
          </div>
        </header>

        <div className="panel-body">
          {activeTab === 'dashboard' && (
            <div className="h-full flex flex-col p-8 animate-in fade-in duration-500 overflow-y-auto">
              {!selectedRepo ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12">
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-accent/20 blur-[80px] rounded-full animate-pulse" />
                    <div className="relative glass p-6 rounded-[2rem] border-silver shadow-2xl">
                      <Zap className="text-accent" size={32} fill="currentColor" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-gradient-silver mb-2">Connect to Intelligence</h2>
                  <p className="text-text-secondary text-sm mb-8 text-center max-w-md">
                    Paste a GitHub URL to start the deep semantic indexing process.
                  </p>
                  <RepoUpload onUploadSuccess={handleUploadSuccess} />
                </div>
              ) : (
                <div className="mb-12">
                  <h1 className="text-4xl font-bold mb-2 text-gradient-silver">{selectedRepo.name.split('-')[0]}</h1>
                  <p className="text-text-secondary text-sm">Architectural insights ready for analysis.</p>
                </div>
              )}
              
              <div className="mt-4">
                <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-6">Connected Projects</h3>
                <RepoList repos={repos} fetchRepos={fetchRepos} onSelect={handleRepoSelect} />
              </div>
            </div>
          )}

          {activeTab === 'upload' && (
            <RepoUpload onUploadSuccess={handleUploadSuccess} />
          )}

          {activeTab === 'explorer' && selectedRepo && (
            <div className="flex-1 flex flex-col min-h-0 animate-in slide-in-from-right-4 duration-500">
              {viewMode === 'code' && (
                <FileViewer repo={selectedRepo} file={selectedFile} />
              )}
              {viewMode === 'graph' && (
                <DependencyGraph repoId={selectedRepo.id} />
              )}
              {viewMode === 'impact' && (
                <ImpactAnalysis repo={selectedRepo} selectedFile={selectedFile} />
              )}
              {viewMode === 'arch' && (
                <ArchitectureInsights repo={selectedRepo} />
              )}
            </div>
          )}
        </div>
      </main>

      {/* Chat Panel (Right) */}
      <aside className="chat-panel">
        <div className="chat-header">
          <div className="flex items-center gap-2">
            <MessageSquare size={14} className="text-accent" />
            <span>AI Copilot</span>
          </div>
        </div>

        <div className="chat-messages flex-1 overflow-y-auto custom-scrollbar">
          {messages.map((msg, i) => (
            <div key={i} className={`mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300 ${msg.role === 'user' ? 'flex flex-col items-end' : ''}`}>
              <div className={`p-4 rounded-2xl text-xs max-w-[90%] ${
                msg.role === 'user' 
                  ? 'bg-accent text-white rounded-tr-none' 
                  : 'bg-bg-hover text-text-primary border border-border rounded-tl-none'
              }`}>
                {msg.text}
              </div>
              <span className="text-[9px] text-text-muted mt-1 px-1 uppercase tracking-tighter">
                {msg.role === 'user' ? 'You' : 'Nexus AI'}
              </span>
            </div>
          ))}
          {isSending && (
            <div className="flex items-center gap-2 text-text-muted text-[10px] animate-pulse">
              <Loader2 size={12} className="animate-spin" />
              Processing code context...
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="chat-input-area">
          <form onSubmit={handleSendMessage} className="chat-input-container">
            <textarea 
              className="chat-input" 
              placeholder={selectedRepo ? "Ask about the code..." : "Select a repo first"}
              rows="2"
              disabled={!selectedRepo || isSending}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
            />
            <div className="flex justify-between items-center mt-2 px-2">
              <span className="text-[10px] text-text-muted">
                {selectedFile ? `Context: ${selectedFile.name}` : "Context: Global Repo"}
              </span>
              <button 
                type="submit"
                disabled={!selectedRepo || isSending || !chatInput.trim()}
                className="p-1.5 bg-accent/20 text-accent rounded-md hover:bg-accent hover:text-white transition-all disabled:opacity-30"
              >
                {isSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </div>
          </form>
        </div>
      </aside>
    </div>
  )
}

export default App
