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
            top: '50%',
            transform: 'translateY(-50%)',
          }}
        />
      )}

      {/* Icon */}
      <div
        className="flex items-center justify-center transition-colors duration-[220ms]"
        style={{
          width: '32px',
          height: '32px',
          color: item.active ? 'var(--cs-accent)' : 'var(--cs-hint)',
        }}
        onMouseEnter={e => {
          if (!item.active) e.currentTarget.style.color = 'var(--cs-muted)';
        }}
        onMouseLeave={e => {
          if (!item.active) e.currentTarget.style.color = 'var(--cs-hint)';
        }}
      >
        <Icon size={18} strokeWidth={1.6} />
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
      <div className="flex flex-col items-center pt-5 gap-8">
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
