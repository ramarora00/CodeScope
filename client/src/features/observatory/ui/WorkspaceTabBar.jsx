import { SectionHeader } from '@/shared/ui';
import { ActionButton } from '@/shared/ui';
import { cn } from '@/shared/utils';

export default function WorkspaceTabBar({ className }) {
  return (
    <div className={cn('flex items-center gap-2 p-2', className)}>
      <SectionHeader title="Observatory" />
      <ActionButton disabled>{/* Add Tab */}+ </ActionButton>
      <ActionButton disabled>{/* Close */}×</ActionButton>
    </div>
  );
}
