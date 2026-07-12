import { GlassPanel } from '@/shared/ui';
import WorkspaceTabBar from './WorkspaceTabBar';
import InvestigationViewport from './InvestigationViewport';
import ContextRail from './ContextRail';
import PromptComposerPanel from './PromptComposerPanel';
import StatusFooter from './StatusFooter';
import { cn } from '@/shared/utils';

export default function ObservatoryShell() {
  return (
    <GlassPanel className={cn('grid h-full w-full grid-rows-[auto_1fr_auto_auto_auto] gap-2 p-2')}>
      <WorkspaceTabBar className="row-start-1" />
      <InvestigationViewport className="row-start-2" />
      <ContextRail className="row-start-3" />
      <PromptComposerPanel className="row-start-4" />
      <StatusFooter className="row-start-5" />
    </GlassPanel>
  );
}
