import { GlassPanel } from '@/shared/ui';
import ObservatoryHero from './ObservatoryHero';
import { cn } from '@/shared/utils';
import { loadAll } from '@/features/investigation/lib';
import InvestigationWorkspace from '@/features/investigation/ui/InvestigationWorkspace';
import { subscribe, unsubscribe, INVESTIGATION_CREATED, INVESTIGATION_DELETED } from '@/shared/lib/events';
import { useState, useEffect } from 'react';

export default function InvestigationViewport({ className }) {
  const [investigations, setInvestigations] = useState([]);

  const refresh = () => {
    console.log("typeof loadAll:", typeof loadAll);
    console.log("loadAll:", loadAll);
    console.log("loadAll():", loadAll ? loadAll() : undefined);
    setInvestigations(loadAll ? loadAll() : []);
  };

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    
    subscribe(INVESTIGATION_CREATED, handler);
    subscribe(INVESTIGATION_DELETED, handler);
    
    return () => {
      unsubscribe(INVESTIGATION_CREATED, handler);
      unsubscribe(INVESTIGATION_DELETED, handler);
    };
  }, []);

  const hasInvestigations = investigations.length > 0;
  console.log("investigations:", investigations);
  console.log("hasInvestigations:", hasInvestigations);

  return (
    <GlassPanel className={cn('flex items-center justify-center', className)}>
      {hasInvestigations ? (
        <InvestigationWorkspace />
      ) : (
        <ObservatoryHero />
      )}
    </GlassPanel>
  );
}
