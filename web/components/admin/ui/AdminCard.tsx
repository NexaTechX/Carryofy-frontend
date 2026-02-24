import { ReactNode } from 'react';
import clsx from 'clsx';

/** Trend vs previous period (e.g. "+12%" or "-3" vs last 30 days). */
export interface AdminCardTrend {
  /** Numeric change (can be count or percent). Shown as +X or -X. */
  change: number;
  /** If true, positive change is good (green); otherwise negative is good. */
  positiveIsGood?: boolean;
  /** Optional suffix, e.g. "%" or " vs last 30d". */
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
  /** When set, the card is clickable and links to the filtered view (e.g. stat cards → filter). */
  onClick?: () => void;
  /** Optional accent for the value (e.g. 'red' for issue/failed). */
  accent?: 'primary' | 'cyan' | 'green' | 'red';
  /** Trend vs previous period (e.g. vs last 30 days). */
  trend?: AdminCardTrend;
  /** When true, show an amber pulsing border to draw attention (e.g. pending count > 0). */
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
      : trend.positiveIsGood ? trendUp : !trendUp
    : false;
  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={clsx(
        'flex w-full flex-col gap-4 rounded-2xl border bg-[#111111] p-6 text-left shadow-[0_18px_38px_-24px_rgba(0,0,0,0.6)] transition',
        pulseBorder
          ? 'border-amber-500/70 animate-pulse-border'
          : 'border-[#1f1f1f]',
        onClick && 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40',
        !onClick && !pulseBorder && 'hover:border-primary/30',
        onClick && accent !== 'red' && 'hover:border-primary/30',
        onClick && accent === 'red' && 'hover:border-red-500/30',
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
        <div className={clsx('flex flex-1 flex-col gap-4', contentClassName)}>
          {children}
          {trend != null && (
            <p
              className={clsx(
                'text-xs font-medium',
                trendGood ? 'text-emerald-400' : 'text-rose-400'
              )}
            >
              {trend.change > 0 ? '+' : ''}
              {trend.change}
              {trend.suffix != null && String(trend.suffix).trim().startsWith(' vs ')
                ? trend.suffix
                : `${trend.suffix ?? '%'} vs last 30 days`}
            </p>
          )}
        </div>
      ) : null}

      {footer ? <footer className="border-t border-[#1f1f1f] pt-4 text-xs text-gray-500">{footer}</footer> : null}
    </Wrapper>
  );
}


