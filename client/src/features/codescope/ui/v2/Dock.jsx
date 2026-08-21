import React from 'react';
import {
  Library,
  Sparkles,
  Waypoints
} from 'lucide-react';

const TOP_ITEMS = [
  { id: 'files',         icon: Library,        title: 'Explorer' },
  { id: 'investigation', icon: Sparkles,       title: 'Investigation', active: true },
  { id: 'branch',        icon: Waypoints,      title: 'Code Graph' },
];

const BOTTOM_ITEMS = [];

function DockIcon({ item, onSelect }) {
  const Icon = item.icon;
  return (
    <div
      onClick={() => onSelect?.(item.id)}
      className="relative flex items-center justify-center cursor-pointer group"
      style={{ width: '44px', height: '36px' }}
    >
      {/* Active capsule — glass pill behind icon */}
      {item.active && (
        <div
          className="absolute inset-0 rounded-lg"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        />
      )}

      {/* Tooltip */}
      <div 
        className="absolute left-[54px] px-2 py-1.5 rounded-[5px] pointer-events-none z-50 whitespace-nowrap opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 ease-out"
        style={{
          background: '#0B0D10', // Graphite
          border: '1px solid #20262D', // Border
          color: '#F2F4F7', // Primary text
          fontSize: '11px',
          fontWeight: 500,
          fontFamily: 'var(--font-ui)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        }}
      >
        {item.title}
      </div>

      {/* Icon */}
      <div
        className="dock-icon flex items-center justify-center relative"
        style={{
          width: '32px',
          height: '32px',
          color: item.active ? '#E8EDF3' : '#59616C', // active / muted
          transition: 'transform 200ms var(--ease-out), color 150ms ease',
        }}
        onMouseEnter={e => {
          if (!item.active) {
            e.currentTarget.style.color = '#9AA3AF'; // secondary text on hover
            e.currentTarget.style.transform = 'scale(1.05)';
          }
        }}
        onMouseLeave={e => {
          if (!item.active) {
            e.currentTarget.style.color = '#59616C';
            e.currentTarget.style.transform = 'scale(1)';
          }
        }}
      >
        <Icon size={18} strokeWidth={1.5} />
        {/* Optional signal for active Investigation */}
        {item.active && item.id === 'investigation' && (
          <div className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-[#6EA8E8] shadow-[0_0_4px_#6EA8E8]" />
        )}
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
        {/* Spacer */}
      </div>
    </div>
  );
}
