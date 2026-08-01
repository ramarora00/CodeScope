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
      style={{ width: '56px', height: '32px' }}
    >
      {/* Active indicator — thin left silver bar */}
      {item.active && (
        <div
          className="absolute left-0 rounded-r-full"
          style={{
            width: '2px',
            height: '20px',
            background: 'var(--cs-accent)',
            boxShadow: '0 0 8px var(--cs-accent)',
            top: '50%',
            transform: 'translateY(-50%)',
          }}
        />
      )}

      {/* Icon */}
      <div
        className="dock-icon flex items-center justify-center"
        style={{
          width: '32px',
          height: '32px',
          color: item.active ? '#F4F4F4' : 'rgba(255,255,255,0.35)',
          opacity: item.active ? 1.0 : 0.65,
          transition: 'transform 200ms var(--ease-out), color 220ms ease, opacity 220ms ease',
        }}
        onMouseEnter={e => {
          if (!item.active) {
            e.currentTarget.style.color = '#F4F4F4';
            e.currentTarget.style.opacity = '0.9';
            e.currentTarget.style.transform = 'scale(1.05)';
          }
        }}
        onMouseLeave={e => {
          if (!item.active) {
            e.currentTarget.style.color = 'rgba(255,255,255,0.35)';
            e.currentTarget.style.opacity = '0.65';
            e.currentTarget.style.transform = 'scale(1)';
          }
        }}
      >
        <Icon size={22} strokeWidth={1.5} />
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
        width: '56px',
        background: 'var(--cs-bg)',
      }}
    >
      {/* Top icons */}
      <div className="flex flex-col items-center pt-6 gap-10">
        {items.map(item => (
          <DockIcon key={item.id} item={item} onSelect={onSelect} />
        ))}
      </div>

      {/* Bottom icons */}
      <div className="flex flex-col items-center gap-8 pb-4">
        {BOTTOM_ITEMS.map(item => (
          <DockIcon key={item.id} item={{ ...item, active: false }} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}
