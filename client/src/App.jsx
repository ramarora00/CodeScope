import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [health, setHealth] = useState({ status: 'Loading...', message: '' })

  useEffect(() => {
    fetch('http://localhost:5000/api/health')
      .then(res => res.json())
      .then(data => setHealth(data))
      .catch(err => setHealth({ status: 'Error', message: 'Backend unreachable' }))
  }, [])

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar glass">
        <div className="logo-section">
          <h2 className="text-gradient">Copilot AI</h2>
        </div>
        <nav className="nav-links">
          <button 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button 
            className={`nav-item ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            Upload Repo
          </button>
          <button 
            className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            AI Chat
          </button>
          <button 
            className={`nav-item ${activeTab === 'graph' ? 'active' : ''}`}
            onClick={() => setActiveTab('graph')}
          >
            Dependency Graph
          </button>
        </nav>
        <div className="sidebar-footer">
          <div className={`status-badge ${health.status.toLowerCase()}`}>
            {health.status === 'OK' ? '● Online' : '○ Offline'}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="content-header">
          <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
          <div className="user-profile">
            <span>Dev User</span>
          </div>
        </header>

        <div className="content-body">
          {activeTab === 'dashboard' && (
            <div className="welcome-card glass shadow-glow">
              <h2 className="text-gradient">Welcome to Codebase Intelligence</h2>
              <p>Upload a repository to start analyzing your code with AI.</p>
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>0</h3>
                  <p>Repos Analyzed</p>
                </div>
                <div className="stat-card">
                  <h3>0</h3>
                  <p>Files Indexed</p>
                </div>
                <div className="stat-card">
                  <h3>0</h3>
                  <p>AI Queries</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="upload-placeholder glass">
              <h2>Upload Repository</h2>
              <p>Version 1: GitHub URL integration coming soon...</p>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="chat-placeholder glass">
              <h2>AI Q&A</h2>
              <p>Version 3: Context-aware chat coming soon...</p>
            </div>
          )}

          {activeTab === 'graph' && (
            <div className="graph-placeholder glass">
              <h2>Dependency Graph</h2>
              <p>Version 5: Visual relationships coming soon...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
