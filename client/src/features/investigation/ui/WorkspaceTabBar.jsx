import { cn } from '@/shared/utils';
import NewInvestigationAffordance from './NewInvestigationAffordance';
import InvestigationTab from './InvestigationTab';

export default function WorkspaceTabBar({ 
  className, 
  investigations = [], 
  activeTabId, 
  onTabSelect, 
  onCreate,
  onRename,
  onArchive
}) {
  return (
    <div className={cn('flex items-center gap-1 border-b border-[var(--color-border-base)] px-2 py-1', className)}>
      <NewInvestigationAffordance onClick={onCreate} />
      <div className="flex items-center gap-1 overflow-x-auto flex-1 custom-scrollbar">
        {investigations.map((inv) => (
          <InvestigationTab 
            key={inv.id} 
            investigation={inv} 
            isActive={inv.id === activeTabId}
            onClick={() => onTabSelect(inv.id)}
            onRename={(newTitle) => onRename(inv.id, newTitle)}
            onArchive={() => onArchive(inv.id)}
          />
        ))}
      </div>
    </div>
  );
}
