import { GlassPanel } from '@/shared/ui';
import ObservatoryHero from './ObservatoryHero';
import { cn } from '@/shared/utils';

export default function InvestigationViewport({ className }) {
  const hasInvestigations = false; // placeholder for future logic
  return (
    <GlassPanel className={cn('flex items-center justify-center', className)}>
      {hasInvestigations ? (
        <div>/* future investigation UI */</div>
      ) : (
        <ObservatoryHero />
      )}
    </GlassPanel>
  );
}
