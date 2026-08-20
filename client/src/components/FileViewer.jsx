import { useState, useEffect } from 'react'
import { ChevronDown, RefreshCw, X, Maximize2, Minimize2, Copy, Check, FileCode, Play } from 'lucide-react';
import { apiFetch } from '../config/apiFetch';
import { API_BASE } from '../config/api'
import { CodePreviewBlock, EvidenceBlock, StatusBlock } from '@/shared/ui/EnterpriseBlocks'
import { LoadingState } from '@/shared/ui/LoadingState'
import AIOverlayEditor from '../features/codescope/ui/v2/AIOverlayEditor'

const FileViewer = ({ repo, file }) => {
  const [content, setContent] = useState('')
  const [metadata, setMetadata] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (file) {
      fetchFileContent()
    }
  }, [file])

  const fetchFileContent = async () => {
    setLoading(true)
    try {
      const res = await apiFetch(`${API_BASE}/api/repo/${repo.id}/file/content?filePath=${encodeURIComponent(file.path)}`)
      if (!res.ok) throw new Error('Failed to load file content')
      const data = await res.json()
      setContent(data.content || '')
      setMetadata(data.metadata ? JSON.parse(data.metadata) : null)
    } catch (err) {
      console.error('Failed to fetch file content')
    } finally {
      setLoading(false)
    }
  }

  if (!file) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-text-muted rounded-3xl border-silver animate-in fade-in">
        <StatusBlock status="idle" message="Select a file to view intelligence insights" className="max-w-md w-full justify-center" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-500 bg-[var(--cs-panel)]">
      {/* File Header */}
      <div className="flex items-center justify-between mb-4 px-4 py-3" style={{ borderBottom: '1px solid var(--cs-border)' }}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ background: 'var(--cs-bg)' }}>
            <FileCode size={16} style={{ color: 'var(--cs-accent)' }} />
          </div>
          <div>
            <h3 className="text-sm font-bold" style={{ color: 'var(--cs-text)' }}>{file.name}</h3>
            <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--cs-muted)' }}>{file.path}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'var(--cs-bg)', color: 'var(--cs-text)' }}>UTF-8</span>
          <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'var(--cs-bg)', color: 'var(--cs-text)' }}>{file.name.split('.').pop().toUpperCase()}</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[var(--cs-bg)]/80 backdrop-blur-sm rounded-lg">
            <LoadingState size="lg" />
          </div>
        )}
        <AIOverlayEditor
          activeTabId={file.path}
          memoryFiles={[{ name: file.name, file: file.path, content: content || '// No content available' }]}
          runtimeStatus="idle"
          attention={{}}
        />
      </div>
    </div>
  )
}

export default FileViewer
