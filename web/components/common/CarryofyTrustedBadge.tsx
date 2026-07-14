import Image from 'next/image';

type CarryofyTrustedBadgeProps = {
  /** Compact for tight product-card corners; default is highly visible. */
  size?: 'sm' | 'md';
  className?: string;
};

/**
 * Carryofy trust mark: logo + "Trusted" with a static orange glow
 * so it reads clearly on dark cards and product photography.
 */
export default function CarryofyTrustedBadge({
  size = 'md',
  className = '',
}: CarryofyTrustedBadgeProps) {
  const isSm = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-primary/55 bg-[#0a0c10]/92 ${
        isSm ? 'px-1.5 py-0.5' : 'px-2 py-1 sm:gap-2 sm:px-2.5 sm:py-1.5'
      } ${className}`}
      style={{
        boxShadow:
          '0 0 0 1px rgba(255, 107, 0, 0.35), 0 0 14px rgba(255, 107, 0, 0.55), 0 0 28px rgba(255, 107, 0, 0.28)',
      }}
      title="Carryofy Trusted seller"
    >
      <Image
        src="/logo.png"
        alt=""
        width={isSm ? 14 : 18}
        height={isSm ? 14 : 18}
        className={`shrink-0 object-contain ${isSm ? 'h-3.5 w-3.5' : 'h-4 w-4 sm:h-[18px] sm:w-[18px]'}`}
        style={{
          filter:
            'drop-shadow(0 0 4px rgba(255, 107, 0, 0.95)) drop-shadow(0 0 10px rgba(255, 107, 0, 0.7))',
        }}
        aria-hidden
      />
      <span
        className={`font-bold uppercase tracking-[0.12em] text-primary ${
          isSm ? 'text-[9px]' : 'text-[10px] sm:text-[11px]'
        }`}
        style={{
          textShadow:
            '0 0 8px rgba(255, 107, 0, 0.95), 0 0 16px rgba(255, 107, 0, 0.65), 0 0 2px rgba(255, 158, 64, 1)',
        }}
      >
        Trusted
      </span>
      <span className="sr-only">Carryofy Trusted seller</span>
    </span>
  );
}
