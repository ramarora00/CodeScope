import React, { useState, useEffect } from 'react';
import { Layers, GitBranch, Database, Globe, ChevronRight, RefreshCw, AlertTriangle, CheckCircle2, Server, Code2 } from 'lucide-react';

/* ─── Layer type → visual config ─── */
const LAYER_CONFIG = {
  'Frontend':      { color: '#7A8A9F', icon: Code2,   desc: 'UI components, pages, client-side logic' },
  'Backend':       { color: '#7A8F7B', icon: Server,   desc: 'API routes, controllers, middleware' },
  'Database':      { color: '#8B8475', icon: Database, desc: 'Models, schemas, data access layer' },
  'External APIs': { color: '#9A8AAF', icon: Globe,    desc: 'Third-party integrations, external services' },
  'Auth':          { color: '#8B6B6B', icon: GitBranch, desc: 'Authentication and authorization' },
  default:         { color: '#5C657A', icon: Layers,   desc: 'System component' },
};

/* ─── Domain boundary card ─── */
const DomainCard = ({ cluster, index }) => {
  const [expanded, setExpanded] = useState(false);
  const cfg = LAYER_CONFIG[cluster.inferredName] || LAYER_CONFIG.default;
  const Icon = cfg.icon;

  return (
    <div
      style={{ background: '#10141C', border: '1px solid #1C2331', borderRadius: 12, overflow: 'hidden', borderLeft: `2px solid ${cfg.color}` }}
    >
      <div
        onClick={() => setExpanded(!expanded)}
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer' }}
      >
        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${cfg.color}18`, border: `1px solid ${cfg.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={13} color={cfg.color} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#D8DCE6', marginBottom: 2 }}>
            {cluster.inferredName} Domain
          </div>
          <div style={{ display: 'flex', gap: 8, fontSize: 9, color: '#5C657A' }}>
            <span>{cluster.routes?.length || 0} routes</span>
            <span>·</span>
            <span>{cluster.files?.length || 0} files</span>
            <span>·</span>
            <span>{cluster.symbols?.length || 0} symbols</span>
          </div>
        </div>

        <ChevronRight size={13} color="#3A4258" style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s ease', flexShrink: 0 }} />
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid #1C2331', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Routes */}
          {cluster.routes?.length > 0 && (
            <div>
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#3A4258', marginBottom: 6 }}>Routes</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {cluster.routes.map((r, i) => (
                  <span key={i} style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', padding: '3px 8px', background: '#0A0E15', border: '1px solid #1C2331', borderRadius: 4, color: '#7A8F7B' }}>
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Files */}
          {cluster.files?.length > 0 && (
            <div>
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#3A4258', marginBottom: 6 }}>Core Files</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {cluster.files.slice(0, 5).map((f, i) => (
                  <div key={i} style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: '#8E97A8', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 3, height: 3, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
                    {f.split('/').pop()}
                  </div>
                ))}
                {cluster.files.length > 5 && (
                  <div style={{ fontSize: 9, color: '#3A4258' }}>+{cluster.files.length - 5} more files</div>
                )}
              </div>
            </div>
          )}

          {/* Symbols */}
          {cluster.symbols?.length > 0 && (
            <div>
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#3A4258', marginBottom: 6 }}>Core Entities & Actions</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {cluster.symbols.slice(0, 8).map((s, i) => (
                  <span key={i} style={{ fontSize: 9, fontFamily: 'monospace', padding: '2px 7px', background: '#0A0E15', border: '1px solid #1C2331', borderRadius: 4, color: '#5C657A' }}>
                    {s}
                  </span>
                ))}
                {cluster.symbols.length > 8 && (
                  <span style={{ fontSize: 9, color: '#3A4258', padding: '2px 7px' }}>+{cluster.symbols.length - 8}</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ─── System layer diagram ─── */
const SystemLayers = ({ stack, clusters }) => {
  const layers = [
    { name: 'Frontend',      color: '#7A8A9F', files: clusters?.filter(c => c.inferredName?.toLowerCase().includes('frontend') || c.inferredName?.toLowerCase().includes('ui'))?.flatMap(c => c.files) || [] },
    { name: 'API / Routes',  color: '#7A8F7B', files: clusters?.flatMap(c => c.routes) || [] },
    { name: 'Services',      color: '#8B8475', files: clusters?.flatMap(c => c.symbols?.filter(s => s.includes('Service'))) || [] },
    { name: 'Data / Models', color: '#9A8AAF', files: clusters?.flatMap(c => c.symbols?.filter(s => s.includes('Model'))) || [] },
    { name: 'External APIs', color: '#5C657A', files: [] },
  ];

  return (
    <div style={{ background: '#10141C', border: '1px solid #1C2331', borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid #1C2331', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5C657A', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Layers size={12} />
        System Layer Architecture
      </div>
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 3, position: 'relative' }}>
        {/* Connecting line */}
        <div style={{ position: 'absolute', left: 38, top: 36, bottom: 36, width: 1, background: '#1C2331', zIndex: 0 }} />

        {layers.map((layer, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', background: '#0A0E15', border: '1px solid #1C2331', borderRadius: 10, position: 'relative', zIndex: 1 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: `${layer.color}18`, border: `1px solid ${layer.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: layer.color }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#D8DCE6' }}>{layer.name}</div>
            </div>
            <div style={{ fontSize: 9, color: '#3A4258', fontFamily: 'monospace' }}>
              Layer {i + 1}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ═══ ARCHITECTURE SCREEN ═══ */
const ArchitectureScreen = ({ repo }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { if (repo) fetchArch(); }, [repo]);

  const fetchArch = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`http://localhost:5000/api/repo/${repo.id}/architecture`);
      if (!res.ok) throw new Error(`Server ${res.status}`);
      const d = await res.json();
      setData(d);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <div style={{ width: 42, height: 42, borderRadius: 12, background: '#10141C', border: '1px solid #1C2331', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Layers size={18} color="#5C657A" style={{ animation: 'pulse 1.5s ease-in-out infinite' }} />
      </div>
      <p style={{ fontSize: 11, color: '#5C657A', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Mapping Architecture...</p>
    </div>
  );

  if (error) return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <AlertTriangle size={24} color="#8B6B6B" style={{ opacity: 0.7 }} />
      <p style={{ fontSize: 12, color: '#5C657A' }}>{error}</p>
      <button onClick={fetchArch} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #1C2331', borderRadius: 8, color: '#8E97A8', fontSize: 11, cursor: 'pointer' }}>
        Retry
      </button>
    </div>
  );

  const { stack, clusters, summary } = data || {};

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid #1C2331', flexShrink: 0, background: '#0A0E15' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Layers size={16} color="#8E97A8" />
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#D8DCE6', letterSpacing: '-0.02em' }}>System Blueprints</h2>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5C657A' }}>Architectural Overview</span>
          </div>
          <button onClick={fetchArch} style={{ padding: 7, background: '#10141C', border: '1px solid #1C2331', borderRadius: 8, cursor: 'pointer', color: '#5C657A' }}>
            <RefreshCw size={12} />
          </button>
        </div>

        {/* Tech stack */}
        {stack?.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
            {stack.map(s => (
              <span key={s} style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '3px 8px', background: '#10141C', border: '1px solid #283245', borderRadius: 5, color: '#8E97A8' }}>
                {s}
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* System Layers diagram */}
        <SystemLayers stack={stack} clusters={clusters} />

        {/* Bounded Contexts */}
        {clusters?.length > 0 && (
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5C657A', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <GitBranch size={11} />
              Bounded Contexts (DDD) — {clusters.length} detected
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {clusters.map((c, i) => <DomainCard key={i} cluster={c} index={i} />)}
            </div>
          </div>
        )}

        {/* AI Architectural Analysis */}
        {summary && (
          <div style={{ background: '#10141C', border: '1px solid #1C2331', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #1C2331', display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={12} color="#7A8F7B" />
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5C657A' }}>
                AI Architectural Analysis
              </span>
            </div>
            <div style={{ padding: 20, fontSize: 12, color: '#8E97A8', lineHeight: 1.8, whiteSpace: 'pre-wrap', maxHeight: 400, overflowY: 'auto' }}>
              {summary}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArchitectureScreen;
