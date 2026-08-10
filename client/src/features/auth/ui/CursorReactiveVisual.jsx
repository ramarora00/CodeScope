import React, { useEffect, useState, useRef } from 'react';

export default function CursorReactiveVisual({ authState }) {
  const containerRef = useRef(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current || authState === 'EMAIL_FOCUS' || authState === 'PASSWORD_FOCUS' || authState === 'AUTHENTICATING') return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const deltaX = (e.clientX - centerX) / (window.innerWidth / 2);
      const deltaY = (e.clientY - centerY) / (window.innerHeight / 2);

      // Smooth interpolation values
      setCoords({
        x: Math.max(-10, Math.min(10, deltaX * 14)),
        y: Math.max(-10, Math.min(10, deltaY * 14))
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [authState]);

  // Interpolations based on authState
  let headStyle = { transform: 'translate(0px, 0px)', transition: 'transform 0.4s var(--ease-calm)' };
  let eyeStyle = { transform: 'translate(0px, 0px)', opacity: 1, transition: 'transform 0.3s var(--ease-calm), opacity 0.3s' };

  if (authState === 'EMAIL_FOCUS') {
    headStyle = { transform: 'translate(10px, -2px) rotate(3deg)', transition: 'transform 0.3s ease-out' };
    eyeStyle = { transform: 'translate(8px, -1px)', opacity: 1, transition: 'transform 0.3s ease-out' };
  } else if (authState === 'PASSWORD_FOCUS') {
    headStyle = { transform: 'translate(-10px, 6px) rotate(-6deg)', transition: 'transform 0.4s ease-in-out' };
    eyeStyle = { transform: 'translate(-8px, 2px)', opacity: 0.15, transition: 'transform 0.4s ease-in-out, opacity 0.4s' };
  } else if (authState === 'AUTHENTICATING') {
    headStyle = { transform: 'translate(0px, -5px)', transition: 'transform 0.2s ease-in-out' };
    eyeStyle = { transform: 'translate(0px, 0px)', opacity: 1, transition: 'transform 0.2s ease-in-out' };
  } else {
    headStyle = { transform: `translate(${coords.x}px, ${coords.y}px)`, transition: 'transform 0.2s ease-out' };
    eyeStyle = { transform: `translate(${coords.x * 1.3}px, ${coords.y * 1.3}px)`, opacity: 1, transition: 'transform 0.15s ease-out' };
  }

  return (
    <div 
      ref={containerRef} 
      className="relative w-full max-w-[420px] h-[340px] flex items-center justify-center select-none"
    >
      
      {/* Symmetrical Orbit paths */}
      <svg className="absolute w-full h-full pointer-events-none" viewBox="0 0 400 400">
        <ellipse cx="200" cy="220" rx="180" ry="65" fill="none" stroke="var(--cs-border)" strokeWidth="1" transform="rotate(-12, 200, 220)" />
        <ellipse cx="200" cy="220" rx="210" ry="78" fill="none" stroke="rgba(255,255,255,0.015)" strokeWidth="1" transform="rotate(8, 200, 220)" />
        <ellipse cx="200" cy="220" rx="130" ry="46" fill="none" stroke="var(--cs-border)" strokeWidth="1" />

        {/* Orbit Nodes */}
        <circle cx="95" cy="190" r="1.5" fill="var(--cs-muted)" />
        <circle cx="310" cy="240" r="2" fill="var(--cs-faint)" />
        <circle cx="160" cy="150" r="1" fill="var(--cs-muted)" />
        <circle cx="270" cy="180" r="1.5" fill="var(--cs-faint)" />
      </svg>

      {/* Orbit metadata cards using design system tokens */}
      <div className="absolute inset-0 pointer-events-none font-mono">
        
        {/* Code Card */}
        <div 
          className="absolute top-[10%] right-[15%] flex flex-col items-center gap-1 p-2 rounded border backdrop-blur-md transition-transform duration-500"
          style={{ 
            background: 'var(--cs-panel)', 
            borderColor: 'var(--cs-border)',
            transform: `translate(${coords.x * -0.2}px, ${coords.y * -0.2}px)` 
          }}
        >
          <span className="text-[10px] text-[var(--cs-text)]">&lt;/&gt;</span>
          <span className="text-[8px] text-[var(--cs-muted)]">Code</span>
        </div>

        {/* Dependencies Card */}
        <div 
          className="absolute top-[35%] left-[2%] flex flex-col items-center gap-1 p-2 rounded border backdrop-blur-md transition-transform duration-500"
          style={{ 
            background: 'var(--cs-panel)', 
            borderColor: 'var(--cs-border)',
            transform: `translate(${coords.x * 0.3}px, ${coords.y * 0.3}px)` 
          }}
        >
          <svg className="w-3 h-3 text-[var(--cs-text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span className="text-[8px] text-[var(--cs-muted)]">Dependencies</span>
        </div>

        {/* Files Card */}
        <div 
          className="absolute top-[40%] right-[3%] flex flex-col items-center gap-1 p-2 rounded border backdrop-blur-md transition-transform duration-500"
          style={{ 
            background: 'var(--cs-panel)', 
            borderColor: 'var(--cs-border)',
            transform: `translate(${coords.x * -0.4}px, ${coords.y * -0.4}px)` 
          }}
        >
          <svg className="w-3 h-3 text-[var(--cs-text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-[8px] text-[var(--cs-muted)]">Files</span>
        </div>

        {/* Executions Card */}
        <div 
          className="absolute bottom-[20%] left-[10%] flex flex-col items-center gap-1 p-2 rounded border backdrop-blur-md transition-transform duration-500"
          style={{ 
            background: 'var(--cs-panel)', 
            borderColor: 'var(--cs-border)',
            transform: `translate(${coords.x * 0.25}px, ${coords.y * 0.25}px)` 
          }}
        >
          <svg className="w-3 h-3 text-[var(--cs-text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-[8px] text-[var(--cs-muted)]">Executions</span>
        </div>

        {/* Structure Card */}
        <div 
          className="absolute bottom-[22%] right-[10%] flex flex-col items-center gap-1 p-2 rounded border backdrop-blur-md transition-transform duration-500"
          style={{ 
            background: 'var(--cs-panel)', 
            borderColor: 'var(--cs-border)',
            transform: `translate(${coords.x * -0.15}px, ${coords.y * -0.15}px)` 
          }}
        >
          <svg className="w-3 h-3 text-[var(--cs-text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <span className="text-[8px] text-[var(--cs-muted)]">Structure</span>
        </div>
      </div>

      {/* AI observatory robot core */}
      <div className="relative w-48 h-48 flex items-center justify-center">
        
        {/* Pedestal Base */}
        <div 
          className="absolute bottom-[0%] w-40 h-8 rounded-[50%] flex items-center justify-center border"
          style={{ background: 'var(--cs-glass-panel)', borderColor: 'var(--cs-border)' }}
        >
          <div className="w-[85%] h-[80%] border rounded-[50%] flex items-center justify-center" style={{ borderColor: 'var(--cs-border)' }}>
            <div className={`w-[60%] h-[60%] bg-[var(--cs-accent)] opacity-[0.06] blur-md rounded-[50%] ${authState === 'AUTHENTICATING' ? 'animate-pulse' : ''}`} />
          </div>
        </div>

        {/* Support Stand legs */}
        <svg className="absolute bottom-[8%] w-24 h-12 text-[rgba(255,255,255,0.05)]" viewBox="0 0 100 50" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M 30 10 L 15 45 L 35 47" />
          <path d="M 70 10 L 85 45 L 65 47" />
          <path d="M 50 10 L 50 40" strokeWidth="2.5" />
        </svg>

        {/* Sphere Head */}
        <div 
          style={headStyle}
          className="absolute w-32 h-32 rounded-full border bg-[#0B0B0C] shadow-2xl flex items-center justify-center transition-all overflow-hidden"
          style={{ 
            ...headStyle, 
            borderColor: 'var(--cs-border)', 
            background: 'var(--cs-panel)' 
          }}
        >
          {/* Reflective shine overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[rgba(255,255,255,0.015)] to-transparent" />

          {/* Curved Visor */}
          <div className="relative w-[85%] h-[60%] bg-[#050505] border rounded-[40px] flex items-center justify-center overflow-hidden" style={{ borderColor: 'var(--cs-border)' }}>
            {authState === 'AUTHENTICATING' && (
              <div className="absolute inset-x-0 h-[1.5px] bg-[var(--cs-accent)] opacity-60 top-0 animate-pulse" />
            )}

            {/* Glowing Eyes */}
            <div 
              style={eyeStyle}
              className="flex gap-5 items-center"
            >
              <div 
                className="w-2.5 h-6 rounded-full bg-[var(--cs-text)] transition-all duration-300"
                style={{
                  boxShadow: authState === 'AUTHENTICATING' ? '0 0 12px var(--cs-accent)' : '0 0 6px var(--cs-text)'
                }}
              />
              <div 
                className="w-2.5 h-6 rounded-full bg-[var(--cs-text)] transition-all duration-300"
                style={{
                  boxShadow: authState === 'AUTHENTICATING' ? '0 0 12px var(--cs-accent)' : '0 0 6px var(--cs-text)'
                }}
              />
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
