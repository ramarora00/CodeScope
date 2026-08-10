import React from 'react';
import {
  SquareTerminal,
  FolderOpen,
  Sparkles,
  GitBranch,
  Code2,
  Search,
  Clock,
  Settings,
} from 'lucide-react';

const TOP_ITEMS = [
  { id: 'terminal',      icon: SquareTerminal, title: 'Terminal' },
  { id: 'files',         icon: FolderOpen,     title: 'Files' },
  { id: 'investigation', icon: Sparkles,       title: 'Investigation', active: true },
  { id: 'branch',        icon: GitBranch,      title: 'Branch' },
  { id: 'github',        icon: Code2,          title: 'GitHub' },
  { id: 'search',        icon: Search,         title: 'Search' },
  { id: 'history',       icon: Clock,          title: 'History' },
];

const BOTTOM_ITEMS = [
  { id: 'settings', icon: Settings, title: 'Settings' },
];

function DockIcon({ item, onSelect }) {
  const Icon = item.icon;
  return (
    <div
      onClick={() => onSelect?.(item.id)}
      className="relative flex items-center justify-center cursor-pointer group"
      title={item.title}
      style={{ width: '44px', height: '36px' }}
    >
      {/* Active capsule — glass pill behind icon */}
      {item.active && (
        <div
          className="absolute inset-0 rounded-lg"
          style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        />
      )}

      {/* Icon */}
      <div
        className="dock-icon flex items-center justify-center relative"
        style={{
          width: '32px',
          height: '32px',
          color: item.active ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.22)',
          transition: 'transform 200ms var(--ease-out), color 220ms ease',
        }}
        onMouseEnter={e => {
          if (!item.active) {
            e.currentTarget.style.color = 'rgba(255,255,255,0.55)';
          }
        }}
        onMouseLeave={e => {
          if (!item.active) {
            e.currentTarget.style.color = 'rgba(255,255,255,0.22)';
          }
        }}
      >
        <Icon size={18} strokeWidth={1.5} />
      </div>
    </div>
  );
}

export default function Dock({ activeItem, onSelect }) {
  const items = TOP_ITEMS.map(item => ({
    ...item,
    active: item.id === (activeItem ?? 'investigation'),
  }));

  return (
    <div
      className="flex flex-col items-center justify-between flex-shrink-0 h-full"
      style={{
        width: '48px',
        background: 'transparent',
      }}
    >
      {/* Top icons */}
      <div className="flex flex-col items-center pt-5 gap-1">
        {items.map(item => (
          <DockIcon key={item.id} item={item} onSelect={onSelect} />
        ))}
      </div>

      <div className="flex-1 w-full flex justify-center py-4">
        <div style={{ width: '1px', height: '100%', background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.03), transparent)' }} />
      </div>

      {/* Bottom icons */}
      <div className="flex flex-col items-center gap-2 pb-4">
        {BOTTOM_ITEMS.map(item => (
          <DockIcon key={item.id} item={{ ...item, active: false }} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}
