import { useState } from 'react'
import { Link2, GitBranch, Loader2, CheckCircle2, AlertCircle, Zap } from 'lucide-react'

const RepoUpload = ({ onUploadSuccess }) => {
  const [repoUrl, setRepoUrl] = useState('')
  const [status, setStatus] = useState('idle') // idle, uploading, success, error
  const [error, setError] = useState('')

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!repoUrl) return

    setStatus('uploading')
    setError('')

    try {
      const res = await fetch('http://localhost:5000/api/repo/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl })
      })

      const data = await res.json()

      if (res.ok) {
        setStatus('success')
        setTimeout(() => {
          onUploadSuccess(data)
        }, 1500)
      } else {
        setStatus('error')
        setError(data.error || 'Failed to clone repository')
      }
    } catch (err) {
      setStatus('error')
      setError('Connection failed. Is the backend running?')
    }
  }

  return (
    <div className="max-w-xl mx-auto mt-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="glass p-8 rounded-3xl border-silver shadow-glow-subtle relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-accent/10 blur-3xl rounded-full" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-accent/10 rounded-xl border border-accent/20">
              <Zap className="text-accent" size={24} fill="currentColor" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gradient-silver">Initialize Project</h2>
              <p className="text-text-muted text-xs uppercase tracking-widest font-bold">New Repository Analysis</p>
            </div>
          </div>

          <form onSubmit={handleUpload} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-secondary ml-1">GitHub Repository URL</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Link2 size={18} className="text-text-muted group-focus-within:text-accent transition-colors" />
                </div>
                <input
                  type="text"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/username/repo"
                  className="w-full bg-bg-main border border-border rounded-xl py-4 pl-12 pr-4 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={status === 'uploading' || status === 'success'}
              className={`w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                status === 'uploading' || status === 'success'
                  ? 'bg-bg-hover text-text-muted border border-border'
                  : 'bg-text-primary text-bg-main hover:bg-white hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {status === 'uploading' ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Cloning Source...
                </>
              ) : status === 'success' ? (
                <>
                  <CheckCircle2 size={18} className="text-success" />
                  Analysis Ready
                </>
              ) : (
                <>
                  <GitBranch size={18} />
                  Start Intelligence Sync
                </>
              )}
            </button>
          </form>

          {status === 'error' && (
            <div className="mt-6 p-4 bg-error/5 border border-error/20 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={18} className="text-error" />
              <p className="text-error text-xs font-medium">{error}</p>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-border/50">
            <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-4">How it works</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex gap-3">
                <div className="w-1 h-8 bg-accent/20 rounded-full" />
                <div>
                  <div className="text-[10px] font-bold text-text-primary">Cloning</div>
                  <div className="text-[10px] text-text-muted">Direct git clone to secure server</div>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-1 h-8 bg-success/20 rounded-full" />
                <div>
                  <div className="text-[10px] font-bold text-text-primary">Indexing</div>
                  <div className="text-[10px] text-text-muted">Full file-system AST traversal</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RepoUpload
