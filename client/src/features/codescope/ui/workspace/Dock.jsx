import React, { useState } from 'react';
import { 
  LayoutGrid, Brain, Folder, Code2, Network, 
  PlayCircle, Zap, Sparkles, Search, GitBranch, Settings 
} from 'lucide-react';

export default function Dock({ activeTab, onTabSelect }) {
  const [hoveredIcon, setHoveredIcon] = useState(null);

  const sections = [
    {
      id: 'top',
      items: [
        { id: 'workspace', icon: LayoutGrid, label: 'Workspace' },
        { id: 'memory', icon: Brain, label: 'Workspace Memory' },
      ]
    },
    {
      id: 'middle',
      items: [
        { id: 'explorer', icon: Folder, label: 'File Explorer' },
        { id: 'editor', icon: Code2, label: 'Code Editor' },
        { id: 'graph', icon: Network, label: 'Repository Graph' },
        { id: 'execution', icon: PlayCircle, label: 'Execution Flow' },
        { id: 'impact', icon: Zap, label: 'Impact Analysis' },
      ]
    },
    {
      id: 'bottom',
      items: [
        { id: 'claude', icon: Sparkles, label: 'Claude Assistant' },
        { id: 'search', icon: Search, label: 'Global Search' },
        { id: 'github', icon: GitBranch, label: 'GitHub Sync' },
        { id: 'settings', icon: Settings, label: 'Settings' },
      ]
    }
  ];

  return (
    <aside className="w-12 bg-[#080A0F] border-r border-white/5 flex flex-col items-center py-4 select-none h-full relative z-30 justify-between">
      {sections.map((section, sIdx) => (
        <div key={section.id} className="flex flex-col items-center gap-4 w-full text-center">
          {section.items.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <div 
                key={item.id}
                className="relative group flex items-center justify-center w-full"
                onMouseEnter={() => setHoveredIcon(item.id)}
                onMouseLeave={() => setHoveredIcon(null)}
              >
                {/* Active Indicator Bar on Left */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 bg-[#8b8dee] rounded-r-sm" />
                )}

                {/* Dock Button */}
                <button
                  onClick={() => onTabSelect(item.id)}
                  className={`w-8 h-8 rounded-md flex items-center justify-center transition-all duration-150 relative ${
                    isActive 
                      ? 'text-[#e9e9ea] bg-white/[0.04]' 
                      : 'text-[#5f5f63] hover:text-[#c7c7ce] hover:bg-white/[0.02]'
                  }`}
                  aria-label={item.label}
                >
                  <Icon size={16} strokeWidth={isActive ? 2 : 1.5} />
                </button>

                {/* Custom Tooltip */}
                {hoveredIcon === item.id && (
                  <div className="absolute left-12 top-1/2 -translate-y-1/2 bg-[#0A0D12] border border-white/10 text-[#e9e9ea] text-[10.5px] font-sans font-medium px-2 py-1 rounded shadow-xl whitespace-nowrap z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-100">
                    {item.label}
                  </div>
                )}
              </div>
            );
          })}
          {/* Subtle Hairline Dividers between sections */}
          {sIdx < sections.length - 1 && (
            <div className="w-6 h-[0.5px] bg-white/5 my-1" />
          )}
        </div>
      ))}
    </aside>
  );
}
