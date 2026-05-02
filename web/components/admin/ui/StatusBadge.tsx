import clsx from 'clsx';

type StatusTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

interface StatusBadgeProps {
  tone?: StatusTone;
  label: string;
  className?: string;
}

const toneStyles: Record<StatusTone, string> = {
  neutral: 'bg-gray-100 text-gray-600',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-orange-100 text-orange-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-gray-100 text-gray-700',
};

export function StatusBadge({ tone = 'neutral', label, className }: StatusBadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        toneStyles[tone],
        className
      )}
    >
      {label}
    </span>
  );
}
