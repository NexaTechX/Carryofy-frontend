'use client';

import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import {
  DateRangePreset,
  DateRangeValue,
  getDateRangeForPreset,
} from '../../lib/admin/dateRange';
import clsx from 'clsx';

interface AnalyticsDateRangeSelectorProps {
  value: DateRangeValue;
  onChange: (range: DateRangeValue) => void;
  className?: string;
}

const PRESETS: { key: DateRangePreset; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: '7D' },
  { key: '30d', label: '30D' },
  { key: '90d', label: '90D' },
  { key: 'custom', label: 'Custom' },
];

export default function AnalyticsDateRangeSelector({
  value,
  onChange,
  className,
}: AnalyticsDateRangeSelectorProps) {
  const [showCustom, setShowCustom] = useState(value.preset === 'custom');
  const [customStart, setCustomStart] = useState(value.startDate);
  const [customEnd, setCustomEnd] = useState(value.endDate);

  useEffect(() => {
    setCustomStart(value.startDate);
    setCustomEnd(value.endDate);
    if (value.preset === 'custom') setShowCustom(true);
  }, [value.startDate, value.endDate, value.preset]);

  const handlePreset = (preset: DateRangePreset) => {
    if (preset === 'custom') {
      setShowCustom(true);
      onChange(getDateRangeForPreset('custom', customStart, customEnd));
    } else {
      setShowCustom(false);
      onChange(getDateRangeForPreset(preset));
    }
  };

  const handleCustomApply = () => {
    onChange(getDateRangeForPreset('custom', customStart, customEnd));
  };

  return (
    <div className={clsx('flex flex-col gap-2', className)}>
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-gray-400" />
        <span className="text-xs font-medium text-gray-400">Date range</span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {PRESETS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => handlePreset(key)}
            className={clsx(
              'rounded-lg px-3 py-1.5 text-sm font-medium transition',
              value.preset === key
                ? 'bg-primary text-white'
                : 'bg-[#1f2534] text-gray-300 hover:bg-[#2a3142]'
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {showCustom && (
        <div className="mt-2 flex flex-wrap items-center gap-3 rounded-lg border border-[#1f2534] bg-[#0f1524] p-3">
          <div>
            <label className="mb-1 block text-xs text-gray-400">From</label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="rounded border border-[#1f2534] bg-[#090c11] px-2 py-1.5 text-sm text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-400">To</label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="rounded border border-[#1f2534] bg-[#090c11] px-2 py-1.5 text-sm text-white"
            />
          </div>
          <button
            type="button"
            onClick={handleCustomApply}
            className="mt-5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}
