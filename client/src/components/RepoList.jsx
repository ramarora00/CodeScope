import { useEffect } from 'react'
import { Folder, ArrowRight, Calendar, GitBranch, Loader2, Trash2 } from 'lucide-react'

const RepoList = ({ repos, fetchRepos, onSelect }) => {
  useEffect(() => {
    fetchRepos();
    const interval = setInterval(fetchRepos, 3000); // Poll every 3s to catch background indexing
    return () => clearInterval(interval);
  }, []);

  if (!repos || repos.length === 0) {
    return (
      <div className="mt-12 p-12 border border-dashed border-border rounded-3xl flex flex-col items-center justify-center text-text-muted opacity-50">
        <Folder size={32} className="mb-4" />
        <p className="text-xs uppercase tracking-widest font-bold">No repositories connected</p>
      </div>
    )
  }

  return (
    <div className="mt-12 animate-in fade-in duration-1000">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">
          Indexed Repositories
        </h3>
        <div className="h-[1px] flex-1 bg-border ml-4" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.isArray(repos) && repos.map((repo) => (
          <div 
            key={repo.id}
            onClick={() => onSelect(repo)}
            className="group glass p-5 rounded-2xl border-silver hover:bg-bg-hover hover:border-accent/30 transition-all cursor-pointer relative overflow-hidden"
          >
            {/* Subtle hover glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-accent/0 via-accent/5 to-accent/0 opacity-0 group-hover:opacity-100 transition-opacity blur-sm" />
            
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-bg-main rounded-xl border border-border group-hover:border-accent/20 transition-all">
                    <Folder className="text-text-muted group-hover:text-accent transition-colors" size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-text-primary group-hover:text-gradient-silver transition-all">
                        {repo.name.split('-')[0]}
                      </h4>
                      {repo.status !== 'ready' && (
                        <div className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-tighter animate-pulse ${
                          repo.status === 'error' ? 'bg-error/10 text-error' : 'bg-accent/10 text-accent'
                        }`}>
                          {repo.status}
                        </div>
                      )}
                      {repo.status === 'ready' && (
                        <div className="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-[10px] text-text-muted">
                        <GitBranch size={10} />
                        main
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-text-muted">
                        <Calendar size={10} />
                        {new Date(repo.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                  {repo.status === 'ready' ? <ArrowRight size={16} /> : <Loader2 size={14} className="animate-spin" />}
                </div>
              </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default RepoList
