import React, { useState, useEffect } from 'react'
import { API_BASE } from '../config/api'

// ─────────────────────────────────────────────────────────────────
// AI MEMORY FILE ROW
// Core unit layering AI Memory signals onto spatial repository structure.
//
// Rules:
//   - Structure: Preserves tree depth, path, and folder hierarchy.
//   - Row Height: 28px default, expands to 44px on hover if AI summary exists.
//   - Opacity (Familiarity):
//       • Untouched:    35% opacity (thin 300)
//       • Scanned:      55% opacity (400)
//       • Investigated: 85% opacity (500)
//       • Core:         100% opacity + 1px accent left bar
//   - Folder Indicator: 6px circle (hollow = unexplored, filled = explored)
//   - Hover: 150ms enter, 100ms exit. Accent @ 4% bg tint.
//   - Zero IDE Chrome: No chevrons, no file extension icons, no language colors.
// ─────────────────────────────────────────────────────────────────
function AIMemoryRow({
  item,
  depth = 0,
  isLast = true,
  activeLines = [],
  onFileSelect,
  selectedPath,
  aiMemoryMap = {},
  activeInvestigatingFile = null
}) {
  const [hovered, setHovered] = useState(false)
  const [isOpen, setIsOpen] = useState(depth < 2) // Auto-expand top 2 levels

  const isDirectory = item.type === 'directory'
  const isSelected = selectedPath === item.path
  const isCurrentlyReading = activeInvestigatingFile && (
    activeInvestigatingFile === item.path ||
    activeInvestigatingFile.endsWith(item.name)
  )

  // Retrieve AI Familiarity & Summary metadata from memory map
  // Path matching: try exact, then suffix match (e.g., 'src/App.jsx' matches item.path 'src/App.jsx')
  const meta = (() => {
    if (!aiMemoryMap) return {};
    // 1. Exact match
    if (aiMemoryMap[item.path]) return aiMemoryMap[item.path];
    // 2. Suffix match — event might have shorter path like 'App.jsx' vs item.path 'src/App.jsx'
    const entries = Object.entries(aiMemoryMap);
    for (const [key, val] of entries) {
      if (item.path.endsWith(key) || key.endsWith(item.path)) return val;
    }
    return {};
  })();
  const familiarityState = meta.state || (isDirectory ? 'scanned' : 'untouched') // 'untouched' | 'scanned' | 'investigated' | 'core'
  const aiSummary = meta.summary || item.aiSummary || null
  const lastInvestigatedTime = meta.lastInvestigatedTime || null

  // Calculate Opacity based on AI Familiarity System (quieter baseline values)
  let baseOpacity = 0.25
  let fontWeight = 300
  let isCore = false

  if (isDirectory) {
    baseOpacity = 0.55
    fontWeight = 500
  } else if (familiarityState === 'core') {
    baseOpacity = 0.90
    fontWeight = 500
    isCore = true
  } else if (familiarityState === 'investigated') {
    baseOpacity = 0.70
    fontWeight = 500
  } else if (familiarityState === 'scanned') {
    baseOpacity = 0.45
    fontWeight = 400
  }

  // Semantic File Type Color
  const extension = item.name.split('.').pop().toLowerCase()
  let semanticColor = 'var(--cs-text)'
  if (!isDirectory && !isSelected) {
    if (['md', 'txt', 'csv'].includes(extension)) {
      semanticColor = 'rgba(220, 225, 235, 0.75)' // Document tone
    } else if (['json', 'yml', 'yaml', 'env', 'config'].includes(extension)) {
      semanticColor = 'rgba(195, 215, 205, 0.85)' // Config tone
    } else if (['js', 'jsx', 'ts', 'tsx', 'py', 'go', 'rs', 'java', 'c', 'cpp'].includes(extension)) {
      semanticColor = 'rgba(215, 230, 255, 0.95)' // Source tone
    } else {
      semanticColor = 'rgba(255, 255, 255, 0.85)' // Default fallback
    }
  }

  // Calculate Recency Underline Opacity (0-10 min decay)
  let recencyOpacity = 0
  if (lastInvestigatedTime) {
    const elapsedMinutes = (Date.now() - lastInvestigatedTime) / (1000 * 60)
    if (elapsedMinutes <= 2) recencyOpacity = 0.60
    else if (elapsedMinutes <= 5) recencyOpacity = 0.40
    else if (elapsedMinutes <= 10) recencyOpacity = 0.20
  }

  // Check if directory has explored children
  const hasExploredChildren = isDirectory && item.children && item.children.some(child => {
    const childMeta = (() => {
      if (!aiMemoryMap) return {};
      if (aiMemoryMap[child.path]) return aiMemoryMap[child.path];
      const entries = Object.entries(aiMemoryMap);
      for (const [key, val] of entries) {
        if (child.path.endsWith(key) || key.endsWith(child.path)) return val;
      }
      return {};
    })();
    return childMeta.state === 'investigated' || childMeta.state === 'core';
  })

  const handleClick = (e) => {
    e.stopPropagation()
    if (isDirectory) {
      setIsOpen(o => !o)
    } else {
      onFileSelect(item)
    }
  }

  const hasSummary = !isDirectory && hovered && Boolean(aiSummary)

  return (
    <div>
      <div
        onClick={handleClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`relative transition-all duration-[200ms] ${isCurrentlyReading ? 'animate-pulse-dot' : ''}`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          minHeight: hasSummary ? '44px' : '30px',
          paddingLeft: '12px',
          paddingRight: '12px',
          paddingTop: hasSummary ? '6px' : '4px',
          paddingBottom: hasSummary ? '6px' : '4px',
          cursor: 'pointer',
          borderRadius: '4px',
          margin: '1px 2px',
          background: isSelected
            ? 'rgba(191,200,216,0.08)'
            : hovered
              ? 'rgba(191,200,216,0.04)'
              : 'transparent',
          borderLeft: isSelected
            ? '2px solid var(--cs-accent)'
            : isCore
              ? '1px solid rgba(191,200,216,0.5)'
              : '1px solid transparent',
          opacity: hovered ? Math.min(1.0, baseOpacity + 0.15) : baseOpacity,
          userSelect: 'none',
          transition: 'min-height 200ms cubic-bezier(0.16, 1, 0.3, 1), opacity 150ms ease, background 150ms ease',
        }}
      >
        <div style={{ display: 'flex', items: 'center', minWidth: 0, height: '20px', position: 'relative' }}>
          {/* Continuous Tree Lines (ASCII) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              height: '100%',
              fontFamily: 'var(--cs-mono)',
              fontSize: '13px',
              color: 'rgba(255,255,255,0.3)',
              whiteSpace: 'pre',
              pointerEvents: 'none',
              marginRight: '6px'
            }}
          >
            {activeLines.slice(0, depth).map((isActive, i) => (
              <span key={i}>{isActive ? '│   ' : '    '}</span>
            ))}
            {depth >= 0 && (
              <span>{isLast ? '└── ' : '├── '}</span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            {isDirectory && (
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: 'var(--cs-mono)',
                  color: isOpen ? 'rgba(191,200,216,0.5)' : 'rgba(191,200,216,0.2)',
                  flexShrink: 0,
                  width: '12px',
                  transition: 'color 150ms ease',
                  userSelect: 'none',
                }}
              >
                {isOpen ? '▾' : '▸'}
              </span>
            )}

            {/* Filename with Recency Underline */}
            <div style={{ display: 'inline-flex', flexDirection: 'column', position: 'relative', minWidth: 0, flex: 1, marginLeft: isDirectory ? '0' : '12px' }}>
              <span
                style={{
                  fontFamily: 'var(--cs-mono)',
                  fontSize: '13px',
                  fontWeight: isSelected ? 500 : fontWeight,
                  color: isSelected ? 'var(--cs-text)' : semanticColor,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.name}
              </span>
              {/* Recency 1px Underline */}
              {!isDirectory && recencyOpacity > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '1px',
                    left: 0,
                    width: '100%',
                    height: '1px',
                    background: 'var(--cs-accent)',
                    opacity: recencyOpacity,
                    pointerEvents: 'none',
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* AI Summary Expansion (Inter, 12px, italic, 50% opacity, with summary breathing room) */}
        {hasSummary && (
          <div
            className="animate-fade-in"
            style={{
              marginTop: '6px',
              marginBottom: '4px',
              paddingLeft: `${depth * 16 + 14}px`,
              fontSize: '12px',
              fontFamily: 'var(--cs-sans)',
              fontStyle: 'italic',
              color: 'var(--cs-muted)',
              opacity: 0.5,
              lineHeight: '1.5',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {aiSummary}
          </div>
        )}
      </div>

      {/* Children (Folder expansion) */}
      {isDirectory && isOpen && item.children && (
        <div className="animate-fade-in">
          {item.children.map((child, idx) => (
            <AIMemoryRow
              key={`${child.path}-${idx}`}
              item={child}
              depth={depth + 1}
              isLast={idx === item.children.length - 1}
              activeLines={depth > 0 ? [...activeLines, !isLast] : [!isLast]}
              onFileSelect={onFileSelect}
              selectedPath={selectedPath}
              aiMemoryMap={aiMemoryMap}
              activeInvestigatingFile={activeInvestigatingFile}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// FILE EXPLORER
// Spatial Repository Tree + AI Familiarity Memory Layer.
// ─────────────────────────────────────────────────────────────────
const FileExplorer = ({
  repo,
  onFileSelect,
  aiMemoryMap = {},
  selectedPath = null,
  isContext,
  activeInvestigatingFile = null
}) => {
  const [tree, setTree] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sortMode, setSortMode] = useState('structure') // 'structure' | 'relevance'
  const [searchQuery, setSearchQuery] = useState('')

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
    <div style={{ padding: '32px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <div
        style={{
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          border: '1.5px solid var(--cs-border)',
          borderTopColor: 'var(--cs-accent)',
          animation: 'spin 800ms linear infinite',
        }}
      />
      {!isContext && (
        <span style={{ color: 'var(--cs-muted)', fontSize: '11px', fontFamily: 'var(--cs-mono)', opacity: 0.5 }}>
          AI reading repository structure...
        </span>
      )}
    </div>
  )

  if (error) return (
    <div style={{ padding: '24px', textAlign: 'center' }}>
      {!isContext && (
        <span style={{ color: 'var(--cs-red)', fontSize: '11px', fontFamily: 'var(--cs-mono)', opacity: 0.7 }}>
          {error}
        </span>
      )}
      <button
        onClick={fetchFileTree}
        style={{ color: 'var(--cs-accent)', fontSize: '11px', background: 'none', border: 'none', cursor: 'pointer', marginTop: '8px' }}
      >
        retry
      </button>
    </div>
  )

  // Context Level Representation (Sliver mode)
  if (isContext) {
    return (
      <div className="flex flex-col items-center h-full pt-8 pb-4 border-r border-transparent hover:bg-white/[0.02] transition-colors w-[48px]">
        <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', color: 'var(--cs-faint)', fontSize: '9px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '24px', opacity: 0.8 }}>
          Memory
        </div>
        <div className="flex-1 flex flex-col items-center gap-2 w-full pt-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} style={{
              width: '12px', height: '4px', borderRadius: '1px',
              background: i < 3 ? 'var(--cs-accent)' : 'var(--cs-border)',
              opacity: i < 3 ? 0.7 : 0.2
            }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px 24px' }}>

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar" style={{ padding: '4px 0' }}>
        {tree.length > 0 ? tree.map((item, idx) => (
          <AIMemoryRow
            key={`${item.path}-${idx}`}
            item={item}
            depth={0}
            isLast={idx === tree.length - 1}
            activeLines={[]}
            onFileSelect={onFileSelect}
            selectedPath={selectedPath}
            aiMemoryMap={aiMemoryMap}
            activeInvestigatingFile={activeInvestigatingFile}
          />
        )) : (
          <p style={{ color: 'var(--cs-hint)', fontSize: '11px', fontFamily: 'var(--cs-mono)', padding: '24px', textAlign: 'center' }}>
            empty repository
          </p>
        )}
      </div>
    </div>
  )
}

export default FileExplorer

