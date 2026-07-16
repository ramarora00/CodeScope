import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Cpu } from 'lucide-react';

export default function LaunchExperience({ onConnect, repos = [] }) {
  const [repoUrl, setRepoUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (repoUrl.trim()) {
      onConnect(repoUrl.trim());
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#05070B] min-h-screen text-center select-none relative overflow-hidden">
      
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
            className="text-[32px] font-semibold text-[#D8DCE6] tracking-tight font-sans"
          >
            CodeScope
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.2 }}
            className="text-[13px] text-[#8E97A8] max-w-md mx-auto"
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
              className="w-full bg-[#0A0E15] border border-white/5 rounded-lg py-3 px-4 text-[13px] text-[#D8DCE6] placeholder-[#5C657A] outline-none focus:border-[#3B82F6] transition-all font-sans"
            />
          </div>
          
          <button
            type="submit"
            disabled={!repoUrl.trim()}
            className="px-6 py-2.5 bg-[#D8DCE6] text-[#05070B] rounded-md text-[12px] font-medium hover:bg-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Connect Repository
          </button>
        </form>

        {/* Demo shortcut */}
        <div className="flex flex-col items-center gap-3 mt-2">
          <button
            onClick={() => onConnect('__demo__')}
            className="flex items-center gap-2 text-[11.5px] text-[#5f5f63] hover:text-[#8b8dee] transition-colors font-sans"
          >
            <Cpu size={12} />
            <span>Try the Reasoning Demo →</span>
          </button>

          {repos.length > 0 && (
            <div className="flex flex-col items-center gap-1 mt-1">
              <span className="text-[10px] text-[#3a3a3e] uppercase tracking-wider">Recent</span>
              {repos.slice(0, 3).map(r => (
                <button
                  key={r.id}
                  onClick={() => onConnect('__repo__' + r.id)}
                  className="text-[11px] font-mono text-[#5f5f63] hover:text-[#c7c7ce] transition-colors"
                >
                  {r.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
