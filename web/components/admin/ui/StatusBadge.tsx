import clsx from 'clsx';

type StatusTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

interface StatusBadgeProps {
  tone?: StatusTone;
  label: string;
  className?: string;
}

const toneStyles: Record<StatusTone, string> = {
  neutral: 'border-[#2a2a2a] bg-[#151515] text-gray-300',
  success: 'border-[#1f3a27] bg-[#132019] text-[#6ef2a1]',
  warning: 'border-[#3a2a1f] bg-[#21170f] text-[#ffb169]',
  danger: 'border-[#3a1f1f] bg-[#211010] text-[#ff8484]',
  info: 'border-[#1f303a] bg-[#101d24] text-[#7ecbff]',
};

export function StatusBadge({ tone = 'neutral', label, className }: StatusBadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]',
        toneStyles[tone],
        className
      )}
    >
      {label}
    </span>
  );
}


