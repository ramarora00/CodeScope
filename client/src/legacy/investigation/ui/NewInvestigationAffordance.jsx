import { ActionButton } from '@/shared/ui';
import { Plus } from 'lucide-react';

export default function NewInvestigationAffordance({ className }) {
  return (
    <ActionButton 
      icon={Plus} 
      variant="ghost" 
      aria-label="New Investigation" 
      className={className} 
    />
  );
}
