'use client';

import { useCallback } from 'react';

interface PriceRangeSliderProps {
  min: number;
  max: number;
  low: number;
  high: number;
  onLowChange: (v: number) => void;
  onHighChange: (v: number) => void;
  step?: number;
  formatValue?: (v: number) => string;
}

export default function PriceRangeSlider({
  min,
  max,
  low,
  high,
  onLowChange,
  onHighChange,
  step = 1000,
  formatValue = (v) => `₦${(v / 100).toLocaleString('en-NG', { maximumFractionDigits: 0 })}`,
}: PriceRangeSliderProps) {
  const getPercent = useCallback(
    (v: number) => ((v - min) / (max - min || 1)) * 100,
    [min, max]
  );

  const lowPercent = getPercent(low);
  const highPercent = getPercent(high);

  const handleLowChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.min(Number(e.target.value), high - step);
    onLowChange(v);
  };

  const handleHighChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.max(Number(e.target.value), low + step);
    onHighChange(v);
  };

  return (
    <div className="space-y-3">
      <div className="relative h-8 flex items-center px-1">
        <div className="absolute inset-x-2 h-2.5 rounded-full bg-[#2a2a2a]" />
        <div
          className="absolute h-2.5 rounded-full bg-[#FF6B00]/70 pointer-events-none"
          style={{ left: `${lowPercent}%`, width: `${highPercent - lowPercent}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={low}
          onChange={handleLowChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-[1]"
          aria-label="Minimum price"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={high}
          onChange={handleHighChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-[2]"
          aria-label="Maximum price"
        />
        <div
          className="absolute top-1/2 w-4 h-4 -translate-y-1/2 -translate-x-1/2 rounded-full bg-[#FF6B00] border-2 border-[#111111] shadow-lg pointer-events-none z-10"
          style={{ left: `${lowPercent}%` }}
          aria-hidden
        />
        <div
          className="absolute top-1/2 w-4 h-4 -translate-y-1/2 -translate-x-1/2 rounded-full bg-[#FF6B00] border-2 border-[#111111] shadow-lg pointer-events-none z-10"
          style={{ left: `${highPercent}%` }}
          aria-hidden
        />
      </div>
      <div className="flex justify-between text-sm text-[#ffcc99] font-medium">
        <span>{formatValue(low)}</span>
        <span>{formatValue(high)}</span>
      </div>
    </div>
  );
}
