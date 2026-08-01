import { useState, useEffect } from 'react'
import { File, Folder, ChevronRight, ChevronDown, Loader2, AlertCircle } from 'lucide-react'
import { API_BASE } from '../config/api'

const FileTreeItem = ({ item, onFileSelect, depth = 0 }) => {
  const [isOpen, setIsOpen] = useState(false)
  const isDirectory = item.type === 'directory'

  return (
    <div className="select-none">
      <div 
        className={`flex items-center gap-2 py-1.5 px-3 rounded-lg cursor-pointer transition-all ${
          isDirectory 
            ? 'hover:bg-bg-hover text-text-primary' 
            : 'hover:bg-accent/10 text-text-secondary hover:text-accent'
        }`}
        style={{ paddingLeft: `${depth * 12 + 12}px` }}
        onClick={() => {
          if (isDirectory) setIsOpen(!isOpen)
          else onFileSelect(item)
        }}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {isDirectory ? (
            <>
              <div className="w-4 h-4 flex items-center justify-center">
                {isOpen ? <ChevronDown size={14} className="text-text-muted" /> : <ChevronRight size={14} className="text-text-muted" />}
              </div>
              <Folder size={16} className="text-accent shrink-0" fill={isOpen ? "currentColor" : "none"} fillOpacity={0.2} />
            </>
          ) : (
            <>
              <div className="w-4" />
              <File size={16} className="text-text-muted shrink-0" />
            </>
          )}
          <span className="text-[12px] font-medium truncate">{item.name}</span>
        </div>
      </div>

      {isDirectory && isOpen && item.children && (
        <div className="animate-in fade-in slide-in-from-left-1 duration-200">
          {item.children.map((child, idx) => (
            <FileTreeItem 
              key={`${child.path}-${idx}`} 
              item={child} 
              onFileSelect={onFileSelect} 
              depth={depth + 1} 
            />
          ))}
        </div>
      )}
    </div>
  )
}

const FileExplorer = ({ repo, onFileSelect }) => {
  const [tree, setTree] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (repo) fetchFileTree()
  }, [repo])

  const fetchFileTree = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/repo/${repo.id}/files`)
      const data = await res.json()
      
      if (res.ok && Array.isArray(data)) {
        setTree(data)
      } else {
        setError(data.error || 'Failed to load file tree')
      }
    } catch (err) {
      setError('Connection failed')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-12 text-text-muted gap-3">
      <Loader2 className="animate-spin text-accent" size={24} />
      <p className="text-[10px] font-bold uppercase tracking-widest">Reading Source...</p>
    </div>
  )

  if (error) return (
    <div className="p-4 glass rounded-xl border-error/20 bg-error/5 flex flex-col items-center gap-2 mx-2">
      <AlertCircle size={16} className="text-error" />
      <p className="text-[10px] text-error font-bold uppercase text-center">{error}</p>
      <button onClick={fetchFileTree} className="text-[10px] text-text-primary underline hover:text-accent">Retry</button>
    </div>
  )

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2 flex items-center justify-between border-b border-border/50 bg-bg-sidebar/30 backdrop-blur-sm sticky top-0 z-10">
        <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Source Files</h3>
      </div>
      <div className="p-2 overflow-y-auto custom-scrollbar">
        {tree.length > 0 ? tree.map((item, idx) => (
          <FileTreeItem key={`${item.path}-${idx}`} item={item} onFileSelect={onFileSelect} />
        )) : (
          <p className="text-[10px] text-text-muted italic p-4 text-center">Repository is empty</p>
        )}
      </div>
    </div>
  )
}

export default FileExplorer
