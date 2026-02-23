'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

export type DatePreset = 'today' | '7d' | '30d' | '3m' | '1y' | 'custom';

export interface DateRange {
  startDate: string;
  endDate: string;
  preset: DatePreset;
}

function getPresetRange(preset: DatePreset): { start: string; end: string } {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const end = today.toISOString().split('T')[0];

  switch (preset) {
    case 'today': {
      const start = new Date(today);
      return { start: start.toISOString().split('T')[0], end };
    }
    case '7d': {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      return { start: start.toISOString().split('T')[0], end };
    }
    case '30d': {
      const start = new Date(today);
      start.setDate(start.getDate() - 29);
      return { start: start.toISOString().split('T')[0], end };
    }
    case '3m': {
      const start = new Date(today);
      start.setMonth(start.getMonth() - 2);
      return { start: start.toISOString().split('T')[0], end };
    }
    case '1y': {
      const start = new Date(today);
      start.setFullYear(start.getFullYear() - 1);
      start.setDate(start.getDate() + 1);
      return { start: start.toISOString().split('T')[0], end };
    }
    default:
      return { start: '', end: '' };
  }
}

function getPresetLabel(preset: DatePreset, startDate: string, endDate: string): string {
  if (preset === 'custom' && startDate && endDate) {
    const s = new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const e = new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${s} – ${e}`;
  }
  const labels: Record<DatePreset, string> = {
    today: 'Today',
    '7d': 'Last 7 days',
    '30d': 'Last 30 days',
    '3m': 'Last 3 months',
    '1y': 'Last year',
    custom: 'Select date range',
  };
  return labels[preset];
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const PRESETS: { key: DatePreset; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: '3m', label: 'Last 3 months' },
  { key: '1y', label: 'Last year' },
  { key: 'custom', label: 'Custom range' },
];

export default function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [customStart, setCustomStart] = useState(value.startDate || '');
  const [customEnd, setCustomEnd] = useState(value.endDate || '');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handlePreset = (preset: DatePreset) => {
    if (preset === 'custom') {
      setCustomStart(value.startDate || '');
      setCustomEnd(value.endDate || '');
      onChange({ ...value, preset: 'custom' });
      return;
    }
    const { start, end } = getPresetRange(preset);
    onChange({ startDate: start, endDate: end, preset });
    setOpen(false);
  };

  const handleCustomApply = () => {
    if (customStart && customEnd && customStart <= customEnd) {
      onChange({ startDate: customStart, endDate: customEnd, preset: 'custom' });
      setOpen(false);
    }
  };

  const displayLabel = getPresetLabel(value.preset, value.startDate, value.endDate);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-10 min-w-[180px] items-center justify-between gap-2 rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] px-4 text-left text-sm text-white transition hover:border-[#3A3A3A] focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
        style={{ height: 40 }}
      >
        <span className="flex items-center gap-2">
          <Calendar className="h-4 w-4 shrink-0 text-[#FF6B00]" />
          {displayLabel}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-[#A0A0A0] transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-[360px] rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] p-4 shadow-xl">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => handlePreset(key)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  value.preset === key
                    ? 'bg-[#FF6B00]/20 text-[#FF6B00]'
                    : 'text-[#A0A0A0] hover:bg-[#2A2A2A] hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {value.preset === 'custom' && (
            <div className="mt-4 flex gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-xs text-[#A0A0A0]">Start</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full rounded-lg border border-[#2A2A2A] bg-[#111111] px-3 py-2 text-sm text-white focus:border-[#FF6B00] focus:outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-xs text-[#A0A0A0]">End</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full rounded-lg border border-[#2A2A2A] bg-[#111111] px-3 py-2 text-sm text-white focus:border-[#FF6B00] focus:outline-none"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleCustomApply}
                  disabled={!customStart || !customEnd || customStart > customEnd}
                  className="rounded-lg bg-[#FF6B00] px-4 py-2 text-sm font-medium text-black disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#E65100]"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
