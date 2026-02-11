import { useState } from 'react';
import { Clock, Zap } from 'lucide-react';
import type { Scheduling, RateLimit } from '../../../lib/admin/types';

interface SchedulingPanelProps {
  scheduling?: Scheduling;
  rateLimit?: RateLimit;
  onSchedulingChange: (scheduling: Scheduling) => void;
  onRateLimitChange: (rateLimit: RateLimit) => void;
}

export default function SchedulingPanel({
  scheduling = { sendNow: true },
  rateLimit = {},
  onSchedulingChange,
  onRateLimitChange,
}: SchedulingPanelProps) {
  const [localScheduledFor, setLocalScheduledFor] = useState(
    scheduling?.scheduledFor
      ? new Date(scheduling.scheduledFor).toISOString().slice(0, 16)
      : '',
  );
  const [localTimezone, setLocalTimezone] = useState(scheduling?.timezone || 'Africa/Lagos');

  const handleSendNowChange = (sendNow: boolean) => {
    onSchedulingChange({
      sendNow,
      scheduledFor: sendNow ? undefined : localScheduledFor || undefined,
      timezone: sendNow ? undefined : localTimezone,
    });
  };

  const handleScheduledForChange = (value: string) => {
    setLocalScheduledFor(value);
    if (!scheduling?.sendNow) {
      onSchedulingChange({
        sendNow: false,
        scheduledFor: value || undefined,
        timezone: localTimezone,
      });
    }
  };

  const handleTimezoneChange = (value: string) => {
    setLocalTimezone(value);
    if (!scheduling?.sendNow) {
      onSchedulingChange({
        sendNow: false,
        scheduledFor: localScheduledFor || undefined,
        timezone: value,
      });
    }
  };

  const handleRateLimitChange = (value: string) => {
    const usersPerMinute = value ? parseInt(value, 10) : undefined;
    onRateLimitChange({ usersPerMinute });
  };

  return (
    <div className="space-y-6">
      {/* Send timing */}
      <div>
        <label className="mb-3 block text-sm font-medium text-gray-300">Send timing</label>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="radio"
              checked={scheduling?.sendNow !== false}
              onChange={() => handleSendNowChange(true)}
              className="h-4 w-4 text-primary border-white/[0.08] focus:ring-primary/30"
            />
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm text-gray-300">Send now</span>
            </div>
          </label>
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="radio"
              checked={scheduling?.sendNow === false}
              onChange={() => handleSendNowChange(false)}
              className="h-4 w-4 text-primary border-white/[0.08] focus:ring-primary/30"
            />
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-300">Schedule for later</span>
            </div>
          </label>
        </div>

        {scheduling?.sendNow === false && (
          <div className="mt-4 space-y-3 p-4 rounded-lg border border-white/[0.06] bg-white/[0.02]">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400">Date & Time</label>
              <input
                type="datetime-local"
                value={localScheduledFor}
                onChange={(e) => handleScheduledForChange(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-gray-200 focus:border-primary/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400">Timezone</label>
              <select
                value={localTimezone}
                onChange={(e) => handleTimezoneChange(e.target.value)}
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-gray-200 focus:border-primary/50 focus:outline-none"
              >
                <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Rate limiting */}
      <div>
        <label className="mb-3 block text-sm font-medium text-gray-300">Rate limiting</label>
        <div className="p-4 rounded-lg border border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <label className="text-xs text-gray-400 flex-shrink-0">Send to</label>
            <input
              type="number"
              value={rateLimit?.usersPerMinute || ''}
              onChange={(e) => handleRateLimitChange(e.target.value)}
              placeholder="1000"
              min={1}
              max={10000}
              className="w-24 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-sm text-gray-200 placeholder-gray-500 focus:border-primary/50 focus:outline-none"
            />
            <span className="text-xs text-gray-400">users per minute</span>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Prevents email provider rate limits and spam issues. Leave empty for no limit (not recommended for large audiences).
          </p>
        </div>
      </div>
    </div>
  );
}
