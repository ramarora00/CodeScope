import { SectionHeader } from '@/shared/ui';
import { InlineNotice } from '@/shared/ui';
import { cn } from '@/shared/utils';

export default function ContextRail({ className }) {
  return (
    <div className={cn('flex flex-col gap-4 p-2', className)}>
      <SectionHeader title="Repository Context" />
      <InlineNotice title="Waiting for repository..." variant="info" />
      <SectionHeader title="Selection Context" />
      <InlineNotice title="Nothing selected." variant="info" />
      <SectionHeader title="Session Context" />
      <InlineNotice title="No active investigation." variant="info" />
    </div>
  );
}
