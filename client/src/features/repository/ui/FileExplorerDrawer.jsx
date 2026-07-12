import React, { useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import FileExplorer from '../../../components/FileExplorer';

export default function FileExplorerDrawer({ isOpen, onClose, repo, onFileSelect }) {
  const containerRef = useRef(null);

  // Click outside to close drawer
  useEffect(() => {
    function handleClickOutside(event) {
      if (isOpen && containerRef.current && !containerRef.current.contains(event.target)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black z-30 pointer-events-auto"
          />

          {/* Sliding Panel */}
          <motion.div
            ref={containerRef}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="absolute left-0 top-0 bottom-0 w-[280px] bg-[#0A0E15] border-r border-[#1C2331] z-40 shadow-2xl flex flex-col pointer-events-auto"
          >
            {/* Header controls inside Drawer */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1C2331]">
              <span className="text-[11px] font-bold text-[#D8DCE6] tracking-wider uppercase">Project Files</span>
              <button 
                onClick={onClose}
                className="text-[#5C657A] hover:text-[#D8DCE6] p-1 rounded-md hover:bg-[#10141C] transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
            
            <div className="flex-1 overflow-hidden">
              <FileExplorer 
                repo={repo} 
                onFileSelect={(file) => {
                  onFileSelect(file);
                  onClose();
                }} 
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
