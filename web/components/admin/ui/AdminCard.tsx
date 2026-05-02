import { ReactNode } from 'react';
import clsx from 'clsx';

/** Trend vs previous period (e.g. "+12%" or "-3" vs last 30 days). */
export interface AdminCardTrend {
  change: number;
  positiveIsGood?: boolean;
  suffix?: string;
}

interface AdminCardProps {
  title?: string;
  eyebrow?: string;
  description?: string;
  footer?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
  onClick?: () => void;
  accent?: 'primary' | 'cyan' | 'green' | 'red';
  trend?: AdminCardTrend;
  pulseBorder?: boolean;
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
  onClick,
  accent,
  trend,
  pulseBorder,
}: AdminCardProps) {
  const Wrapper = onClick ? 'button' : 'section';
  const trendUp = trend ? trend.change > 0 : false;
  const trendGood = trend
    ? trend.positiveIsGood === undefined
      ? trendUp
      : trend.positiveIsGood
        ? trendUp
        : !trendUp
    : false;
  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={clsx(
        'flex w-full flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6 text-left shadow-sm transition-colors',
        pulseBorder
          ? 'border-amber-500/70 animate-pulse-border'
          : 'border-gray-200',
        onClick && 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-400',
        !onClick && !pulseBorder && 'hover:border-orange-200',
        onClick && accent !== 'red' && 'hover:border-orange-200',
        onClick && accent === 'red' && 'hover:border-red-200',
        className
      )}
    >
      {(title || eyebrow || actions) && (
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {eyebrow ? (
              <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
                {eyebrow}
              </span>
            ) : null}
            {title ? <h3 className="text-lg font-semibold text-gray-900">{title}</h3> : null}
            {description ? <p className="mt-1 text-sm text-gray-500">{description}</p> : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </header>
      )}

      {children ? (
        <div className={clsx('flex flex-1 flex-col gap-4', contentClassName)}>
          {children}
          {trend != null && (
            <p
              className={clsx(
                'text-xs font-medium',
                trendGood ? 'text-green-500' : 'text-red-500'
              )}
            >
              {trend.change > 0 ? '↑' : '↓'} {Math.abs(trend.change)}
              {trend.suffix != null && String(trend.suffix).trim().startsWith(' vs ')
                ? trend.suffix
                : `${trend.suffix ?? '%'} vs last 30 days`}
            </p>
          )}
        </div>
      ) : null}

      {footer ? (
        <footer className="border-t border-gray-100 pt-4 text-xs text-gray-500">{footer}</footer>
      ) : null}
    </Wrapper>
  );
}
