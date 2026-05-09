import { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import clsx from 'clsx';

interface AdminErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
  children?: ReactNode;
}

export function AdminErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try again',
  className,
  children,
}: AdminErrorStateProps) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center gap-4 rounded-2xl border border-border-custom bg-card px-6 py-16 text-center',
        className,
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <div className="max-w-md space-y-2">
        <p className="font-heading text-base font-semibold text-foreground">{title}</p>
        {message ? <p className="text-sm leading-relaxed text-gray-400">{message}</p> : null}
      </div>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-xl border border-primary bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/20"
        >
          {retryLabel}
        </button>
      ) : null}
      {children}
    </div>
  );
}
