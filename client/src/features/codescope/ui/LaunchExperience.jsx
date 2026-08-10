import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Cpu, LogOut } from 'lucide-react';
import { logout } from '../../../auth/authService';

export default function LaunchExperience({ onConnect, repos = [] }) {
  const [repoUrl, setRepoUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (repoUrl.trim()) {
      onConnect(repoUrl.trim());
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-screen text-center select-none relative overflow-hidden" style={{ background: 'var(--cs-bg)' }}>
      
      {/* Container holding the command surface */}
      <motion.div 
        layoutId="command-surface"
        transition={{ type: 'tween', ease: 'easeOut', duration: 0.25 }}
        className="w-full max-w-xl flex flex-col items-center space-y-8 z-10"
      >
        {/* Title and Subtitle */}
        <div className="space-y-3">
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.2 }}
            className="text-[32px] font-semibold tracking-tight font-sans" style={{ color: 'var(--cs-text)' }}
          >
            CodeScope
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.2 }}
            className="text-[13px] max-w-md mx-auto" style={{ color: 'var(--cs-hint)' }}
          >
            Understand any repository instantly
          </motion.p>
        </div>

        {/* Input & Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="relative w-full">
            <input
              autoFocus
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="Paste GitHub URL or local path..."
              className="w-full border rounded-lg py-3 px-4 text-[13px] outline-none transition-all font-sans"
              style={{ background: 'var(--cs-panel)', borderColor: 'rgba(255,255,255,0.05)', color: 'var(--cs-text)' }}
            />
          </div>
          
          <button
            type="submit"
            disabled={!repoUrl.trim()}
            className="px-6 py-2.5 rounded-md text-[12px] font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110"
            style={{ background: 'var(--cs-text)', color: 'var(--cs-bg)' }}
          >
            Connect Repository
          </button>
        </form>

        {/* Demo shortcut */}
        <div className="flex flex-col items-center gap-3 mt-2">
          <button
            onClick={() => onConnect('__demo__')}
            className="flex items-center gap-2 text-[11.5px] transition-colors font-sans hover:text-[var(--cs-accent)]"
            style={{ color: 'var(--cs-muted)' }}
          >
            <Cpu size={12} />
            <span>Try the Reasoning Demo →</span>
          </button>

          {repos.length > 0 && (
            <div className="flex flex-col items-center gap-1 mt-1">
              <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--cs-faint)' }}>Recent</span>
              {repos.slice(0, 3).map(r => (
                <button
                  key={r.id}
                  onClick={() => onConnect('__repo__' + r.id)}
                  className="text-[11px] font-mono transition-colors hover:text-[var(--cs-text)]"
                  style={{ color: 'var(--cs-muted)' }}
                >
                  {r.name}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => logout()}
            className="flex items-center gap-1.5 text-[10px] tracking-wider uppercase opacity-45 hover:opacity-100 transition-all mt-4 font-mono cursor-pointer"
            style={{ color: 'var(--cs-muted)' }}
          >
            <LogOut size={10} />
            <span>Sign Out</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
