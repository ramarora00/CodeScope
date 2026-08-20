import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Box, ArrowRight, Folder, File } from 'lucide-react';
import { logout } from '../../../auth/authService';
import UserAvatarDropdown from './v2/shared/UserAvatarDropdown';
import CodeScopeInfo from './v2/shared/CodeScopeInfo';

// ─── Seeded PRNG (mulberry32) — deterministic across renders ──────────────────
function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Particle field — center-aware, biased toward edges ───────────────────────
const PARTICLES = (() => {
  const rand = mulberry32(7421);
  const pts = [];

  for (let i = 0; i < 900; i++) {
    const x = rand() * 100;
    const y = rand() * 100;

    const centerDistance = Math.hypot(
      (x - 50) * 1.0,
      (y - 47) * 1.05
    );

    const bottomBias = y > 58;
    const edgeBias = x < 24 || x > 76;

    // Preserve clean hero area.
    if (centerDistance < 28 && rand() > 0.045) {
      continue;
    }

    // Bias the field toward the architectural sides
    // and lower computational terrain.
    if (!bottomBias && !edgeBias && rand() > 0.22) {
      continue;
    }

    const size =
      rand() < 0.94
        ? 0.20 + rand() * 0.46
        : 0.55 + rand() * 0.75;

    const opacity =
      rand() < 0.90
        ? 0.022 + rand() * 0.068
        : 0.055 + rand() * 0.105;

    pts.push({
      x,
      y,
      size,
      opacity,
    });
  }

  return pts;
})();

// ─── Fan / silk flow lines ─────────────────────────────────────────────────────
function makeFanLines({ seed, focalXPct, focalYPct, endXPct, yRangePct, ampRange, originSpread, count, dir = 1 }) {
  const rand = mulberry32(seed);
  const W = 1000, H = 1000;
  const fx = (focalXPct / 100) * W;
  const fy = (focalYPct / 100) * H;
  const endX = (endXPct / 100) * W;
  const [y0, y1] = yRangePct.map(p => (p / 100) * H);
  const lines = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const startY = fy + (t - 0.5) * originSpread;
    const endY = y0 + t * (y1 - y0);
    const amp = ampRange[0] + t * (ampRange[1] - ampRange[0]);
    const nPts = 30;
    let d = '';
    for (let k = 0; k <= nPts; k++) {
      const u = k / nPts;
      const x = fx + (endX - fx) * u;
      const baseY = startY + (endY - startY) * Math.pow(u, 1.18);
      const wobble = Math.sin(u * Math.PI * (1.15 + t * 0.75) + t * 3.2) * amp * Math.pow(u, 0.72) * dir;
      const y = baseY + wobble;
      d += k === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)} ` : `L ${x.toFixed(1)} ${y.toFixed(1)} `;
    }
    const centerBias = 1 - Math.abs(t - 0.5) * 1.2;
    const opacity = Math.max(0.065, 0.32 * centerBias);
    lines.push({ d, opacity });
    void rand();
  }
  return lines;
}

const RIGHT_FAN_1 = makeFanLines({ seed: 11, focalXPct: 66, focalYPct: 40, endXPct: 106, yRangePct: [31, 62], ampRange: [24, 76], originSpread: 54, count: 38, dir: 1 });
const RIGHT_FAN_2 = makeFanLines({ seed: 22, focalXPct: 67, focalYPct: 42, endXPct: 106, yRangePct: [43, 82], ampRange: [20, 64], originSpread: 48, count: 34, dir: 1 });
const RIGHT_FAN_3 = makeFanLines({ seed: 33, focalXPct: 68, focalYPct: 45, endXPct: 106, yRangePct: [58, 106], ampRange: [28, 88], originSpread: 64, count: 40, dir: 1 });

const LEFT_FAN = makeFanLines({ seed: 44, focalXPct: 16, focalYPct: 63, endXPct: -8, yRangePct: [48, 94], ampRange: [12, 42], originSpread: 38, count: 22, dir: -1 });

// ─── 3D Perspective Grid (Topographic mesh) ──────────────────────────────────
function makePerspectiveGrid(seed, cols, rows, cfg, opacityFn) {
  const r = mulberry32(seed);
  const nodes = [];
  const edges = [];
  for (let z = 0; z < rows; z++) {
    for (let x = 0; x < cols; x++) {
      const nx = (x / (cols - 1)) * 2 - 1; // -1 to 1
      const nz = z / (rows - 1); // 0 to 1
      
      let h = Math.sin(nx * cfg.wave1[0] + nz * cfg.wave1[1]) * cfg.wave1[2] + 
              Math.cos(nx * cfg.wave2[0] + nz * cfg.wave2[1]) * cfg.wave2[2];
      h += (r() - 0.5) * 0.12;
      
      const p = cfg.perspective / (cfg.perspective + nz * cfg.depth);
      const sx = cfg.cx + nx * cfg.width * p;
      const sy = cfg.cy + (nz * cfg.height - h * cfg.amplitude) * p;
      
      const edgeFade = 1 - Math.pow(Math.abs(nx), 2.8);
      const depthFade = Math.pow(1 - nz, 1.2);
      const customFade = opacityFn ? opacityFn(nx, nz) : 1;
      const o = 0.005 + cfg.maxOpacity * edgeFade * depthFade * customFade * (0.4 + r() * 0.6);
      
      nodes.push({ x: sx, y: sy, o, r: 0.2 + 1.2 * p });
    }
  }
  for (let z = 0; z < rows; z++) {
    for (let x = 0; x < cols; x++) {
      const i = z * cols + x;
      if (x < cols - 1) edges.push([i, i + 1]);
      if (z < rows - 1) edges.push([i, i + cols]);
    }
  }
  return { nodes, edges };
}

const GRID_LEFT = makePerspectiveGrid(
  918273,
  46,
  31,
  {
    cx: 0.15,
    cy: 0.84,
    width: 0.56,
    height: 0.44,
    depth: 1.20,
    perspective: 0.92,
    amplitude: 0.24,
    maxOpacity: 0.22,
    wave1: [3.2, 4.8, 0.72],
    wave2: [6.4, -3.2, 0.46],
  },
  (nx, nz) => {
    const horizontalFade = 0.18 + 0.82 * (1 - Math.pow(Math.abs(nx), 2.8));
    const depthFade = 0.45 + 0.55 * Math.pow(1 - nz, 0.85);
    return horizontalFade * depthFade;
  }
);

const GRID_CENTER = makePerspectiveGrid(
  552211,
  64,
  30,
  {
    cx: 0.50,
    cy: 0.83,
    width: 1.00,
    height: 0.42,
    depth: 1.22,
    perspective: 0.92,
    amplitude: 0.20,
    maxOpacity: 0.105,
    wave1: [3.0, 4.4, 0.68],
    wave2: [6.2, -3.0, 0.42],
  },
  (nx, nz) => {
    const horizontalFade =
      0.20 + 0.80 * (1 - Math.pow(Math.abs(nx), 2.2));

    const depthFade =
      0.42 + 0.58 * Math.pow(1 - nz, 0.88);

    return horizontalFade * depthFade;
  }
);

const GRID_RIGHT = makePerspectiveGrid(
  381927,
  50,
  32,
  {
    cx: 0.85,
    cy: 0.84,
    width: 0.56,
    height: 0.44,
    depth: 1.18,
    perspective: 0.92,
    amplitude: 0.24,
    maxOpacity: 0.23,
    wave1: [3.0, 4.6, 0.76],
    wave2: [6.6, -3.2, 0.48],
  },
  (nx, nz) => {
    const horizontalFade = 0.18 + 0.82 * (1 - Math.pow(Math.abs(nx), 2.7));
    const depthFade = 0.44 + 0.56 * Math.pow(1 - nz, 0.85);
    return horizontalFade * depthFade;
  }
);

// Single large mesh across the entire bottom (matches roadmap "particle floor")
// (Removed, using GRID_BL and GRID_BR)

function makeTerrainParticles(seed, count, region) {
  const rand = mulberry32(seed);
  const points = [];

  for (let i = 0; i < count; i++) {
    const x = region.x0 + rand() * (region.x1 - region.x0);
    const y = region.y0 + rand() * (region.y1 - region.y0);

    const centerX = (region.x0 + region.x1) / 2;
    const normalizedX = (x - centerX) / ((region.x1 - region.x0) / 2);
    const wave = Math.sin(normalizedX * Math.PI * 1.8 + region.phase);
    const surface = region.surface + wave * region.wave;

    const distance = Math.abs(y - surface);
    const spread = region.spread;
    const probability = Math.max(0, 1 - distance / spread);

    if (rand() > probability * 0.78) {
      continue;
    }

    const size =
      rand() < 0.94
        ? 0.28 + rand() * 0.68
        : 0.82 + rand() * 1.25;

    const opacity =
      rand() < 0.88
        ? 0.050 + rand() * 0.105
        : 0.12 + rand() * 0.17;

    points.push({ x, y, size, opacity });
  }

  return points;
}

const TERRAIN_LEFT_POINTS = makeTerrainParticles(712341, 3400, {
  x0: -0.05,
  x1: 0.40,
  y0: 0.48,
  y1: 1.02,
  surface: 0.72,
  wave: 0.11,
  spread: 0.16,
  phase: 0.2,
});

const TERRAIN_RIGHT_POINTS = makeTerrainParticles(981234, 3600, {
  x0: 0.60,
  x1: 1.05,
  y0: 0.48,
  y1: 1.02,
  surface: 0.75,
  wave: 0.12,
  spread: 0.17,
  phase: 2.7,
});

function TerrainParticleField({ points, opacity = 1 }) {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
      {points.map((p, i) => (
        <circle key={i} cx={`${p.x * 100}%`} cy={`${p.y * 100}%`} r={p.size} fill="rgba(215,225,235,1)" opacity={p.opacity * opacity} />
      ))}
    </svg>
  );
}

function GridCanvas({ grid, className = "" }) {
  const ref = React.useRef(null);

  React.useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    function draw() {
      const dpr = window.devicePixelRatio || 1;

      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;

      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      ctx.lineWidth = 0.34 * dpr;
      ctx.lineCap = "round";

      for (const [i, j] of grid.edges) {
        const a = grid.nodes[i];
        const b = grid.nodes[j];

        if (a.o <= 0.004 || b.o <= 0.004) {
          continue;
        }

        const edgeOpacity = Math.min(a.o, b.o) * 0.88;

        if (edgeOpacity < 0.003) {
          continue;
        }

        ctx.beginPath();

        ctx.strokeStyle =
          `rgba(190,205,220,${Math.min(edgeOpacity, 0.12)})`;

        ctx.moveTo(a.x * w, a.y * h);
        ctx.lineTo(b.x * w, b.y * h);

        ctx.stroke();
      }

      for (const p of grid.nodes) {
        if (p.o <= 0.004) {
          continue;
        }

        const nodeOpacity =
          Math.min(0.018 + p.o * 1.95, 0.31);

        const radius =
          Math.max(0.42, 0.35 + p.r * 0.68) * dpr;

        ctx.beginPath();

        ctx.arc(
          p.x * w,
          p.y * h,
          radius,
          0,
          Math.PI * 2
        );

        ctx.fillStyle =
          `rgba(205,220,232,${nodeOpacity})`;

        ctx.fill();
      }
    }

    draw();

    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(draw);
    });

    resizeObserver.observe(canvas);

    return () => {
      resizeObserver.disconnect();
    };
  }, [grid]);

  return (
    <canvas ref={ref} className={`absolute inset-0 w-full h-full ${className}`} />
  );
}

// ─── 3D Wireframe Cube Network (Top-Left) ─────────────────────────────────────
function IsoCubes() {
  return (
    <div className="codescope-bg-panel-wrapper" style={{ position: 'absolute', top: '18.5%', left: '3.8%', pointerEvents: 'none', opacity: 0.82 }}>
      <svg
        className="hidden lg:block codescope-bg-architecture codescope-bg-panel"
        style={{
          position: 'relative',
          width: 'clamp(180px, 11vw, 220px)',
          height: 'clamp(180px, 11vw, 220px)',
          opacity: 0.74,
          filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.025))',
          transition: 'transform 300ms ease',
        }}
        viewBox="0 0 205 205"
      >
        <path d="M50 82 L50 280" stroke="rgba(200,215,230,0.40)" strokeWidth="1.5" strokeDasharray="4 4" fill="none" />
        <path d="M150 82 L150 280" stroke="rgba(200,215,230,0.32)" strokeWidth="1.5" strokeDasharray="4 4" fill="none" />
        <path d="M250 82 L250 280" stroke="rgba(200,215,230,0.25)" strokeWidth="1.5" strokeDasharray="4 4" fill="none" />

        {/* Connectors to Source Tree */}
        <path d="M100 130 L10 240" stroke="rgba(190,210,230,0.35)" strokeWidth="1" fill="none" />
        <path d="M200 130 L110 240" stroke="rgba(190,210,230,0.28)" strokeWidth="1" fill="none" />
        <path d="M300 130 L210 240" stroke="rgba(190,210,230,0.22)" strokeWidth="1" fill="none" />
        <g
          fill="none"
          stroke="rgba(180,195,210,0.46)"
          strokeWidth="0.62"
          strokeLinejoin="round"
        >
          {/* main architectural cube */}
          <path d="M67 39 L101 20 L135 39 L101 58 Z" />
          <path d="M67 39 L67 82 L101 101 L101 58" />
          <path d="M135 39 L135 82 L101 101" />

          {/* left cube */}
          <path d="M20 67 L54 48 L88 67 L54 86 Z" />
          <path d="M20 67 L20 110 L54 129 L54 86" />
          <path d="M88 67 L88 110 L54 129" />

          {/* lower center */}
          <path d="M67 101 L101 82 L135 101 L101 120 Z" />
          <path d="M67 101 L67 144 L101 163 L101 120" />
          <path d="M135 101 L135 144 L101 163" />

          {/* connecting architecture */}
          <line x1="54" y1="86" x2="67" y2="101" strokeDasharray="2 3" />
          <line x1="135" y1="82" x2="154" y2="92" strokeDasharray="2 3" />
          <line x1="101" y1="163" x2="101" y2="188" strokeDasharray="2 3" />
          <line x1="20" y1="110" x2="4" y2="120" strokeDasharray="2 3" />
        </g>

        {/* tiny architectural nodes */}
        <g fill="rgba(220,230,238,0.68)">
          <circle cx="67" cy="39" r="1.25" />
          <circle cx="101" cy="20" r="1.25" />
          <circle cx="135" cy="39" r="1.25" />
          <circle cx="101" cy="58" r="1.25" />

          <circle cx="67" cy="82" r="1.25" />
          <circle cx="101" cy="101" r="1.25" />
          <circle cx="135" cy="82" r="1.25" />

          <circle cx="20" cy="67" r="1.25" />
          <circle cx="54" cy="48" r="1.25" />
          <circle cx="88" cy="67" r="1.25" />
          <circle cx="54" cy="86" r="1.25" />

          <circle cx="20" cy="110" r="1.25" />
          <circle cx="54" cy="129" r="1.25" />

          <circle cx="67" cy="101" r="1.25" />
          <circle cx="135" cy="101" r="1.25" />
          <circle cx="101" cy="120" r="1.25" />

          <circle cx="67" cy="144" r="1.25" />
          <circle cx="101" cy="163" r="1.25" />
          <circle cx="135" cy="144" r="1.25" />
        </g>
      </svg>
    </div>
  );
}

// ─── Corner labels ────────────────────────────────────────────────────────────
function CornerLabel({ title, detail, className = '' }) {
  return (
    <div className={`font-mono text-[9px] tracking-[0.25em] uppercase select-none ${className}`}>
      <div className="flex items-center gap-1.5" style={{ color: 'rgba(220,225,230,0.28)' }}>
        <span className="w-[3px] h-[3px] border border-white/20 inline-block" />
        {title}
      </div>
      <div className="mt-0.5 normal-case tracking-normal text-left" style={{ color: 'rgba(210,220,230,0.18)', fontSize: '8px', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span>•</span> <span>{detail}</span>
      </div>
    </div>
  );
}

// ─── Glass Panel (Translucent UI matching roadmap) ────────────────────────────
function GlassPanel({ className = '', style = {}, children }) {
  return (
    <div
      className={`absolute rounded-[6px] font-mono leading-relaxed ${className}`}
      style={{
        border: '1px solid rgba(190,205,220,0.08)',
        background: 'rgba(4,6,8,0.52)',
        backdropFilter: 'blur(14px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.30)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── LEFT: Src tree card ──────────────────────────────────────────────────────
function FileTreeCard() {
  return (
    <div className="codescope-bg-panel-wrapper" style={{ position: 'absolute', top: '20%', left: '15.4%', opacity: 0.84 }}>
      <GlassPanel
        className="hidden lg:block codescope-bg-architecture codescope-bg-panel"
        style={{
          position: 'relative',
          width: 'clamp(160px, 10vw, 190px)',
          minHeight: '175px',
          padding: '12px 14px',
          background: 'rgba(2,3,4,0.85)',
          transform:
            'perspective(800px) rotateY(-35deg) rotateX(12deg)',
          animation:
            'cs-tilt-r 44s ease-in-out infinite',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: 'rgba(255,255,255,0.80)', letterSpacing: '0.02em' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
            <Folder size={12} strokeWidth={1.5} style={{ color: 'rgba(255,255,255,0.72)' }} />
            <div style={{ color: 'rgba(255,255,255,0.80)' }}>src</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', paddingLeft: '18px' }}>
            {['components', 'services', 'hooks', 'utils', 'types'].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(255,255,255,0.22)' }} />
                <div style={{ color: 'rgba(255,255,255,0.38)' }}>{item}</div>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: '20%',
            width: '1px',
            height: '80px',
            background:
              'linear-gradient(to bottom, rgba(255,255,255,0.14), transparent)',
          }}
        />
      </GlassPanel>
    </div>
  );
}

// ─── LEFT: File-stat cards ────────────────────────────────────────────────────
function FileStatCards() {
  const cards = [
    {
      name: 'auth.service.ts',
      loc: '1.2k LOC',
      deps: '14 dependencies',
      top: '39%',
      left: '6.1%',
      width: '126px',
      ry: -30,
      rx: 5,
    },
    {
      name: 'api.routes.ts',
      loc: '850 LOC',
      deps: '11 dependencies',
      top: '42.5%',
      left: '18.8%',
      width: '126px',
      ry: -38,
      rx: 8,
    },
    {
      name: 'user.model.ts',
      loc: '320 LOC',
      deps: '8 dependencies',
      top: '54%',
      left: '11.5%',
      width: '126px',
      ry: -32,
      rx: 4,
    },
  ];

  return (
    <>
      {cards.map((card, index) => (
        <div
          key={card.name}
          className="codescope-bg-panel-wrapper"
          style={{
            position: 'absolute',
            top: card.top,
            left: card.left,
            opacity: 0.78,
          }}
        >
          <GlassPanel
            className="hidden lg:block codescope-bg-architecture codescope-bg-panel"
            style={{
              position: 'relative',
              width: '145px',
              minHeight: '76px',
              padding: '14px 16px',
              transform:
                `perspective(800px) rotateY(${card.ry}deg) rotateX(${card.rx}deg)`,
              animation:
                `cs-tilt-r ${42 + index * 5}s ease-in-out infinite`,
            }}
          >
            <div
              style={{
                fontSize: '9.5px',
                color: 'rgba(255,255,255,0.68)',
                marginBottom: '6px',
              }}
            >
              {card.name}
            </div>

            <div
              style={{
                fontSize: '8px',
                color: 'rgba(255,255,255,0.38)',
              }}
            >
              {card.loc}
            </div>

            <div
              style={{
                fontSize: '8px',
                color: 'rgba(255,255,255,0.38)',
                marginTop: '3px',
              }}
            >
              {card.deps}
            </div>

            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: '20%',
                width: '1px',
                height: '70px',
                background:
                  'linear-gradient(to bottom, rgba(255,255,255,0.12), transparent)',
              }}
            />
          </GlassPanel>
        </div>
      ))}
    </>
  );
}

// ─── RIGHT: Ghosted code surface ─────────────────────────────────────────────
function CodePanel() {
  const lineNumCol = 'rgba(150, 165, 180, 0.15)';
  const kwCol = 'rgba(150, 185, 205, 0.62)';
  const strCol = 'rgba(170, 185, 195, 0.48)';
  const funcCol = 'rgba(220, 225, 230, 0.55)';
  const normCol = 'rgba(190, 200, 210, 0.38)';
  const puncCol = 'rgba(165, 180, 195, 0.28)';

  const lines = [
    { num: 10, content: <><span style={{color:kwCol}}>import</span> <span style={{color:puncCol}}>{"{"}</span> <span style={{color:normCol}}>GraphBuilder</span> <span style={{color:puncCol}}>{"}"}</span> <span style={{color:kwCol}}>from</span> <span style={{color:strCol}}>'@codescope/graph'</span></> },
    { num: 11, content: <><span style={{color:kwCol}}>import</span> <span style={{color:puncCol}}>{"{"}</span> <span style={{color:normCol}}>analyze</span> <span style={{color:puncCol}}>{"}"}</span> <span style={{color:kwCol}}>from</span> <span style={{color:strCol}}>'@codescope/analyzer'</span></> },
    { num: 12, content: <><span style={{color:kwCol}}>import</span> <span style={{color:puncCol}}>{"{"}</span> <span style={{color:normCol}}>cache</span> <span style={{color:puncCol}}>{"}"}</span> <span style={{color:kwCol}}>from</span> <span style={{color:strCol}}>'@codescope/cache'</span></> },
    { num: 12, content: '' },
    { num: 13, content: <><span style={{color:kwCol}}>export async function</span> <span style={{color:funcCol}}>buildGraph</span><span style={{color:puncCol}}>(</span><span style={{color:normCol}}>repo</span><span style={{color:puncCol}}>:</span> <span style={{color:normCol}}>string</span><span style={{color:puncCol}}>) {"{"}</span></> },
    { num: 16, content: <><span style={{color:kwCol}}>  const</span> <span style={{color:normCol}}>graph</span> <span style={{color:puncCol}}>=</span> <span style={{color:kwCol}}>new</span> <span style={{color:normCol}}>GraphBuilder</span><span style={{color:puncCol}}>()</span></> },
    { num: 15, content: <><span style={{color:kwCol}}>  const</span> <span style={{color:puncCol}}>{"{"}</span> <span style={{color:normCol}}>files</span><span style={{color:puncCol}}>,</span> <span style={{color:normCol}}>deps</span> <span style={{color:puncCol}}>{"}"} =</span> <span style={{color:kwCol}}>await</span> <span style={{color:funcCol}}>analyze</span><span style={{color:puncCol}}>(</span><span style={{color:normCol}}>repo</span><span style={{color:puncCol}}>)</span></> },
    { num: 36, content: '' },
    { num: 13, content: <><span style={{color:normCol}}>  graph</span><span style={{color:puncCol}}>.</span><span style={{color:funcCol}}>addFiles</span><span style={{color:puncCol}}>(</span><span style={{color:normCol}}>files</span><span style={{color:puncCol}}>)</span></> },
    { num: 15, content: <><span style={{color:normCol}}>  graph</span><span style={{color:puncCol}}>.</span><span style={{color:funcCol}}>addDependencies</span><span style={{color:puncCol}}>(</span><span style={{color:normCol}}>deps</span><span style={{color:puncCol}}>)</span></> },
    { num: 29, content: '' },
    { num: 20, content: <><span style={{color:kwCol}}>  return</span> <span style={{color:normCol}}>graph</span><span style={{color:puncCol}}>.</span><span style={{color:funcCol}}>build</span><span style={{color:puncCol}}>()</span></> },
    { num: 20, content: <><span style={{color:puncCol}}>{"}"}</span></> }
  ];

  return (
    <div className="codescope-bg-panel-wrapper" style={{ position: 'absolute', top: '17.2%', right: '5.6%', opacity: 0.78 }}>
      <GlassPanel
        className="hidden xl:block codescope-bg-panel"
        style={{
          position: 'relative',
          width: 'clamp(340px, 24vw, 420px)',
          minHeight: '255px',
          padding: '15px 18px',
          opacity: 0.68,
          transform:
            'perspective(800px) rotateY(35deg) rotateX(10deg) rotateZ(-2deg)',
          animation:
            'cs-tilt-l 48s ease-in-out infinite',
        }}
      >
        <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace', fontSize: '8.5px', lineHeight: '12.5px' }}>
          {lines.map((line, i) => (
            <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: '4px' }}>
              <span style={{ color: lineNumCol, width: '16px', textAlign: 'right', flexShrink: 0 }}>{line.content === '' ? '' : line.num}</span>
              <span style={{ whiteSpace: 'pre' }}>{line.content}</span>
            </div>
          ))}
        </div>
      </GlassPanel>
    </div>
  );
}

// ─── RIGHT: INSIGHTS HUD projection ──────────────────────────────────────────
function InsightsPanel() {
  return (
    <div className="codescope-bg-panel-wrapper" style={{ position: 'absolute', top: '56%', right: '4.2%', opacity: 0.82 }}>
      <GlassPanel
        className="hidden lg:block font-mono codescope-bg-panel"
        style={{
          position: 'relative',
          width: 'clamp(300px, 20vw, 350px)',
          padding: '14px 16px',
          background: 'rgba(7,9,12,0.50)',
          border:
            '1px solid rgba(190,205,220,0.115)',
          transform:
            'perspective(800px) rotateY(32deg) rotateX(-5deg)',
          animation:
            'cs-tilt-l-s 52s ease-in-out infinite',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', color: 'rgba(255,255,255,0.60)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          <span className="w-[3px] h-[3px] border border-white/40 inline-block" />
          Insights
        </div>
        <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.44)', marginBottom: '10px' }}>
          • Real-time codebase understanding
        </div>
        {[
          '27% of modules are interdependent',
          '8 potential architectural risks',
          '14 improvement opportunities',
        ].map(l => (
          <div key={l} style={{ fontSize: '8.5px', color: 'rgba(255,255,255,0.34)', marginBottom: '6px' }}>• {l}</div>
        ))}
      </GlassPanel>
    </div>
  );
}

// ─── PRIMARY BACKDROP ─────────────────────────────────────────────────────────
function Backdrop() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        background: '#010102',
      }}
    >

      {/* CENTRAL ATMOSPHERE */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 42% 38% at 50% 43%, rgba(255,255,255,0.018), rgba(255,255,255,0.006) 35%, transparent 72%)',
        }}
      />

      {/* 2. SUBTLE SIDE ATMOSPHERE */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: `
            radial-gradient(
              ellipse 30% 28% at 76% 46%,
              rgba(155,180,205,0.018),
              transparent 72%
            ),
            radial-gradient(
              ellipse 24% 30% at 18% 70%,
              rgba(145,165,185,0.012),
              transparent 72%
            )
          `,
        }}
      />

      {/* PARTICLES */}
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
        }}
        preserveAspectRatio="none"
      >
        {PARTICLES.map((p, i) => (
          <circle
            key={i}
            cx={`${p.x}%`}
            cy={`${p.y}%`}
            r={p.size}
            fill="rgba(220,225,230,1)"
            opacity={p.opacity * 0.45}
          />
        ))}
      </svg>

      {/* COMPUTATIONAL PARTICLE FIELDS */}
      <div
        className="codescope-bg-terrain-particles absolute pointer-events-none"
        style={{
          left: 0, right: 0, bottom: '-8%', height: '43%',
          opacity: 0.86,
          mixBlendMode: 'screen',
        }}
      >
        <TerrainParticleField points={TERRAIN_LEFT_POINTS} opacity={1} />
        <TerrainParticleField points={TERRAIN_RIGHT_POINTS} opacity={1} />
      </div>

      {/* COMPUTATIONAL TERRAIN */}
      <div
        className="codescope-bg-terrain absolute"
        style={{
          left: 0, right: 0, bottom: '-8%', height: '43%',
          transition: 'transform 300ms ease',
        }}
      >
        <GridCanvas grid={GRID_LEFT} />
        <GridCanvas grid={GRID_RIGHT} />
      </div>

      {/* DEPENDENCY SILK FLOW */}
      <svg
        className="codescope-bg-fan"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          transition: 'transform 300ms ease',
        }}
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
      >

        {RIGHT_FAN_1.map((line, i) => (
          <path
            key={`r1-${i}`}
            d={line.d}
            stroke="rgba(185,200,215,1)"
            strokeOpacity={line.opacity * 0.64}
            strokeWidth="0.55"
            fill="none"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {RIGHT_FAN_2.map((line, i) => (
          <path
            key={`r2-${i}`}
            d={line.d}
            stroke="rgba(170,190,210,1)"
            strokeOpacity={line.opacity * 0.50}
            strokeWidth="0.48"
            fill="none"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {RIGHT_FAN_3.map((line, i) => (
          <path
            key={`r3-${i}`}
            d={line.d}
            stroke="rgba(155,180,205,1)"
            strokeOpacity={line.opacity * 0.39}
            strokeWidth="0.44"
            fill="none"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {LEFT_FAN.map((line, i) => (
          <path
            key={`left-${i}`}
            d={line.d}
            stroke="rgba(180,200,220,1)"
            strokeOpacity={line.opacity * 0.95}
            strokeWidth="0.65"
            fill="none"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>

      {/* ARCHITECTURAL NETWORK */}
      <IsoCubes />

      {/* FLOATING BACKGROUND SURFACES */}
      <FileTreeCard />
      <FileStatCards />
      <CodePanel />
      <InsightsPanel />

      {/* HUD */}
      <CornerLabel
        title="Architecture"
        detail="512 modules"
        className="hidden lg:block absolute top-[16.5%] left-[5%]"
      />

      <CornerLabel
        title="Structure"
        detail="Mapping codebase"
        className="hidden lg:block absolute bottom-[12%] left-[5%]"
      />

      <CornerLabel
        title="Dependencies"
        detail="1,248 connections"
        className="hidden lg:block absolute top-[15%] right-[5.8%] text-right"
      />

      <CornerLabel
        title="Relationships"
        detail="Discovering links"
        className="hidden lg:block absolute bottom-[12%] right-[5.8%] text-right"
      />

      {/* VIGNETTE */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(ellipse 88% 84% at 50% 46%, transparent 60%, rgba(0,0,0,0.20) 84%, rgba(0,0,0,0.42) 100%)',
        }}
      />

      {/* FILM GRAIN */}
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: 0.010,
          pointerEvents: 'none',
        }}
      >
        <filter id="csgrain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.82"
            numOctaves="2"
            stitchTiles="stitch"
          />

          <feColorMatrix
            type="saturate"
            values="0"
          />
        </filter>

        <rect
          width="100%"
          height="100%"
          filter="url(#csgrain)"
        />
      </svg>
      <style>{`
        @keyframes cs-tilt-r {
          0%,100% { transform: perspective(1200px) rotateY(-18deg) rotateX(8deg); }
          50%      { transform: perspective(1200px) rotateY(-14deg) rotateX(5deg); }
        }
        @keyframes cs-tilt-l {
          0%,100% { transform: perspective(1400px) rotateY(16deg) rotateX(6deg) rotateZ(-2deg); }
          50%      { transform: perspective(1400px) rotateY(12deg) rotateX(3deg) rotateZ(-1deg); }
        }
        @keyframes cs-tilt-l-s {
          0%,100% { transform: perspective(1400px) rotateY(12deg) rotateX(-2deg); }
          50%      { transform: perspective(1400px) rotateY(8deg) rotateX(-1deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; }
        }
        .codescope-content {
          position: absolute;
          top: clamp(115px, 13vh, 155px);
          left: 50%;
          transform: translateX(-50%);
          width: min(780px, calc(100vw - 48px));
          padding: 0 20px 60px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          transition: transform 300ms ease, top 300ms ease, width 300ms ease;
        }
        @media (max-height: 900px) {
          .codescope-content {
            top: clamp(115px, 13vh, 155px);
            transform: translateY(8px) translateX(-50%) scale(0.92);
            transform-origin: top center;
          }
        }
        @media (max-height: 760px) {
          .codescope-content {
            top: clamp(50px, 7vh, 80px);
            transform: translateX(-50%) scale(0.85);
            transform-origin: top center;
          }
        }
        @media (max-width: 700px) {
          .codescope-content {
            width: calc(100vw - 32px);
          }
        }
        .codescope-bg-panel-wrapper {
          --panel-scale: 1;
          transform: scale(var(--panel-scale));
          transition: transform 300ms ease, opacity 300ms ease;
          transform-origin: center center;
        }
        @media (max-height: 900px) {
          .codescope-bg-panel-wrapper {
            --panel-scale: 0.88;
          }
        }
        @media (max-height: 780px) {
          .codescope-bg-panel-wrapper {
            --panel-scale: 0.78;
          }
        }
        @media (max-height: 640px) {
          .codescope-bg-panel-wrapper {
            display: none !important;
          }
        }
        @media (max-width: 1440px) {
          .codescope-bg-panel-wrapper {
            --panel-scale: 0.82;
          }
        }
        @media (max-width: 1200px) {
          .codescope-bg-panel-wrapper {
            --panel-scale: 0.7;
          }
        }
        input::placeholder {
          color: rgba(255, 255, 255, 0.38) !important;
        }
        
        /* Background Responsive queries */
        @media (max-width: 1280px) {
          .codescope-bg-architecture {
            /* no global scale */
          }
        }
        @media (max-width: 1200px) {
          .codescope-bg-terrain,
          .codescope-bg-terrain-particles,
          .codescope-bg-fan {
            transform: none;
          }
        }
        @media (max-height: 900px) {
          .codescope-bg-terrain,
          .codescope-bg-terrain-particles,
          .codescope-bg-fan {
            transform: none;
          }
        }
        @media (max-height: 760px) {
          .codescope-bg-terrain,
          .codescope-bg-terrain-particles,
          .codescope-bg-fan {
            transform: none;
          }
        }
        @media (max-width: 700px) {
          .codescope-bg-architecture,
          .codescope-bg-fan,
          .codescope-bg-terrain-particles {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

// ─── CubeIcon ─────────────────────────────────────────────────────────────────
function CubeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <polygon points="8,2 14,5 8,8 2,5" stroke="currentColor" strokeWidth="1" fill="none" strokeLinejoin="round" />
      <polygon points="2,5 8,8 8,14 2,11" stroke="currentColor" strokeWidth="1" fill="none" strokeLinejoin="round" />
      <polygon points="14,5 8,8 8,14 14,11" stroke="currentColor" strokeWidth="1" fill="none" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Main Launch Experience ────────────────────────────────────────────────────
export default function LaunchExperience({ onConnect, repos = [], isConnectingProp = false }) {
  const [repoUrl, setRepoUrl] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [localConnecting, setLocalConnecting] = useState(false);

  const isConnecting = localConnecting || isConnectingProp;

  const triggerConnect = (targetUrl) => {
    setLocalConnecting(true);
    setTimeout(() => {
      onConnect(targetUrl);
      setLocalConnecting(false);
    }, 600);
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (repoUrl.trim()) triggerConnect(repoUrl.trim());
  };

  return (
    <main
      className="codescope-scene"
      style={{
        position: 'relative', minHeight: '100vh', width: '100%',
        overflow: 'hidden', background: '#010102', /* Even darker near-black background */
        color: 'white', userSelect: 'none',
        fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
      }}
    >
      {/* ── Background ── */}
      <motion.div
        animate={{ opacity: isConnecting ? 0 : 1 }}
        transition={{ duration: 0.5 }}
        style={{ position: 'absolute', inset: 0 }}
      >
        <Backdrop />
      </motion.div>

      {/* ── Foreground — true viewport center ── */}
      <motion.div
        animate={{ opacity: isConnecting ? 0 : 1, y: isConnecting ? -14 : 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'absolute', inset: 0, zIndex: 30,
          display: 'block',
          overflowY: 'auto',
          maxHeight: '100vh',
        }}
      >
        {/* Top-Right Navigation */}
        <div style={{ position: 'absolute', top: '24px', right: '32px', zIndex: 40, display: 'flex', alignItems: 'center', gap: '16px' }}>
          <CodeScopeInfo page="repository" />
          <UserAvatarDropdown />
        </div>

        {/* Content column */}
        <section className="codescope-content">

          {/* Sparkle */}
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 0.78, scale: 1 }}
            transition={{ delay: 0.05, duration: 0.5 }}
            style={{ marginBottom: '22px', filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.18))' }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20">
              <path d="M10 1 L12 8 L19 10 L12 12 L10 19 L8 12 L1 10 L8 8 Z" fill="white" />
            </svg>
          </motion.div>

          {/* CodeScope wordmark */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.10, duration: 0.55 }}
            className="codescope-hero-title"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              fontSize: 'clamp(62px, 4.0vw, 74px)',
              letterSpacing: '-0.055em',
              lineHeight: 0.95,
              color: '#ffffff',
              marginBottom: '20px',
            }}
          >
            CodeScope
          </motion.h1>

          {/* CODEBASE INTELLIGENCE ENGINE */}
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.5 }}
            style={{
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              fontSize: '10px',
              letterSpacing: '0.35em',
              color: 'rgba(255,255,255,0.4)',
              textTransform: 'uppercase',
              marginBottom: '24px',
            }}
          >
            Codebase Intelligence Engine
          </motion.p>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            style={{
              fontSize: '18px',
              fontWeight: 400,
              color: 'rgba(245,245,245,0.72)',
              marginBottom: '0px',
              letterSpacing: '0.01em',
            }}
          >
            Understand any repository instantly
          </motion.p>

          {/* ── Repository Input ── */}
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            style={{ width: '100%', maxWidth: '720px', marginTop: '46px' }}
          >
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '72px',
                background: 'rgba(4,5,6,0.78)',
                backdropFilter: 'blur(32px)',
                borderRadius: '20px',
                border: `1px solid ${isFocused ? 'rgba(255,255,255,0.82)' : 'rgba(255,255,255,0.22)'}`,
                boxShadow: isFocused
                  ? '0 0 32px rgba(255,255,255,0.06), 0 0 12px rgba(255,255,255,0.04), inset 0 0 22px rgba(255,255,255,0.018)'
                  : '0 0 20px rgba(255,255,255,0.02), inset 0 0 18px rgba(255,255,255,0.012)',
                display: 'flex',
                alignItems: 'center',
                transition: 'border-color 300ms ease, box-shadow 400ms ease',
              }}
            >
              {/* ◉ circle indicator */}
              <div style={{
                position: 'absolute',
                left: '24px',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                border: '1px solid rgba(225,230,235,0.58)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'rgba(240,245,250,0.82)' }} />
              </div>

              <input
                autoFocus
                type="text"
                value={repoUrl}
                onChange={e => setRepoUrl(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                disabled={isConnecting}
                placeholder="Paste GitHub URL or local path..."
                style={{
                  width: '100%', height: '100%',
                  paddingLeft: '62px', paddingRight: '64px',
                  background: 'transparent', border: 'none', outline: 'none',
                  fontSize: '16px', color: '#f5f5f5',
                  fontFamily: "'Inter', sans-serif",
                  letterSpacing: '0.01em',
                }}
              />

              {/* ↵ enter key */}
              <AnimatePresence>
                {repoUrl.trim() && !isConnecting ? (
                  <motion.button
                    key="submit"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                    type="submit"
                    style={{
                      position: 'absolute', right: '16px',
                      width: '36px', height: '36px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.18)',
                      background: 'rgba(255,255,255,0.055)',
                      color: 'rgba(255,255,255,0.9)',
                      fontSize: '16px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                    }}
                  >
                    ↵
                  </motion.button>
                ) : (
                  <motion.div
                    key="hint"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      position: 'absolute', right: '16px',
                      width: '36px', height: '36px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'rgba(255,255,255,0.2)',
                      fontSize: '16px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    ↵
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Analysis status */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: isConnecting ? 0 : 1 }}
              transition={{ delay: 0.42, duration: 0.5 }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '10px', marginTop: '28px',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '10px', letterSpacing: '0.25em',
                color: 'rgba(225,230,235,0.39)', textTransform: 'uppercase',
              }}
            >
              <span style={{ position: 'relative', display: 'flex', width: '6px', height: '6px' }}>
                <span style={{
                  position: 'absolute', inset: 0,
                  borderRadius: '50%', background: '#22c55e', opacity: 0.7,
                  animation: 'ping 2s cubic-bezier(0,0,0.2,1) infinite',
                }} />
                <span style={{ position: 'relative', width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} />
              </span>
              Analysis Engine&nbsp;·&nbsp;Ready
            </motion.div>
          </motion.form>

          {/* ── Recent Repositories ── */}
          <AnimatePresence>
            {repos.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: isConnecting ? 0 : 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                style={{ width: '100%', maxWidth: '720px', marginTop: '58px' }}
              >
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '10px', letterSpacing: '0.3em',
                  color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase',
                  marginBottom: '18px',
                }}>
                  Recent Repositories
                </div>

                <div>
                  {repos.slice(0, 3).map((r, idx) => {
                    const displayName = r.name ? r.name.replace(/-\d{13,}$/, '') : r.id;
                    const ts = r.createdAt ? new Date(r.createdAt).getTime() : null;
                    const ageMs = ts && ts > 1e12 ? Date.now() - ts : null;
                    const ageLabel = ageMs
                      ? ageMs < 3600000   ? `analyzed ${Math.floor(ageMs / 60000)}m ago`
                      : ageMs < 86400000  ? `analyzed ${Math.floor(ageMs / 3600000)}h ago`
                                          : `analyzed ${Math.floor(ageMs / 86400000)}d ago`
                      : null;

                    const isReady = r.status === 'ready';
                    const isError = r.status === 'error';
                    const isIndexing = !isReady && !isError;
                    const progressPct = r.indexingProgress || 0;
                    const progressStr = isIndexing ? `${r.status.toUpperCase()} ${progressPct}%` : '';

                    return (
                      <React.Fragment key={r.id}>
                        {/* subtle divider */}
                        <div style={{ height: '1px', background: 'rgba(210,220,230,0.075)' }} />
                        <motion.button
                          initial={{ opacity: 0, x: -4 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.55 + idx * 0.06, duration: 0.35 }}
                          onClick={() => triggerConnect('__repo__' + r.id)}
                          disabled={isConnecting || !isReady}
                          style={{
                            display: 'flex', alignItems: 'center',
                            justifyContent: 'space-between',
                            minHeight: '66px',
                            padding: '12px 8px',
                            background: 'transparent', border: 'none',
                            cursor: !isReady ? 'default' : 'pointer', width: '100%',
                            transition: 'opacity 300ms cubic-bezier(0.22, 1, 0.36, 1)', // Smooth ease
                            opacity: !isReady ? 0.6 : 1
                          }}
                          onMouseEnter={e => { if (isReady) e.currentTarget.style.opacity = '0.80'; }}
                          onMouseLeave={e => { if (isReady) e.currentTarget.style.opacity = '1'; }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <span style={{ color: isIndexing ? '#3b82f6' : isError ? '#ef4444' : 'rgba(220,225,230,0.50)' }}>
                              <CubeIcon />
                            </span>
                            <span style={{ fontSize: '15px', color: 'rgba(245,247,250,0.88)', letterSpacing: '0.01em', fontFamily: "'Inter', sans-serif" }}>
                              {displayName}
                            </span>
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {isError && (
                              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#ef4444', letterSpacing: '0.03em' }}>
                                FAILED
                              </span>
                            )}
                            {isIndexing && (
                              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#3b82f6', letterSpacing: '0.03em' }}>
                                {progressStr}
                              </span>
                            )}
                            {isReady && ageLabel && (
                              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: 'rgba(215,220,225,0.32)', letterSpacing: '0.03em' }}>
                                {ageLabel}
                              </span>
                            )}
                            {isReady && <ArrowRight size={15} style={{ color: 'rgba(220,225,230,0.42)' }} />}
                          </span>
                        </motion.button>
                        {/* bottom divider on last row */}
                        {idx === Math.min(repos.length, 3) - 1 && (
                          <div style={{ height: '1px', background: 'rgba(210,220,230,0.075)' }} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </section>
      </motion.div>

      {/* ping animation for status dot */}
      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>
    </main>
  );
}
