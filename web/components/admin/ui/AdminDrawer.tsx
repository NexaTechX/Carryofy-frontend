import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';

interface AdminDrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function AdminDrawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
}: AdminDrawerProps) {
  useEffect(() => {
    if (!open) return;

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeydown);
    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <aside
        className={clsx(
          'relative ml-auto flex h-full w-full max-w-md flex-col border-l border-[#1f1f1f] bg-[#0b1018] shadow-[0_20px_42px_-18px_rgba(0,0,0,0.6)]',
          className
        )}
      >
        <header className="flex items-start justify-between border-b border-[#1f1f1f] px-6 py-5">
          <div>
            {title ? <h2 className="text-lg font-semibold text-white">{title}</h2> : null}
            {description ? <p className="mt-1 text-sm text-gray-400">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#2a2a2a] p-1.5 text-gray-500 transition hover:border-primary hover:text-primary"
            aria-label="Close drawer"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer ? <footer className="border-t border-[#1f1f1f] px-6 py-4">{footer}</footer> : null}
      </aside>
    </div>
  );
}


