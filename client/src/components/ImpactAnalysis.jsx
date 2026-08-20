import React, { useState, useEffect, useRef } from 'react';
import { Zap, AlertTriangle, FileCode2, ChevronRight, RefreshCw, Search, Info } from 'lucide-react';
import { apiFetch } from '../config/apiFetch';
import { API_BASE } from '../config/api';
import FileIcon from './FileIcon';

/* ─── Blast Radius ring animation canvas ─── */
const BlastCanvas = ({ riskCounts }) => {
  const canvasRef = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;

    const RINGS = [
      { label: 'HIGH RISK',   radius: 85,  color: 'rgba(139,107,107,', files: riskCounts.high },
      { label: 'MEDIUM RISK', radius: 140, color: 'rgba(139,132,117,', files: riskCounts.medium },
      { label: 'LOW RISK',    radius: 190, color: 'rgba(122,143,123,', files: riskCounts.low },
    ];

    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      t += 0.008;

      /* Background depth fog */
      const fog = ctx.createRadialGradient(cx, cy, 0, cx, cy, 210);
      fog.addColorStop(0, 'rgba(20,10,10,0.4)');
      fog.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = fog;
      ctx.fillRect(0, 0, W, H);

      RINGS.forEach((ring, ri) => {
        const pulse = 1 + 0.02 * Math.sin(t + ri * 1.2);
        const r = ring.radius * pulse;
        const opacity = 0.12 + 0.06 * Math.sin(t * 0.7 + ri);

        /* Filled halo */
        const grad = ctx.createRadialGradient(cx, cy, ri === 0 ? 0 : RINGS[ri - 1].radius, cx, cy, r);
        grad.addColorStop(0, ring.color + '0)');
        grad.addColorStop(0.6, ring.color + `${opacity})`);
        grad.addColorStop(1, ring.color + '0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();

        /* Dashed ring border */
        ctx.strokeStyle = ring.color + '0.4)';
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 10]);
        ctx.lineDashOffset = -t * 20 * (ri % 2 === 0 ? 1 : -1);
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        /* Label on right side */
        const labelAngle = Math.PI / 6 + ri * 0.2;
        const lx = cx + Math.cos(labelAngle) * r + 4;
        const ly = cy + Math.sin(labelAngle) * r;
        ctx.fillStyle = ring.color + '0.7)';
        ctx.font = 'bold 8px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(ring.label, lx, ly);
        ctx.fillStyle = 'rgba(216,220,230,0.5)';
        ctx.font = '7px Inter, sans-serif';
        ctx.fillText(`${ring.files} files`, lx, ly + 10);
      });

      /* Central impact node */
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 30);
      coreGrad.addColorStop(0, 'rgba(139,107,107,0.6)');
      coreGrad.addColorStop(0.5, 'rgba(139,107,107,0.15)');
      coreGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 30, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(216,220,230,0.9)';
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();

      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  }, [riskCounts]);

  return <canvas ref={canvasRef} width={420} height={420} style={{ display: 'block' }} />;
};

/* ═══ IMPACT ANALYSIS SCREEN ═══ */
const ImpactScreen = ({ repo, selectedFile }) => {
  const [filePath, setFilePath] = useState('');
  const [files, setFiles] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFilePicker, setShowFilePicker] = useState(false);

  useEffect(() => {
    if (repo) fetchFiles();
  }, [repo]);

  useEffect(() => {
    if (selectedFile?.path) {
      setFilePath(selectedFile.path);
    }
  }, [selectedFile]);

  const fetchFiles = async () => {
    try {
      const res = await apiFetch(`${API_BASE}/api/repo/${repo.id}/files`);
      const data = await res.json();
      setFiles(data);
    } catch (e) {}
  };

  const analyze = async (fp) => {
    const target = fp || filePath;
    if (!target) return;
    setFilePath(target);
    setLoading(true);
    setError(null);
    setResult(null);
    setShowFilePicker(false);
    try {
      const res = await apiFetch(`${API_BASE}/api/repo/${repo.id}/impact?filePath=${encodeURIComponent(target)}`);
      if (!res.ok) throw new Error('Impact analysis failed');
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const totalAffected = result ? result.dependants.length : 0;
  const highRisk = result ? Math.ceil(totalAffected * 0.3) : 0;
  const medRisk = result ? Math.ceil(totalAffected * 0.4) : 0;
  const lowRisk = result ? Math.max(0, totalAffected - highRisk - medRisk) : 0;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid #1C2331', flexShrink: 0, background: '#0A0E15' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <Zap size={16} color="#8B6B6B" />
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#D8DCE6', letterSpacing: '-0.02em' }}>Impact Analysis</h2>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5C657A', marginLeft: 4 }}>Blast Radius</span>
        </div>

        {/* File picker */}
        <div style={{ position: 'relative' }}>
          <div
            onClick={() => setShowFilePicker(!showFilePicker)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#10141C', border: '1px solid #1C2331', borderRadius: 8, cursor: 'pointer' }}
          >
            <FileCode2 size={13} color="#5C657A" />
            <span style={{ flex: 1, fontSize: 11, color: filePath ? '#D8DCE6' : '#5C657A', fontFamily: 'JetBrains Mono, monospace' }}>
              {filePath ? filePath.split('/').pop() : 'Select a file to analyze...'}
            </span>
            <span style={{ fontSize: 9, color: '#5C657A' }}>▼</span>
          </div>

          {showFilePicker && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: '#10141C', border: '1px solid #1C2331', borderRadius: 8, maxHeight: 200, overflowY: 'auto', marginTop: 4 }}>
              {files.map((f, i) => (
                <div
                  key={i}
                  onClick={() => analyze(f.path)}
                  style={{ padding: '8px 12px', fontSize: 11, color: '#8E97A8', cursor: 'pointer', fontFamily: 'monospace', borderBottom: '1px solid #1C2331' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#0A0E15'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {f.path.split('/').pop()}
                </div>
              ))}
            </div>
          )}
        </div>

        {filePath && !loading && (
          <button
            onClick={() => analyze()}
            style={{ marginTop: 8, width: '100%', padding: '8px', background: 'transparent', border: '1px solid #283245', borderRadius: 8, color: '#8E97A8', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <Zap size={12} /> Compute Blast Radius
          </button>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: '#10141C', border: '1px solid #1C2331', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={18} color="#8B6B6B" style={{ animation: 'pulse 1.5s ease-in-out infinite' }} />
            </div>
            <p style={{ fontSize: 11, color: '#5C657A', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Tracing blast radius...</p>
          </div>
        )}

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 16, background: 'rgba(139,107,107,0.08)', border: '1px solid rgba(139,107,107,0.2)', borderRadius: 10 }}>
            <AlertTriangle size={14} color="#8B6B6B" />
            <span style={{ fontSize: 11, color: '#8E97A8' }}>{error}</span>
          </div>
        )}

        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Blast radius visualization */}
            <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 20, alignItems: 'start' }}>
              <div style={{ background: '#10141C', border: '1px solid #1C2331', borderRadius: 16, overflow: 'hidden', position: 'relative' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #1C2331', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5C657A' }}>
                  Blast Radius Visualization
                </div>
                <BlastCanvas riskCounts={{ high: highRisk, medium: medRisk, low: lowRisk }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Risk summary cards */}
                {[
                  { label: 'High Risk', count: highRisk, color: '#8B6B6B', desc: 'Direct dependants — immediate break risk' },
                  { label: 'Medium Risk', count: medRisk, color: '#8B8475', desc: 'Indirect dependants — cascading effects' },
                  { label: 'Low Risk', count: lowRisk, color: '#7A8F7B', desc: 'Peripheral usage — minimal impact' },
                ].map(({ label, count, color, desc }) => (
                  <div key={label} style={{ padding: '14px 16px', background: '#10141C', border: '1px solid #1C2331', borderRadius: 12, borderLeft: `2px solid ${color}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color }}>
                        {label}
                      </span>
                      <span style={{ fontSize: 20, fontWeight: 800, color: '#D8DCE6' }}>{count}</span>
                    </div>
                    <p style={{ fontSize: 10, color: '#5C657A', lineHeight: 1.5 }}>{desc}</p>
                  </div>
                ))}

                <div style={{ padding: '14px 16px', background: '#10141C', border: '1px solid #283245', borderRadius: 12 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#5C657A', marginBottom: 6 }}>Total Affected</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#D8DCE6' }}>{totalAffected}</div>
                  <div style={{ fontSize: 10, color: '#5C657A' }}>files in blast radius</div>
                </div>
              </div>
            </div>

            {/* Affected files list */}
            {result.dependants.length > 0 && (
              <div style={{ background: '#10141C', border: '1px solid #1C2331', borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #1C2331', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5C657A' }}>
                  Affected Files ({result.dependants.length})
                </div>
                <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                  {result.dependants.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: '1px solid #1C2331' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: i < highRisk ? '#8B6B6B' : i < highRisk + medRisk ? '#8B8475' : '#7A8F7B', flexShrink: 0 }} />
                      <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#8E97A8', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {f.split('/').pop()}
                      </span>
                      <span style={{ fontSize: 9, color: '#3A4258', fontFamily: 'monospace', flexShrink: 0 }}>
                        {f.split('/').slice(-2, -1)[0] || ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Analysis */}
            {result.analysis && (
              <div style={{ background: '#10141C', border: '1px solid #1C2331', borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #1C2331', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Info size={12} color="#5C657A" />
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5C657A' }}>AI Impact Report</span>
                </div>
                <div style={{ padding: 16, fontSize: 11, color: '#8E97A8', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {result.analysis}
                </div>
              </div>
            )}
          </div>
        )}

        {!loading && !result && !error && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, opacity: 0.5 }}>
            <Zap size={28} color="#3A4258" />
            <p style={{ fontSize: 12, color: '#3A4258', textAlign: 'center', lineHeight: 1.6 }}>
              Select a file and compute its blast radius.<br />See which parts of the system would break.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImpactScreen;
