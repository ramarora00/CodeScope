import React, { useState, useEffect, useRef } from 'react';
import { List } from 'react-window';
import { createHighlighter } from 'shiki';
import { motion, AnimatePresence } from 'framer-motion';
import AICursor from './shared/AICursor';
import SharedCaption from './shared/SharedCaption';

let highlighterPromise = null;

function getShikiHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['github-dark-dimmed'],
      langs: ['javascript', 'typescript', 'python', 'json', 'html', 'css']
    });
  }
  return highlighterPromise;
}

// Subcomponent: Char-by-char staggering text
function StaggeredText({ text, className }) {
  const chars = text.split('');
  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'row', whiteSpace: 'pre' }}>
      {chars.map((char, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ display: 'inline-block' }}
          transition={{
            duration: 0.8, // Calmer
            delay: index * 0.02, 
            ease: [0.16, 1, 0.3, 1] // ease-calm
          }}
        >
          {char}
        </motion.span>
      ))}
    </div>
  );
}

// Subcomponent: Ghost File Tree (purely decorative/ambient)
function GhostFileTree({ activeFile }) {
  return (
    <div className="w-64 h-full flex-shrink-0 pt-32 pl-6 pr-4 opacity-[0.08] select-none pointer-events-none animate-arrival">
      <div className="flex flex-col gap-3 font-mono text-[12px] text-white">
        <div className="text-white/40 mb-4">WORKSPACE</div>
        {[...Array(15)].map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-[2px] bg-white/20" />
            <div className="h-2 bg-white/20 rounded-full" style={{ width: `${Math.random() * 40 + 30}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// Subcomponent: Ghost Knowledge Graph (purely decorative/ambient)
function GhostKnowledgeGraph() {
  return (
    <div className="w-80 h-full flex-shrink-0 pt-32 pr-6 pl-4 opacity-[0.08] select-none pointer-events-none relative animate-arrival" style={{ animationDelay: '400ms' }}>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-white/20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-white/20" />
      {[...Array(5)].map((_, i) => {
        const angle = (i * (360 / 5)) * (Math.PI / 180);
        const radius = 60;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        return (
          <div 
            key={i} 
            className="absolute w-2 h-2 rounded-full bg-white/40" 
            style={{ 
              top: `calc(50% + ${y}px)`, 
              left: `calc(50% + ${x}px)`,
              transform: 'translate(-50%, -50%)'
            }} 
          />
        );
      })}
    </div>
  );
}

export default function RepositoryReadingExperience({ bootStatus, currentFile, currentLine, currentContent }) {
  const [tokenizedLines, setTokenizedLines] = useState([]);
  const [listHeight, setListHeight] = useState(600);
  const containerRef = useRef(null);
  const listRef = useRef(null);
  
  // Jitter buffer for variable reading speed (bursts and pauses)
  const [displayLine, setDisplayLine] = useState(null);
  const queueRef = useRef([]);

  useEffect(() => {
    if (currentLine) {
      queueRef.current.push(currentLine);
    }
  }, [currentLine]);

  useEffect(() => {
    let timeoutId;
    const processQueue = () => {
      if (queueRef.current.length > 0) {
        // 85% fast burst (10-30ms), 15% thoughtful pause (150-400ms)
        const isPause = Math.random() > 0.85;
        const delay = isPause ? Math.random() * 250 + 150 : Math.random() * 20 + 10;
        
        // If queue is huge, drain faster to catch up
        const drainAmount = queueRef.current.length > 50 ? 5 : 1;
        let nextLine;
        for (let i = 0; i < drainAmount; i++) {
          if (queueRef.current.length > 0) nextLine = queueRef.current.shift();
        }
        
        if (nextLine) setDisplayLine(nextLine);
        timeoutId = setTimeout(processQueue, delay);
      } else {
        timeoutId = setTimeout(processQueue, 50);
      }
    };
    processQueue();
    return () => clearTimeout(timeoutId);
  }, []);

  // isArrival = initial 'Reading repository...' stagger phase
  const isArrival = !currentContent || tokenizedLines.length === 0;

  // isFinal = show 'repository understood' pause before workspace dissolves
  // We detect this by bootStatus matching a 'complete' signal
  const isComplete = bootStatus && (
    bootStatus.toLowerCase().includes('complete') ||
    bootStatus.toLowerCase().includes('initializing')
  );

  // Caption labels: terse, lowercase AI fragments (not engineering strings)
  const captionText = (() => {
    if (!bootStatus) return 'observing...';
    const s = bootStatus.toLowerCase();
    if (s.includes('clon')) return 'noticing entrypoint';
    if (s.includes('read')) return 'following request flow';
    if (s.includes('pars')) return 'checking auth layer';
    if (s.includes('resolv') || s.includes('import')) return 'mapping handlers';
    if (s.includes('call') || s.includes('graph')) return 'verifying assumptions';
    if (s.includes('embed')) return 'connecting modules';
    if (s.includes('complete') || s.includes('initializ')) return 'mental model formed';
    return bootStatus.toLowerCase();
  })();

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setListHeight(entry.contentRect.height);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Tokenize content
  useEffect(() => {
    let isMounted = true;
    if (isArrival) return;

    const language = currentFile?.endsWith('.ts') ? 'typescript' : 
                     currentFile?.endsWith('.py') ? 'python' : 
                     currentFile?.endsWith('.json') ? 'json' : 'javascript';

    const tokenizeContent = async () => {
      try {
        const hl = await getShikiHighlighter();
        let langToUse = language;
        if (!hl.getLoadedLanguages().includes(langToUse)) langToUse = 'javascript';
        
        const tokens = hl.codeToTokens(currentContent, {
          lang: langToUse,
          theme: 'github-dark-dimmed'
        });

        if (isMounted) setTokenizedLines(tokens.tokens);
      } catch (e) {
        console.error('[RepositoryReading] Failed to tokenize', e);
        if (isMounted) {
          const lines = currentContent.split('\n').map(line => [{ content: line, color: 'var(--color-text-body)' }]);
          setTokenizedLines(lines);
        }
      }
    };
    tokenizeContent();
    return () => { isMounted = false; };
  }, [currentContent, currentFile]);

  // Scroll to active line
  useEffect(() => {
    if (!listRef.current || !displayLine) return;
    listRef.current.scrollToItem(Math.max(0, displayLine - 1), 'center');
  }, [displayLine]);

  // Row Renderer with Progressive Wave Color Apply
  const Row = ({ index, style }) => {
    const tokens = tokenizedLines[index];
    if (!tokens) return null;

    const lineNum = index + 1;
    const isActive = displayLine === lineNum;

    return (
      <div
        style={{
          ...style,
          display: 'flex',
          alignItems: 'center',
          // Progressive color wave simulation using animation delay based on line index
          animation: 'fade-in 0.2s cubic-bezier(0.0, 0.0, 0.2, 1) forwards',
          animationDelay: `${index * 5}ms`,
          opacity: 0, 
        }}
      >
        <span
          className="flex-shrink-0 select-none text-right pr-4"
          style={{
            width: '60px',
            fontFamily: 'var(--cs-mono)',
            fontSize: '12px',
            color: 'var(--color-text-muted)',
          }}
        >
          {lineNum}
        </span>
        
        {/* AI Cursor inserted inline if active */}
        {isActive && (
          <div className="absolute left-[64px] z-10 flex items-center h-full">
            <AICursor active={!isComplete} height="16px" />
          </div>
        )}

        <pre
          style={{
            flex: 1,
            margin: 0,
            padding: '0 24px 0 16px',
            fontFamily: 'var(--cs-mono)',
            fontSize: '13px',
            whiteSpace: 'pre',
            overflow: 'hidden',
            // Dim non-active lines slightly to give focus to the cursor
            opacity: isActive ? 1 : 0.85
          }}
        >
          {tokens.map((tok, i) => (
            <span
              key={i}
              style={{
                color: tok.color || 'var(--color-text-body)',
                fontStyle: tok.fontStyle === 1 ? 'italic' : 'normal',
              }}
            >
              {tok.content}
            </span>
          ))}
        </pre>
      </div>
    );
  };

  return (
    <div
      className="flex flex-col flex-1 w-full h-full overflow-hidden relative"
      style={{ background: 'var(--cs-bg)' }}
    >
      <AnimatePresence mode="wait">
        {isArrival ? (
          <motion.div
            key="arrival"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0.0, 1.0, 1] }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <StaggeredText 
              text="Reading repository..." 
              className="font-sans text-[15px] text-[#8A8A8E] tracking-wide" 
            />
          </motion.div>
        ) : (
          <motion.div
            key="reading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.0, 0.0, 0.2, 1] }}
            className="absolute inset-0 flex"
          >
            {/* Left Ghost Tree */}
            <GhostFileTree activeFile={currentFile} />

            {/* Center Code Viewer */}
            <div
              className="flex flex-col flex-1 relative mt-16"
              style={{
                maskImage: 'linear-gradient(to bottom, transparent 0%, black 8%, black 70%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 8%, black 70%, transparent 100%)',
              }}
            >
              <div ref={containerRef} className="flex-1 w-full relative">
                <List
                  ref={listRef}
                  height={listHeight}
                  itemCount={tokenizedLines.length}
                  itemSize={24}
                  width="100%"
                  style={{ overflow: 'hidden' }} 
                >
                  {Row}
                </List>
              </div>

              {/* Caption: terse lowercase AI fragment */}
              <div className="absolute bottom-12 left-16 z-20">
                <SharedCaption
                  text={captionText}
                  isVisible={true}
                  style={isComplete ? { color: 'var(--cs-accent)', fontWeight: 600 } : undefined}
                />
              </div>
            </div>

            {/* Right Ghost Graph */}
            <GhostKnowledgeGraph />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent Top Breadcrumb */}
      <div className="absolute top-0 left-0 right-0 h-16 flex items-center justify-center pointer-events-none z-30">
        <StaggeredText 
          text={currentFile || ''} 
          className="font-mono text-[12px] text-white/40" 
        />
      </div>
    </div>
  );
}
