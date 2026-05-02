import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-orange-500 text-white hover:bg-orange-600 rounded-lg px-4 py-2 font-medium text-sm transition-colors duration-150',
  secondary:
    'border border-orange-500 text-orange-500 bg-white hover:bg-orange-50 rounded-lg px-4 py-2 font-medium text-sm transition-colors duration-150',
  danger:
    'bg-red-500 text-white hover:bg-red-600 rounded-lg px-4 py-2 font-medium text-sm transition-colors duration-150',
  ghost:
    'text-gray-600 hover:bg-gray-100 rounded-lg px-4 py-2 font-medium text-sm transition-colors duration-150',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled}
      className={cn(
        variants[variant],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      {...props}
    />
  )
);
Button.displayName = 'Button';
