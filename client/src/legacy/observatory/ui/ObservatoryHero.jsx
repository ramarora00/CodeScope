import { GlassPanel } from '@/shared/ui';
import { SectionHeader } from '@/shared/ui';
import { cn } from '@/shared/utils';

export default function ObservatoryHero() {
  return (
    <GlassPanel className={cn('flex flex-col items-center justify-center p-8 text-center')}>
      <SectionHeader title="AI OBSERVATORY" className="text-2xl mb-4" />
      <p className="mb-6 max-w-prose">Ask anything about your repository. The AI will inspect architecture, dependencies, execution, documentation, and health.</p>
      <pre className="bg-surface rounded p-4 text-left">
        Why does checkout timeout under load?
        Trace authentication across services.
        Show everything impacted by UserService.
        Find architectural bottlenecks.
        Explain how payment retries work.
      </pre>
    </GlassPanel>
  );
}
