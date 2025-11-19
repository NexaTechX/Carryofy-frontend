import { ReactNode } from 'react';
import clsx from 'clsx';

interface AdminCardProps {
  title?: string;
  eyebrow?: string;
  description?: string;
  footer?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function AdminCard({
  title,
  eyebrow,
  description,
  footer,
  actions,
  children,
  className,
  contentClassName,
}: AdminCardProps) {
  return (
    <section
      className={clsx(
        'flex flex-col gap-4 rounded-2xl border border-[#1f1f1f] bg-[#111111] p-6 shadow-[0_18px_38px_-24px_rgba(0,0,0,0.6)] transition hover:border-primary/30',
        className
      )}
    >
      {(title || eyebrow || actions) && (
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {eyebrow ? (
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                {eyebrow}
              </span>
            ) : null}
            {title ? <h3 className="text-lg font-semibold text-white">{title}</h3> : null}
            {description ? <p className="mt-1 text-sm text-gray-400">{description}</p> : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </header>
      )}

      {children ? (
        <div className={clsx('flex flex-1 flex-col gap-4', contentClassName)}>{children}</div>
      ) : null}

      {footer ? <footer className="border-t border-[#1f1f1f] pt-4 text-xs text-gray-500">{footer}</footer> : null}
    </section>
  );
}


