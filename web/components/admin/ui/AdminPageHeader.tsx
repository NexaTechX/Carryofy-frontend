import { ReactNode } from 'react';
import clsx from 'clsx';

interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  tag?: string;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
  children?: ReactNode;
}

export function AdminPageHeader({
  title,
  subtitle,
  tag,
  meta,
  actions,
  className,
  children,
}: AdminPageHeaderProps) {
  return (
    <header
      className={clsx(
        'flex flex-col gap-4 border-b border-gray-200 pb-6 sm:flex-row sm:items-end sm:justify-between',
        className
      )}
    >
      <div className="space-y-3">
        {tag ? (
          <span className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-medium uppercase tracking-wider text-orange-700">
            {tag}
          </span>
        ) : null}
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">{title}</h1>
          {subtitle ? <p className="mt-2 max-w-2xl text-sm text-gray-500">{subtitle}</p> : null}
        </div>
      </div>
      <div className="flex flex-col-reverse items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
        {meta ? <div className="text-xs font-medium text-gray-500">{meta}</div> : null}
        {actions || children ? <div className="flex items-center gap-2">{actions ?? children}</div> : null}
      </div>
    </header>
  );
}
