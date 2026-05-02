import { ReactNode } from 'react';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  className?: string;
  children?: ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center',
        className
      )}
    >
      {Icon ? <Icon className="h-10 w-10 text-gray-300" strokeWidth={1.25} aria-hidden /> : null}
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        {description ? <p className="mt-1 max-w-md text-xs text-gray-400">{description}</p> : null}
      </div>
      {children}
      {actionLabel && onAction ? (
        <Button type="button" variant="primary" className="mt-1" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
      {actionLabel && actionHref ? (
        actionHref.startsWith('/') ? (
          <Link
            href={actionHref}
            className="mt-1 inline-flex items-center justify-center rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-orange-600"
          >
            {actionLabel}
          </Link>
        ) : (
          <a
            href={actionHref}
            className="mt-1 inline-flex items-center justify-center rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-orange-600"
          >
            {actionLabel}
          </a>
        )
      ) : null}
    </div>
  );
}
