import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  RefreshCw, ChevronRight, GitBranch, Network, Box,
  Layers, FileCode2, Activity, ShieldCheck, AlertTriangle,
  XCircle, Sparkles, Route, TrendingUp, Hash
} from 'lucide-react';

/* ─── Seeded-random for stable galaxy positions ─── */
function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

const DOMAIN_COLORS = [
  { ring: '#4A5568', glow: 'rgba(74,85,104,0.25)',  text: '#A0AEC0' },
  { ring: '#4A6358', glow: 'rgba(74,99,88,0.25)',   text: '#9CB8AE' },
  { ring: '#4A4A63', glow: 'rgba(74,74,99,0.25)',   text: '#A0A0C8' },
  { ring: '#635648', glow: 'rgba(99,86,72,0.25)',   text: '#C8B8A0' },
  { ring: '#634A4A', glow: 'rgba(99,74,74,0.25)',   text: '#C8A0A0' },
  { ring: '#486358', glow: 'rgba(72,99,88,0.25)',   text: '#A0C8B8' },
];

/* ─── System Galaxy Canvas ─── */
const SystemGalaxy = ({ domains, stats, onDomainClick, selectedDomain }) => {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const timeRef = useRef(0);

  const positions = useMemo(() => {
    if (!domains?.length) return [];
    const rng = seededRandom(domains.length * 7 + 13);
    const cx = 0, cy = 0;
    const minRadius = 100, maxRadius = 180;

    return domains.map((d, i) => {
      const angle = (i / domains.length) * Math.PI * 2 - Math.PI / 2;
      const radius = minRadius + rng() * (maxRadius - minRadius);
      return {
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        color: DOMAIN_COLORS[i % DOMAIN_COLORS.length],
        label: d.name,
        size: 24 + Math.min(d.fileCount * 3, 24),
        fileCount: d.fileCount,
        routeCount: d.routeCount,
      };
    });
  }, [domains]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2, cy = H / 2;

    const draw = (time) => {
      timeRef.current = time;
      ctx.clearRect(0, 0, W, H);

      /* Central core */
      const coreGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 70);
      coreGlow.addColorStop(0, 'rgba(216,220,230,0.12)');
      coreGlow.addColorStop(0.4, 'rgba(216,220,230,0.04)');
      coreGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = coreGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, 70, 0, Math.PI * 2);
      ctx.fill();

      /* Core dot */
      ctx.fillStyle = 'rgba(216,220,230,0.6)';
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(216,220,230,0.15)';
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.fill();

      /* Orbital rings (slow rotation) */
      const rot = (time / 30000) * Math.PI * 2;
      [100, 140, 185].forEach((r, ri) => {
        ctx.strokeStyle = `rgba(28,35,49,${0.6 - ri * 0.15})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 12]);
        ctx.lineDashOffset = -rot * r * 0.5;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      /* Connector lines from core to each domain */
      positions.forEach(p => {
        ctx.strokeStyle = `rgba(28,35,49,0.9)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + p.x, cy + p.y);
        ctx.stroke();
      });

      /* Domain nodes */
      positions.forEach((p, i) => {
        const nx = cx + p.x;
        const ny = cy + p.y;
        const pulse = 1 + 0.04 * Math.sin(time / 2000 + i * 1.3);
        const r = p.size * pulse;

        /* Glow */
        const grad = ctx.createRadialGradient(nx, ny, 0, nx, ny, r * 2.5);
        grad.addColorStop(0, p.color.glow);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(nx, ny, r * 2.5, 0, Math.PI * 2);
        ctx.fill();

        /* Ring */
        ctx.strokeStyle = selectedDomain === p.label ? 'rgba(216,220,230,0.8)' : p.color.ring;
        ctx.lineWidth = selectedDomain === p.label ? 1.5 : 1;
        ctx.beginPath();
        ctx.arc(nx, ny, r, 0, Math.PI * 2);
        ctx.stroke();

        /* Fill */
        const inner = ctx.createRadialGradient(nx, ny, 0, nx, ny, r);
        inner.addColorStop(0, 'rgba(16,20,28,0.9)');
        inner.addColorStop(1, 'rgba(8,10,15,0.95)');
        ctx.fillStyle = inner;
        ctx.beginPath();
        ctx.arc(nx, ny, r - 0.5, 0, Math.PI * 2);
        ctx.fill();

        /* Label */
        ctx.fillStyle = selectedDomain === p.label ? '#D8DCE6' : p.color.text;
        ctx.font = `bold ${r > 32 ? 11 : 9}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.label, nx, ny);

        /* Satellite dots for files */
        for (let f = 0; f < Math.min(p.fileCount, 6); f++) {
          const satAngle = (f / Math.min(p.fileCount, 6)) * Math.PI * 2 + time / 4000 + i;
          const satR = r + 14;
          ctx.fillStyle = `rgba(216,220,230,0.25)`;
          ctx.beginPath();
          ctx.arc(nx + Math.cos(satAngle) * satR, ny + Math.sin(satAngle) * satR, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [positions, selectedDomain]);

  const handleClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const cx = canvas.width / 2, cy = canvas.height / 2;

    for (const p of positions) {
      const nx = cx + p.x, ny = cy + p.y;
      const dist = Math.sqrt((mx - nx) ** 2 + (my - ny) ** 2);
      if (dist <= p.size + 4) {
        onDomainClick?.(p.label === selectedDomain ? null : p.label);
        return;
      }
    }
    onDomainClick?.(null);
  };

  return (
    <canvas
      ref={canvasRef}
      width={460}
      height={460}
      className="cursor-pointer"
      onClick={handleClick}
      style={{ display: 'block' }}
    />
  );
};

/* ─── Resolution progress bar ─── */
const ResBar = ({ label, count, total }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-[10px]">
        <span className="text-text-secondary font-mono">{label}</span>
        <span className="text-text-primary font-bold">{count} <span className="text-text-muted font-normal">({pct}%)</span></span>
      </div>
      <div className="h-1 rounded-full bg-bg-hover overflow-hidden">
        <div className="h-full rounded-full bg-success transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

/* ─── Domain Detail Panel ─── */
const DomainDetail = ({ domainName, domains }) => {
  const d = domains?.find(x => x.name === domainName);
  if (!d) return null;
  return (
    <div className="glass border border-border rounded-xl p-4 animate-rise">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-text-primary">{d.name} Domain</span>
        <span className="text-[9px] text-text-muted uppercase tracking-widest">Active Focus</span>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-bg-surface border border-border rounded-lg p-2">
          <div className="text-lg font-bold text-text-primary">{d.routeCount}</div>
          <div className="text-[9px] text-text-muted uppercase tracking-wider">Routes</div>
        </div>
        <div className="bg-bg-surface border border-border rounded-lg p-2">
          <div className="text-lg font-bold text-text-primary">{d.fileCount}</div>
          <div className="text-[9px] text-text-muted uppercase tracking-wider">Files</div>
        </div>
      </div>
      {d.routes?.slice(0, 4).map((r, i) => (
        <div key={i} className="flex items-center gap-2 py-1 border-t border-border first:border-0">
          <span className="text-[9px] font-mono px-1.5 py-0.5 bg-bg-surface border border-border rounded text-text-muted">ROUTE</span>
          <span className="text-[10px] font-mono text-text-secondary truncate">{r}</span>
        </div>
      ))}
      {d.routes?.length > 4 && (
        <p className="text-[9px] text-text-muted mt-1 pl-1">+{d.routes.length - 4} more routes</p>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   MAIN OVERVIEW COMPONENT
═══════════════════════════════════════════════════════ */
const OverviewScreen = ({ repo }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDomain, setSelectedDomain] = useState(null);

  useEffect(() => { if (repo) fetchStats(); }, [repo]);

  const fetchStats = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`http://localhost:5000/api/repo/${repo.id}/stats`);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      setStats(data);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <div className="h-full flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-bg-surface border border-border flex items-center justify-center">
        <Activity size={20} className="text-text-muted animate-pulse" />
      </div>
      <p className="text-[11px] text-text-muted uppercase tracking-widest">Mapping Intelligence...</p>
    </div>
  );

  if (error) return (
    <div className="h-full flex flex-col items-center justify-center gap-4">
      <XCircle size={28} className="text-error opacity-70" />
      <p className="text-xs text-text-muted">{error}</p>
      <button onClick={fetchStats} className="px-4 py-1.5 text-[10px] border border-border rounded-lg text-text-secondary hover:text-text-primary transition-colors">Retry</button>
    </div>
  );

  const { summary, symbolsByType, languageBreakdown, graphQuality, resolutionBreakdown, domains } = stats;
  const grade = graphQuality?.healthGrade ?? 'B';
  const gradeColors = { A: '#7A8F7B', B: '#8E97A8', C: '#8B8475', D: '#8B6B6B' };
  const gradeColor = gradeColors[grade] || gradeColors.B;

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="p-6 flex flex-col gap-6 min-h-full">

        {/* ── HERO SECTION ── */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-bg-surface">
          {/* Subtle background blob */}
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full blur-[80px] pointer-events-none"
            style={{ background: `radial-gradient(circle, ${gradeColor}22 0%, transparent 70%)` }} />
          
          <div className="relative z-10 p-8">
            <div className="flex items-start justify-between gap-6">
              {/* Identity */}
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-text-muted">Repository Active</span>
                </div>
                <h1 className="text-4xl font-bold text-gradient-silver mt-2 mb-1 capitalize">
                  {repo.name?.replace(/-/g, ' ').replace(/repo\s*/i, '') || 'Project'}
                </h1>
                <div className="flex items-center gap-3 mt-3">
                  {Object.entries(languageBreakdown || {}).map(([lang]) => (
                    <span key={lang} className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 bg-bg-elevated border border-border rounded-md text-text-secondary">.{lang}</span>
                  ))}
                </div>
              </div>

              {/* Grade + Quick stats */}
              <div className="flex items-center gap-5 flex-shrink-0">
                <div className="text-right">
                  <div className="text-[9px] font-bold uppercase tracking-widest text-text-muted mb-1">Health Grade</div>
                  <div className="text-6xl font-black" style={{ color: gradeColor }}>{grade}</div>
                </div>
                <div className="h-16 w-px bg-border" />
                <div className="flex flex-col gap-3">
                  <button onClick={fetchStats} className="p-2 border border-border rounded-lg text-text-muted hover:text-text-primary hover:border-text-muted transition-colors">
                    <RefreshCw size={13} />
                  </button>
                </div>
              </div>
            </div>

            {/* KPI Strip */}
            <div className="grid grid-cols-5 gap-4 mt-8 pt-6 border-t border-border">
              {[
                { label: 'Files',   val: summary.files,       icon: FileCode2 },
                { label: 'Symbols', val: summary.symbols,     icon: Hash },
                { label: 'Edges',   val: summary.relationships, icon: GitBranch },
                { label: 'Routes',  val: summary.routes,      icon: Route },
                { label: 'Domains', val: summary.domains,     icon: Layers },
              ].map(({ label, val, icon: Icon }) => (
                <div key={label} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Icon size={12} className="text-text-muted" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-text-muted">{label}</span>
                  </div>
                  <span className="text-2xl font-bold text-text-primary">{val ?? '—'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── SYSTEM GALAXY + RIGHT PANEL ── */}
        <div className="grid grid-cols-5 gap-5" style={{ minHeight: '480px' }}>

          {/* Galaxy visualization */}
          <div className="col-span-3 relative rounded-2xl border border-border bg-bg-surface overflow-hidden">
            <div className="absolute top-0 left-0 right-0 px-5 py-4 border-b border-border flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <Sparkles size={13} className="text-text-muted" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">System Galaxy</span>
              </div>
              <span className="text-[9px] text-text-muted">{domains?.length || 0} domains detected</span>
            </div>

            {/* Nebula depth background */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full blur-[60px]"
                style={{ background: 'radial-gradient(circle, rgba(28,35,49,0.8) 0%, transparent 70%)' }} />
            </div>

            <div className="absolute inset-0 flex items-center justify-center" style={{ paddingTop: '52px' }}>
              {domains?.length > 0 ? (
                <SystemGalaxy
                  domains={domains}
                  stats={stats}
                  selectedDomain={selectedDomain}
                  onDomainClick={setSelectedDomain}
                />
              ) : (
                <div className="flex flex-col items-center gap-3 text-text-muted">
                  <Network size={28} className="opacity-30" />
                  <p className="text-xs">No domains detected</p>
                </div>
              )}
            </div>
            {selectedDomain && (
              <div className="absolute bottom-4 left-4 right-4">
                <DomainDetail domainName={selectedDomain} domains={domains} />
              </div>
            )}
            {!selectedDomain && domains?.length > 0 && (
              <p className="absolute bottom-4 left-0 right-0 text-center text-[9px] text-text-muted">
                Click a cluster to inspect the domain
              </p>
            )}
          </div>

          {/* Right stats */}
          <div className="col-span-2 flex flex-col gap-4">

            {/* Graph Quality */}
            <div className="rounded-2xl border border-border bg-bg-surface p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck size={13} className="text-text-muted" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Graph Quality</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-text-secondary">Avg Confidence</span>
                <span className="text-xl font-bold text-text-primary">{graphQuality?.averageConfidence?.toFixed(3) ?? '—'}</span>
              </div>
              <ResBar label="High (≥ 0.8)" count={graphQuality?.highConfidenceEdges ?? 0} total={summary.relationships} />
              <ResBar label="Medium (0.4–0.8)" count={graphQuality?.mediumConfidenceEdges ?? 0} total={summary.relationships} />
              <ResBar label="Low (< 0.4)" count={graphQuality?.lowConfidenceEdges ?? 0} total={summary.relationships} />
              {graphQuality?.warning && (
                <div className="mt-1 p-2.5 rounded-xl bg-warning/10 border border-warning/20 flex gap-2 items-start">
                  <AlertTriangle size={11} className="text-warning mt-0.5 flex-shrink-0" />
                  <p className="text-[9px] text-text-secondary">{graphQuality.warning}</p>
                </div>
              )}
            </div>

            {/* Call Site Coverage */}
            <div className="rounded-2xl border border-border bg-bg-surface p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2 mb-1">
                <Network size={13} className="text-text-muted" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Call Site Coverage</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <div className="text-xl font-bold text-text-primary">{summary.callSites}</div>
                  <div className="text-[9px] text-text-muted uppercase tracking-wider mt-0.5">Total</div>
                </div>
                <div>
                  <div className="text-xl font-bold" style={{ color: '#7A8F7B' }}>{summary.resolvedCallSites}</div>
                  <div className="text-[9px] text-text-muted uppercase tracking-wider mt-0.5">Resolved</div>
                </div>
                <div>
                  <div className="text-xl font-bold" style={{ color: summary.unresolvedCallSites > 0 ? '#8B6B6B' : '#7A8F7B' }}>{summary.unresolvedCallSites}</div>
                  <div className="text-[9px] text-text-muted uppercase tracking-wider mt-0.5">Unresolved</div>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-bg-hover overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${summary.resolvedPercentage}%`, background: '#7A8F7B' }} />
              </div>
              <p className="text-[9px] text-text-muted">{summary.resolvedPercentage}% of call sites mapped in Knowledge Graph</p>
            </div>

            {/* Symbols */}
            <div className="rounded-2xl border border-border bg-bg-surface p-5 flex flex-col gap-2">
              <div className="flex items-center gap-2 mb-2">
                <Box size={13} className="text-text-muted" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Symbol Registry</span>
              </div>
              {Object.entries(symbolsByType || {}).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center py-0.5">
                  <span className="text-[11px] font-mono text-text-secondary capitalize">{type}</span>
                  <span className="text-[11px] font-bold text-text-primary">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RESOLUTION METHODS ── */}
        <div className="rounded-2xl border border-border bg-bg-surface p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={13} className="text-text-muted" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Resolution Methods</span>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {Object.entries(resolutionBreakdown || {}).map(([method, count]) => (
              <div key={method}>
                <ResBar label={method} count={count} total={summary.relationships} />
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default OverviewScreen;
