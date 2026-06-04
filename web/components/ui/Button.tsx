import React from 'react';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const base =
  'btn-mobile inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 ' +
  'disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none';

const variants: Record<Variant, string> = {
  primary:
    'bg-primary text-black hover:bg-primary-dark shadow-[0_8px_20px_-8px_rgba(255,107,0,0.6)] hover:shadow-[0_10px_26px_-8px_rgba(255,107,0,0.7)] active:translate-y-px',
  secondary:
    'border border-primary/40 text-primary hover:bg-primary/10 hover:border-primary/70',
  ghost:
    'text-foreground/80 hover:text-foreground hover:bg-[color-mix(in_srgb,var(--color-foreground)_10%,transparent)]',
  danger:
    'bg-danger text-white hover:brightness-110 shadow-[0_8px_20px_-8px_rgba(244,96,79,0.6)] active:translate-y-px',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-xs',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-base',
};

/**
 * Shared button — the single source of truth for primary/secondary/ghost/danger
 * actions across the platform, replacing ad-hoc inline button classNames.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, leftIcon, rightIcon, fullWidth, className = '', children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
});
