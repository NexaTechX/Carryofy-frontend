import { ReactNode } from 'react';
import clsx from 'clsx';

interface AdminToolbarProps {
  children: ReactNode;
  className?: string;
}

export function AdminToolbar({ children, className }: AdminToolbarProps) {
  return (
    <div
      className={clsx(
        'flex flex-wrap items-center gap-3 rounded-2xl border border-[#1f1f1f] bg-[#111111] px-4 py-3 text-sm text-gray-300',
        className
      )}
    >
      {children}
    </div>
  );
}

interface AdminFilterChipProps {
  active?: boolean;
  count?: number;
  children: ReactNode;
  onClick?: () => void;
}

export function AdminFilterChip({ active = false, count, children, onClick }: AdminFilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] transition',
        active
          ? 'border-primary bg-primary text-black'
          : 'border-gray-700 bg-[#151515] text-gray-300 hover:border-primary hover:text-primary'
      )}
    >
      <span>{children}</span>
      {count !== undefined && (
        <span
          className={clsx(
            'min-w-5 rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
            active ? 'bg-black/20 text-black' : 'bg-[#2a2a2a] text-gray-400'
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}


