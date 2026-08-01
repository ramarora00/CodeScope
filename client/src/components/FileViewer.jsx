import { useState, useEffect } from 'react'
import { FileCode, FunctionSquare, Box, Import, Info, Zap } from 'lucide-react'
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
      const res = await fetch(`${API_BASE}/api/repo/${repo.id}/file/content?filePath=${encodeURIComponent(file.path)}`)
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
    <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-500">
      {/* File Header */}
      <div className="flex items-center justify-between mb-4 px-4 py-3 glass rounded-2xl border-silver">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/10 rounded-lg">
            <FileCode size={16} className="text-accent" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">{file.name}</h3>
            <p className="text-[10px] text-text-muted uppercase tracking-wider">{file.path}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge">UTF-8</span>
          <span className="badge">{file.name.split('.').pop().toUpperCase()}</span>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-[1fr,280px] gap-4 overflow-hidden">
        {/* Code Content */}
        <div className="flex flex-col relative h-full">
          {loading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#0A0D12]/80 backdrop-blur-sm rounded-lg">
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

        {/* Intelligence Sidebar */}
        <div className="flex flex-col gap-4 overflow-y-auto pr-2">
          {metadata ? (
            <>
              {/* Functions */}
              <EvidenceBlock title="Functions">
                <div className="space-y-2">
                  {metadata.functions.length > 0 ? metadata.functions.map((fn, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-[var(--color-surface-base)] rounded-md border border-[var(--color-border-subtle)]">
                      <span className="text-[11px] font-medium text-[var(--color-text-primary)] truncate">{fn.name}</span>
                      <span className="text-[9px] text-[var(--color-text-muted)] font-mono">L{fn.line}</span>
                    </div>
                  )) : (
                    <p className="text-[10px] text-text-muted italic">No functions detected</p>
                  )}
                </div>
              </EvidenceBlock>

              {/* Classes */}
              <EvidenceBlock title="Classes">
                <div className="space-y-2">
                  {metadata.classes.length > 0 ? metadata.classes.map((cls, i) => (
                    <div key={i} className="p-2 bg-[var(--color-surface-base)] rounded-md border border-[var(--color-border-subtle)]">
                      <span className="text-[11px] font-medium text-[var(--color-text-primary)]">{cls.name}</span>
                    </div>
                  )) : (
                    <p className="text-[10px] text-text-muted italic">No classes detected</p>
                  )}
                </div>
              </EvidenceBlock>

              {/* Imports */}
              <EvidenceBlock title="Dependencies">
                <div className="space-y-1">
                  {metadata.imports.length > 0 ? metadata.imports.map((imp, i) => (
                    <div key={i} className="text-[10px] font-mono text-[var(--color-accent-soft-cyan)] opacity-80 truncate">
                      {imp.source}
                    </div>
                  )) : (
                    <p className="text-[10px] text-text-muted italic">No imports detected</p>
                  )}
                </div>
              </EvidenceBlock>
            </>
          ) : (
            <StatusBlock status="idle" message="Parsing logic pending for this file type." />
          )}
        </div>
      </div>
    </div>
  )
}

export default FileViewer
