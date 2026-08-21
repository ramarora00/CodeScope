import React, { useState, useEffect } from 'react'
import { API_BASE } from '../config/api';
import { apiFetch } from '../config/apiFetch';
import { FileIcon } from 'lucide-react';

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

  // Check if this file is under assets/public folders for quieting
  const isAssetPath = item.path.startsWith('public/') || 
                      item.path.startsWith('assets/') || 
                      item.path.startsWith('images/') || 
                      item.path.startsWith('static/') || 
                      item.path.includes('/public/') || 
                      item.path.includes('/assets/');

  // Calculate Opacity based on AI Familiarity System (quieter baseline values)
  let baseOpacity = 0.40
  let fontWeight = 400
  let isCore = false

  if (isDirectory) {
    baseOpacity = isAssetPath ? 0.45 : 0.75;
    fontWeight = 500
  } else if (familiarityState === 'core') {
    baseOpacity = 1.0
    fontWeight = 600
    isCore = true
  } else if (familiarityState === 'investigated') {
    baseOpacity = 0.75
    fontWeight = 500
  } else if (familiarityState === 'scanned') {
    baseOpacity = 0.60
    fontWeight = 400
  } else {
    // untouched
    baseOpacity = isAssetPath ? 0.35 : 0.45;
    fontWeight = 300
  }

  const extension = item.name.split('.').pop().toLowerCase()
  let semanticColor = isSelected ? 'var(--cs-text)' : 'rgba(255,255,255,0.85)'
  if (!isDirectory && !isSelected) {
    if (['js', 'jsx'].includes(extension)) semanticColor = '#E3B341';
    else if (['ts', 'tsx'].includes(extension)) semanticColor = '#58A6FF'; // softer blue for text
    else if (extension === 'json') semanticColor = '#F85149';
    else if (extension === 'md') semanticColor = '#8B949E';
    else if (['png', 'jpg', 'svg'].includes(extension)) semanticColor = '#A371F7';
    else semanticColor = 'rgba(255,255,255,0.7)';
  }
  
  const getFileBadge = (filename, isFileSelected) => {
    const lower = filename.toLowerCase();
    if (isDirectory) {
      return (
        <svg style={{ marginRight: '7px', color: isOpen ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.3)', width: '14px', height: '14px', flexShrink: 0, transition: 'color 200ms ease, transform 200ms ease', transform: isOpen ? 'rotate(0deg)' : 'rotate(-8deg)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      );
    }
    
    // Semantic color overrides for clear scanning
    const opacityFactor = isFileSelected ? 0.2 : 0.08;
    
    if (lower.endsWith('.js') || lower.endsWith('.jsx')) {
      return <span style={{color: '#E3B341', fontSize: '9px', fontWeight: 800, background: `rgba(227,179,65,${opacityFactor})`, padding: '2px 4px', borderRadius: '3px', marginRight: '6px', border: '1px solid rgba(227,179,65,0.2)'}}>JS</span>;
    }
    if (lower.endsWith('.ts') || lower.endsWith('.tsx')) {
      return <span style={{color: '#3178C6', fontSize: '9px', fontWeight: 800, background: `rgba(49,120,198,${opacityFactor})`, padding: '2px 4px', borderRadius: '3px', marginRight: '6px', border: '1px solid rgba(49,120,198,0.2)'}}>TS</span>;
    }
    if (lower.endsWith('.json')) {
      return <span style={{color: '#F85149', fontSize: '10px', fontWeight: 800, background: `rgba(248,81,73,${opacityFactor})`, padding: '2px 4px', borderRadius: '3px', marginRight: '6px', border: '1px solid rgba(248,81,73,0.2)'}}>{'{ }'}</span>;
    }
    if (lower.endsWith('.md')) {
      return <span style={{color: '#58A6FF', fontSize: '10px', fontWeight: 800, background: `rgba(88,166,255,${opacityFactor})`, padding: '2px 4px', borderRadius: '3px', marginRight: '6px', border: '1px solid rgba(88,166,255,0.2)'}}>MD</span>;
    }
    if (lower.endsWith('.pdf')) {
      return <span style={{color: '#EF4444', fontSize: '9px', fontWeight: 800, background: `rgba(239,68,68,${opacityFactor})`, padding: '2px 4px', borderRadius: '3px', marginRight: '6px', border: '1px solid rgba(239,68,68,0.2)'}}>PDF</span>;
    }
    if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.svg')) {
      return <span style={{color: '#8B5CF6', fontSize: '9px', fontWeight: 800, background: `rgba(139,92,246,${opacityFactor})`, padding: '2px 4px', borderRadius: '3px', marginRight: '6px', border: '1px solid rgba(139,92,246,0.2)'}}>IMG</span>;
    }
    return <span style={{color: 'rgba(255,255,255,0.5)', fontSize: '9px', fontWeight: 800, background: `rgba(255,255,255,${opacityFactor})`, padding: '2px 4px', borderRadius: '3px', marginRight: '6px', border: '1px solid rgba(255,255,255,0.1)'}}>{filename.split('.').pop().toUpperCase().substring(0, 2)}</span>;
  };
  
  const icon = getFileBadge(item.name, isSelected);

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
          minHeight: hasSummary ? '44px' : '28px',
          paddingLeft: '12px',
          paddingRight: '12px',
          paddingTop: hasSummary ? '6px' : '2px',
          paddingBottom: hasSummary ? '6px' : '2px',
          cursor: 'pointer',
          borderRadius: '6px',
          margin: '2px 4px',
          background: isSelected
            ? 'rgba(255,255,255,0.12)'
            : isCurrentlyReading
              ? 'linear-gradient(90deg, rgba(140,190,255,0.12) 0%, rgba(140,190,255,0.03) 100%)'
              : hovered
                ? 'rgba(255,255,255,0.04)'
                : 'transparent',
          boxShadow: isCurrentlyReading
            ? 'inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 8px rgba(0,0,0,0.2)'
            : isSelected
              ? '0 4px 16px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08), inset 0 -1px 0 rgba(255,255,255,0.02)'
              : 'none',
          border: isCurrentlyReading
            ? '1px solid rgba(140,190,255,0.2)'
            : '1px solid transparent',
          borderLeft: isCurrentlyReading
            ? '2px solid rgba(140,190,255,0.8)'
            : isSelected
              ? '2px solid rgba(255,255,255,0.8)'
              : isCore
                ? '1px solid rgba(255,255,255,0.3)'
                : '1px solid transparent',
          userSelect: 'none',
          transition: 'min-height 200ms cubic-bezier(0.16, 1, 0.3, 1), background 150ms ease, border-color 150ms ease, box-shadow 150ms ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', minWidth: 0, height: '20px', position: 'relative' }}>
          {/* Continuous Tree Lines (ASCII) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              height: '100%',
              fontFamily: 'var(--cs-mono)',
              fontSize: '13px',
              color: 'rgba(255,255,255,0.1)', // Substantially quieter
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
            <div style={{ display: 'inline-flex', flexDirection: 'row', alignItems: 'center', position: 'relative', minWidth: 0, flex: 1, marginLeft: isDirectory ? '0' : '12px', opacity: hovered ? Math.min(1.0, baseOpacity + 0.15) : baseOpacity, gap: '0px' }}>
              <span
                style={{
                  fontFamily: 'var(--cs-mono)',
                  fontSize: isDirectory ? '12px' : '13px',
                  fontWeight: isSelected ? 500 : fontWeight,
                  color: isSelected ? 'var(--cs-text)' : semanticColor,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center',
                  letterSpacing: isDirectory ? '0.02em' : '0',
                }}
              >
                {icon}{item.name}
              </span>
            </div>

            {/* AI state indicator — right-aligned, restrained. Repository tree first, AI state second. */}
            {!isDirectory && (
              <span style={{
                flexShrink: 0,
                marginLeft: '8px',
                fontFamily: 'var(--cs-mono)',
                fontSize: '10px',
                lineHeight: '20px',
                userSelect: 'none',
                ...(isCurrentlyReading
                  ? { color: 'var(--cs-accent)', opacity: 1 }        // ● active
                  : familiarityState === 'core' || familiarityState === 'investigated'
                    ? { color: 'var(--cs-muted)', opacity: 0.6 }      // ✓ visited
                    : familiarityState === 'scanned'
                      ? { color: 'var(--cs-hint)', opacity: 0.5 }     // ○ contextual
                      : { display: 'none' }                            // untouched — no indicator
                )
              }}>
                {isCurrentlyReading
                  ? <span style={{display: 'flex', alignItems: 'center', gap: '3px'}}><span style={{fontSize: '11px', color: 'var(--cs-accent)'}}>◉</span> <span style={{fontSize: '9px', fontWeight: 600, color: 'var(--cs-accent)', opacity: 0.8, letterSpacing: '0.05em'}}>AI</span></span>
                  : familiarityState === 'core' || familiarityState === 'investigated'
                    ? '✓'
                    : familiarityState === 'scanned'
                      ? '○'
                      : null}
              </span>
            )}
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
  activeInvestigatingFile = null
}) => {
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
      const res = await apiFetch(`${API_BASE}/api/repo/${repo.id}/files`);
      const data = await res.json();
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
      <span style={{ color: 'var(--cs-muted)', fontSize: '11px', fontFamily: 'var(--cs-mono)', opacity: 0.5 }}>
        AI reading repository structure...
      </span>
    </div>
  )

  if (error) return (
    <div style={{ padding: '24px', textAlign: 'center' }}>
      <span style={{ color: 'var(--cs-red)', fontSize: '11px', fontFamily: 'var(--cs-mono)', opacity: 0.7 }}>
        {error}
      </span>
      <button
        onClick={fetchFileTree}
        style={{ color: 'var(--cs-accent)', fontSize: '11px', background: 'none', border: 'none', cursor: 'pointer', marginTop: '8px' }}
      >
        retry
      </button>
    </div>
  )


  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0 }}>

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar" style={{ padding: 0 }}>
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

