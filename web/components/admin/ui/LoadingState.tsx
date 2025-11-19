import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

interface LoadingStateProps {
  label?: string;
  className?: string;
  fullscreen?: boolean;
}

export function LoadingState({ label = 'Loading admin data…', className, fullscreen = false }: LoadingStateProps) {
  return (
    <div
      className={clsx(
        'flex items-center justify-center gap-3 text-sm text-gray-300',
        fullscreen ? 'min-h-[60vh]' : 'py-8',
        className
      )}
    >
      <Loader2 className="h-5 w-5 animate-spin text-primary" />
      <span>{label}</span>
    </div>
  );
}


