import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';

export interface StatMetricCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  /** e.g. "vs yesterday" */
  comparison?: string;
  /** When set, shows green/red/gray arrow line */
  trendPct?: number | null;
  positiveIsGood?: boolean;
  loading?: boolean;
  href?: string;
  className?: string;
}

export function StatMetricCard({
  label,
  value,
  icon: Icon,
  comparison,
  trendPct,
  positiveIsGood = true,
  loading,
  href,
  className,
}: StatMetricCardProps) {
  const trendUp = trendPct != null && trendPct > 0;
  const trendZero = trendPct === 0;
  const trendGood =
    trendPct == null || trendZero
      ? null
      : positiveIsGood
        ? trendUp
        : !trendUp;

  const body = (
    <>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-50">
          <Icon className="h-5 w-5 text-orange-500" strokeWidth={2} aria-hidden />
        </div>
        <p className="min-w-0 flex-1 text-sm text-gray-500">{label}</p>
      </div>
      {loading ? (
        <div className="h-9 w-28 animate-pulse rounded bg-gray-100" />
      ) : (
        <p className="text-3xl font-bold tracking-tight text-gray-900">{value}</p>
      )}
      <div className="mt-auto flex min-h-[1.25rem] flex-wrap items-center gap-x-2 gap-y-1">
        {comparison ? <p className="text-xs text-gray-400">{comparison}</p> : null}
        {trendPct != null && !trendZero && !loading && trendGood != null ? (
          <p className={cn('text-xs font-medium', trendGood ? 'text-green-500' : 'text-red-500')}>
            {trendUp ? '↑' : '↓'} {Math.abs(trendPct)}%
          </p>
        ) : null}
        {trendZero && !loading ? <p className="text-xs text-gray-400">—</p> : null}
      </div>
    </>
  );

  const cardClass = cn(
    'flex min-h-[120px] flex-col gap-3 rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-colors',
    href && 'hover:border-orange-200 hover:bg-orange-50/30',
    className
  );

  if (href) {
    return (
      <Link href={href} className={cn(cardClass, 'flex flex-col items-stretch')}>
        {body}
      </Link>
    );
  }

  return <div className={cn(cardClass, 'items-stretch')}>{body}</div>;
}
