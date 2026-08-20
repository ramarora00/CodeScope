import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../../../auth/hooks/useAuth';
import { logout } from '../../../../../auth/authService';
import { LogOut, ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function UserAvatarDropdown() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click and Escape key
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (e) {
      console.error('Failed to log out', e);
    }
  };

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'U';
  const initial = displayName.charAt(0).toUpperCase();
  const showImage = user?.photoURL && !imageError;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group flex items-center p-[3px] rounded-full transition-all duration-300 ease-out focus:outline-none ${
          isOpen 
            ? 'bg-[rgba(255,255,255,0.08)] border-[rgba(255,255,255,0.2)] shadow-[0_0_0_1px_rgba(96,165,250,0.2)]' 
            : 'bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.15)]'
        }`}
        style={{
          borderWidth: '1px',
          borderStyle: 'solid',
        }}
      >
        <div 
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
          style={{
            background: 'var(--cs-accent-bg)',
            color: 'var(--cs-accent)',
            fontSize: '12px',
            fontWeight: 600,
            fontFamily: 'var(--cs-sans)',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)'
          }}
        >
          {showImage ? (
            <img 
              src={user.photoURL} 
              alt={displayName} 
              className="w-full h-full object-cover" 
              onError={() => setImageError(true)}
            />
          ) : (
            initial
          )}
        </div>

        {/* Hover Chevron */}
        <div 
          className="overflow-hidden transition-all duration-300 ease-out flex items-center justify-center max-w-[20px] ml-0.5 mr-1"
        >
          <ChevronDown 
            size={13} 
            className={`transition-all duration-300 flex-shrink-0 ${
              isOpen ? 'rotate-180 text-[rgba(96,165,250,0.8)] opacity-100' : 'text-[rgba(255,255,255,0.3)] group-hover:text-[rgba(255,255,255,0.6)] opacity-[0.4] group-hover:opacity-100'
            }`} 
          />
        </div>
      </button>

      {/* CodeScope-styled Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 mt-2 z-50 flex flex-col min-w-[220px]"
            style={{
              background: 'rgba(10, 11, 14, 0.96)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              boxShadow: '0 12px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
              padding: '4px',
            }}
          >
            {/* Header: User Info */}
            <div className="flex items-center gap-3 px-3 py-3 select-none">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
                style={{
                  background: 'var(--cs-accent-bg)',
                  border: '1px solid var(--cs-accent-border)',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--cs-accent)',
                  fontFamily: 'var(--cs-sans)',
                }}
              >
                {showImage ? (
                  <img src={user.photoURL} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  initial
                )}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span style={{ 
                  color: 'var(--cs-text)', 
                  fontSize: '13px', 
                  fontWeight: 500, 
                  fontFamily: 'var(--font-ui)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {displayName}
                </span>
                <span style={{ 
                  color: 'var(--cs-muted)', 
                  fontSize: '11px', 
                  fontFamily: 'var(--font-mono)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {user?.email}
                </span>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />

            {/* Sign Out Action */}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 w-full text-left rounded-[6px] px-3 py-2 cursor-pointer transition-colors"
              style={{
                color: 'var(--cs-muted)',
                fontSize: '12px',
                fontFamily: 'var(--font-ui)',
                background: 'transparent',
                border: 'none'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                e.currentTarget.style.color = 'var(--cs-text)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--cs-muted)';
              }}
            >
              <LogOut size={14} />
              Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
