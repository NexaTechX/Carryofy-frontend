import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface LoadFailedStateProps {
  /** What failed to load, e.g. "rewards" — rendered as "We couldn't load your rewards." */
  label: string;
  message?: string | null;
  onRetry: () => void;
  retrying?: boolean;
}

/**
 * Inline error state for buyer pages when a data fetch fails.
 * Ensures a failed request never leaves the page stuck on "Loading…".
 */
export default function LoadFailedState({ label, message, onRetry, retrying = false }: LoadFailedStateProps) {
  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 text-center">
      <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-red-400" />
      <p className="mb-1 font-medium text-white">We couldn&apos;t load your {label}.</p>
      <p className="mb-4 text-sm text-gray-400">
        {message || 'Please check your connection and try again.'}
      </p>
      <button
        type="button"
        onClick={onRetry}
        disabled={retrying}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-black hover:bg-primary/90 disabled:opacity-50"
      >
        <RotateCcw className={`h-4 w-4 ${retrying ? 'animate-spin' : ''}`} />
        {retrying ? 'Retrying…' : 'Retry'}
      </button>
    </div>
  );
}
