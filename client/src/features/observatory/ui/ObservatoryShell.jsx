import { GlassPanel } from '@/shared/ui';
import WorkspaceTabBar from './WorkspaceTabBar';
import InvestigationViewport from './InvestigationViewport';
import ContextRail from './ContextRail';
import PromptComposerPanel from './PromptComposerPanel';
import StatusFooter from './StatusFooter';
import { cn } from '@/shared/utils';

export default function ObservatoryShell() {
  return (
    <GlassPanel className={cn('grid h-full w-full grid-rows-[auto_1fr_auto_auto] grid-cols-[1fr_auto] gap-2 p-2')}>
      <WorkspaceTabBar className="row-start-1 col-span-2" />
      <InvestigationViewport className="row-start-2 col-start-1" />
      <ContextRail className="row-start-2 col-start-2" />
      <PromptComposerPanel className="row-start-3 col-span-2" />
      <StatusFooter className="row-start-4 col-span-2" />
    </GlassPanel>
  );
}
