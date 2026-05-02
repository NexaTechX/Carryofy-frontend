import { ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import clsx from 'clsx';

interface AdminEmptyStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  className?: string;
  action?: ReactNode;
}

export function AdminEmptyState({
  title = 'Nothing to show just yet',
  description = 'Try adjusting your filters or check back later.',
  icon,
  className,
  action,
}: AdminEmptyStateProps) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center',
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-100 bg-gray-50 text-orange-500">
        {icon ?? <Inbox className="h-5 w-5" />}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="mt-1 max-w-md text-xs text-gray-400">{description}</p>
      </div>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
