import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

export interface DataFreshnessIndicatorProps {
  /** Timestamp (ms) when data was last fetched */
  lastUpdatedAt: number | undefined;
  /** Callback when user clicks refresh */
  onRefresh: () => void;
  /** Whether a refresh is currently in progress */
  isRefreshing?: boolean;
  className?: string;
}

function formatSecondsAgo(ms: number): string {
  const seconds = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (seconds < 5) return 'Just now';
  if (seconds < 60) return `${seconds} seconds ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes === 1) return '1 minute ago';
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return '1 hour ago';
  return `${hours} hours ago`;
}

export function DataFreshnessIndicator({
  lastUpdatedAt,
  onRefresh,
  isRefreshing = false,
  className = '',
}: DataFreshnessIndicatorProps) {
  const [label, setLabel] = useState<string>(
    lastUpdatedAt != null ? formatSecondsAgo(lastUpdatedAt) : 'Never'
  );

  useEffect(() => {
    if (lastUpdatedAt == null) {
      setLabel('Never');
      return;
    }
    setLabel(formatSecondsAgo(lastUpdatedAt));
    const interval = setInterval(() => {
      setLabel(formatSecondsAgo(lastUpdatedAt));
    }, 5000);
    return () => clearInterval(interval);
  }, [lastUpdatedAt]);

  return (
    <div
      className={`flex items-center gap-3 text-xs text-gray-500 ${className}`}
      role="status"
      aria-live="polite"
    >
      <span>Last updated: {label}</span>
      <button
        type="button"
        onClick={() => onRefresh()}
        disabled={isRefreshing}
        className="rounded-lg p-1.5 text-gray-400 transition hover:bg-[#1f1f1f] hover:text-white disabled:opacity-50"
        title="Refresh now"
        aria-label="Refresh data"
      >
        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
}
