import { GlassPanel } from '@/shared/ui';
import { cn } from '@/shared/utils';
import WorkspaceTabBar from './WorkspaceTabBar';
import InvestigationCanvasPlaceholder from './InvestigationCanvasPlaceholder';
import ArchiveTray from './ArchiveTray';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';
import ReopenToast from './ReopenToast';

export default function InvestigationWorkspace({ className }) {
  return (
    <GlassPanel className={cn('flex flex-col h-full w-full overflow-hidden', className)}>
      <WorkspaceTabBar />
      <div className="flex-1 relative flex">
        <InvestigationCanvasPlaceholder />
        <ArchiveTray />
        <DeleteConfirmationDialog />
        <ReopenToast />
      </div>
    </GlassPanel>
  );
}
