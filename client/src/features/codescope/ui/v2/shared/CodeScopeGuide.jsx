import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, X, ArrowRight, ArrowLeft, Terminal, Info, LogIn } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const InfoReminder = () => (
  <div className="flex items-start gap-2 mt-6 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
    <Info className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
    <p className="text-xs text-zinc-500 leading-relaxed">
      Need more details about this screen? Click the <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-zinc-800/50 border border-zinc-700/50 mx-1"><Info className="w-3 h-3 text-zinc-400" /></span> button at the top right of the page.
    </p>
  </div>
);

const GUIDE_STEPS = [
  {
    title: 'Secure Authentication',
    content: (
      <div className="space-y-4">
        <p className="text-sm text-zinc-400 leading-relaxed">
          CodeScope provides private, isolated workspaces. You must sign in to begin your investigation.
        </p>
        <div className="bg-[#111] border border-zinc-800/50 rounded-lg p-4 space-y-3">
          <p className="text-[13px] text-zinc-300">How to sign in:</p>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded bg-zinc-800 border border-zinc-700/50">
              <LogIn className="w-4 h-4 text-zinc-400" />
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Use your email and password, or click <strong>Continue with Google</strong> for instant access.
            </p>
          </div>
        </div>
        <InfoReminder />
      </div>
    )
  },
  {
    title: 'Start with a repository',
    content: (
      <div className="space-y-4">
        <p className="text-sm text-zinc-400 leading-relaxed">
          Paste a public GitHub repository to begin.
        </p>
        <div className="bg-[#111] border border-zinc-800/50 rounded-lg p-4 space-y-3">
          <p className="text-[13px] text-zinc-300">Try this small repo:</p>
          <div className="flex items-center gap-2 bg-[#1A1A1A] p-2.5 rounded-md border border-zinc-700/50 shadow-inner">
            <Terminal className="w-4 h-4 text-zinc-500 shrink-0" />
            <code className="text-xs text-zinc-300 font-mono select-all break-all leading-tight">https://github.com/sindresorhus/component-emitter</code>
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed">
            It's intentionally small, so you can see the complete CodeScope flow quickly.
          </p>
        </div>
        <InfoReminder />
      </div>
    )
  },
  {
    title: 'Let CodeScope map the repository',
    content: (
      <div className="space-y-4">
        <p className="text-sm text-zinc-400 leading-relaxed">
          CodeScope indexes the repository and builds its structural model. 
          You don't need to do anything while this is happening — wait until the repository is mapped.
        </p>
        <div className="flex items-center gap-2 text-[13px] text-emerald-400/90 font-medium bg-emerald-400/10 border border-emerald-400/20 px-3 py-2 rounded-md w-fit">
          <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"></div>
          Repository mapped
        </div>
        <InfoReminder />
      </div>
    )
  },
  {
    title: 'Ask about the codebase',
    content: (
      <div className="space-y-4">
        <p className="text-sm text-zinc-400 leading-relaxed">
          Once the repository is mapped, you can ask a natural-language question about the codebase.
        </p>
        <div className="bg-[#111] border border-zinc-800/50 rounded-lg p-4">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono mb-2.5">Example Question</p>
          <p className="text-[14px] text-zinc-200 font-medium italic">"Explain the authentication flow of this repository"</p>
        </div>
        <p className="text-xs text-zinc-500">
          This is just an example—feel free to ask your own specific questions!
        </p>
        <InfoReminder />
      </div>
    )
  },
  {
    title: 'Follow the investigation',
    content: (
      <div className="space-y-4">
        <p className="text-sm text-zinc-400 leading-relaxed">
          CodeScope retrieves relevant repository context, reasons over it, and traces the evidence used to answer the question.
        </p>
        <div className="flex flex-col gap-2.5 relative pl-4 py-2 mt-2">
          <div className="absolute left-[5px] top-4 bottom-4 w-px bg-zinc-800"></div>
          <div className="text-xs text-zinc-300 relative before:content-[''] before:absolute before:-left-4 before:top-1 before:w-1.5 before:h-1.5 before:bg-blue-500 before:rounded-full before:shadow-[0_0_8px_rgba(59,130,246,0.5)]">Question</div>
          <div className="text-[11px] text-zinc-500 relative before:content-[''] before:absolute before:-left-[14px] before:top-1.5 before:w-1 before:h-1 before:bg-zinc-600 before:rounded-full">Context</div>
          <div className="text-[11px] text-zinc-500 relative before:content-[''] before:absolute before:-left-[14px] before:top-1.5 before:w-1 before:h-1 before:bg-zinc-600 before:rounded-full">AI Reasoning</div>
          <div className="text-[11px] text-emerald-400/80 relative before:content-[''] before:absolute before:-left-4 before:top-1 before:w-1.5 before:h-1.5 before:bg-emerald-500 before:rounded-full before:shadow-[0_0_8px_rgba(52,211,153,0.3)]">Evidence</div>
          <div className="text-[11px] text-zinc-300 relative before:content-[''] before:absolute before:-left-[15px] before:top-1 before:w-1.5 before:h-1.5 before:border before:border-zinc-500 before:bg-zinc-900 before:rounded-full">Investigation report</div>
        </div>
        <InfoReminder />
      </div>
    )
  },
  {
    title: 'Explore what CodeScope found',
    content: (
      <div className="space-y-5">
        <p className="text-sm text-zinc-400 leading-relaxed">
          You can explore the resulting findings, relevant files, insights, and the reasoning behind the answer.
        </p>
        <div className="p-4 rounded-lg border border-zinc-800/50 bg-gradient-to-b from-[#111] to-transparent">
          <p className="text-[13px] text-zinc-300 font-medium">
            You're ready to investigate.
          </p>
        </div>
        <InfoReminder />
      </div>
    )
  }
];

export default function CodeScopeGuide({ className }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Reset step when closed
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => setCurrentStep(0), 200);
    }
  }, [isOpen]);

  const step = GUIDE_STEPS[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === GUIDE_STEPS.length - 1;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "group flex items-center justify-center gap-1.5 px-3 h-7 rounded-md transition-all duration-200",
          "bg-[#1C1C1C] hover:bg-[#242424] hover:shadow-[0_0_12px_rgba(255,255,255,0.05)]",
          "border border-white/5",
          "focus:outline-none focus:ring-1 focus:ring-zinc-600",
          className
        )}
      >
        <Play className="w-3 h-3 text-emerald-400/80 group-hover:text-emerald-400 transition-colors" />
        <span className="text-[11px] font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors uppercase tracking-wide">Guide</span>
      </button>

      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <div key="guide-modal" className="fixed inset-0 flex items-center justify-center p-4 sm:p-6" style={{ zIndex: 99999 }}>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                onClick={() => setIsOpen(false)}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 10 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="relative w-full max-w-[540px] bg-[#0A0A0A] border border-zinc-800 shadow-2xl rounded-xl overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex-shrink-0 p-6 pb-5 border-b border-zinc-800/50 bg-gradient-to-b from-[#111] to-[#0A0A0A] flex justify-between items-start">
                  <div>
                    <div className="text-[10px] text-zinc-500 tracking-widest font-mono uppercase mb-2">How to use CodeScope</div>
                    <h2 className="text-lg font-medium text-zinc-100">{step.title}</h2>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 rounded-md transition-colors -mr-1.5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 px-7 bg-[#0A0A0A] min-h-[220px]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentStep}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {step.content}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Footer Controls */}
                <div className="p-5 px-7 border-t border-zinc-800/50 bg-[#0A0A0A] flex items-center justify-between">
                  {/* Progress Indicator */}
                  <div className="flex items-center gap-4">
                    <span className="text-[11px] font-mono text-zinc-500 tracking-wider">
                      {String(currentStep + 1).padStart(2, '0')} / {String(GUIDE_STEPS.length).padStart(2, '0')}
                    </span>
                    <button 
                      onClick={() => setIsOpen(false)}
                      className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors uppercase tracking-widest font-medium"
                    >
                      Skip guide
                    </button>
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => !isFirst && setCurrentStep(c => c - 1)}
                      disabled={isFirst}
                      className="w-8 h-8 flex items-center justify-center rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>

                    {isLast ? (
                      <button
                        onClick={() => setIsOpen(false)}
                        className="px-4 h-8 flex items-center gap-1.5 rounded-md bg-white text-black hover:bg-zinc-200 transition-colors font-medium text-[13px]"
                      >
                        Start exploring
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => !isLast && setCurrentStep(c => c + 1)}
                        className="px-4 h-8 flex items-center gap-1.5 rounded-md bg-zinc-800 text-white hover:bg-zinc-700 transition-colors font-medium text-[13px]"
                      >
                        Next
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress bar line */}
                <div className="h-0.5 bg-zinc-900 w-full absolute bottom-0 left-0">
                  <motion.div
                    className="h-full bg-emerald-500/80"
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentStep + 1) / GUIDE_STEPS.length) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
