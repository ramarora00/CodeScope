import { cn } from '@/shared/utils';
import { QueryInput } from '@/shared/ui';
import { ActionButton } from '@/shared/ui';
import { InlineNotice } from '@/shared/ui';
import { useState } from 'react';
import { createInvestigationCommand } from '@/features/investigation/lib';

export default function PromptComposerPanel({ className }) {
  const [inputValue, setInputValue] = useState('');
  const [noticeVisible, setNoticeVisible] = useState(false);

  const handleInvestigate = () => {
    if (!inputValue.trim()) return;
    
    // Generate an ID here since the factory expects one
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2);
    
    createInvestigationCommand({ id, title: inputValue.trim() });
    setInputValue('');
  };

  return (
    <div className={cn('flex flex-col gap-2 p-4 border-t border-[var(--color-border-base)]', className)}>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <QueryInput
            placeholder="Ask about the repository..."
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                handleInvestigate();
              }
            }}
          />
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <ActionButton
            aria-label="Investigate"
            onClick={handleInvestigate}
          >
            Investigate
          </ActionButton>
          <span className="text-xs text-[var(--color-text-muted)] font-mono">Ctrl+Enter</span>
        </div>
      </div>
      {noticeVisible && (
        <InlineNotice
          title="AI reasoning becomes available in Sprint 3.1."
          variant="info"
        />
      )}
    </div>
  );
}
