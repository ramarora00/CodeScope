import { cn } from '@/shared/utils';
import NewInvestigationAffordance from './NewInvestigationAffordance';
import InvestigationTab from './InvestigationTab';
import { placeholderInvestigations } from '../model/placeholderInvestigations';

export default function WorkspaceTabBar({ className }) {
  return (
    <div className={cn('flex items-center gap-1 border-b border-[var(--color-border-base)] px-2 py-1', className)}>
      <NewInvestigationAffordance />
      <div className="flex items-center gap-1 overflow-x-auto flex-1 custom-scrollbar">
        {placeholderInvestigations.map((inv, idx) => (
          <InvestigationTab 
            key={inv.id} 
            investigation={inv} 
            isActive={idx === 0} 
          />
        ))}
      </div>
    </div>
  );
}
