import { StatusBadge } from '@/shared/ui';

export default function InvestigationStatusBadge({ status, dotOnly = false, className }) {
  let variant = 'neutral';
  switch (status) {
    case 'Created':
      variant = 'neutral';
      break;
    case 'Investigating':
      variant = 'info';
      break;
    case 'Answered':
      variant = 'success';
      break;
    case 'Stopped':
      variant = 'warning';
      break;
    case 'Needs Attention':
      variant = 'error';
      break;
    case 'Archived':
      variant = 'neutral';
      break;
    default:
      variant = 'neutral';
  }

  return (
    <StatusBadge variant={variant} dotOnly={dotOnly} className={className}>
      {status}
    </StatusBadge>
  );
}
