'use client';

import { Users, Mail, FileText, Send } from 'lucide-react';
import { CheckCircle2 } from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Audience', icon: Users },
  { id: 2, label: 'Targeting', icon: Users },
  { id: 3, label: 'Channels', icon: Mail },
  { id: 4, label: 'Message', icon: FileText },
  { id: 5, label: 'Review', icon: Send },
] as const;

export type StepCompletion = {
  stepId: number;
  percent: number; // 0–100
};

interface BroadcastProgressBarProps {
  currentStep: number;
  stepCompletions: StepCompletion[];
  onStepClick?: (stepId: number) => void;
}

function formatPercent(percent: number): string {
  return `${Math.round(percent)}%`;
}

export default function BroadcastProgressBar({
  currentStep,
  stepCompletions,
  onStepClick,
}: BroadcastProgressBarProps) {
  const totalPercent =
    stepCompletions.length > 0
      ? stepCompletions.reduce((acc, s) => acc + s.percent, 0) / stepCompletions.length
      : 0;
  const currentCompletion = stepCompletions[currentStep - 1]?.percent ?? 0;
  const overallPercent = Math.min(
    100,
    Math.round((currentStep - 1) * 20 + currentCompletion * 0.2)
  );

  return (
    <div className="sticky top-0 z-20 -mx-4 -mt-2 mb-6 rounded-b-xl border-b border-white/[0.06] bg-[#090c11]/95 px-4 pb-4 pt-3 backdrop-blur-sm sm:-mx-6 sm:px-6 lg:-mx-12 lg:px-12">
      {/* Overall progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
          <span>Progress</span>
          <span className="font-medium text-primary">{formatPercent(overallPercent)}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${Math.min(100, overallPercent)}%` }}
          />
        </div>
      </div>

      {/* Step pills with per-step completion */}
      <div className="flex items-center gap-1 sm:gap-2">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          const isClickable = onStepClick && (isCompleted || isActive);
          const completion = stepCompletions.find((s) => s.stepId === step.id);
          const percent = completion?.percent ?? 0;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => isClickable && onStepClick?.(step.id)}
              className={`group relative flex flex-1 min-w-0 items-center gap-2 rounded-xl border px-2 py-2.5 transition-all duration-200 sm:px-3 ${
                isActive
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 shadow-[0_0_0_1px_var(--color-primary),0_0_12px_rgba(255,107,0,0.15)]'
                  : isCompleted
                  ? 'border-[var(--color-primary)]/50 bg-[var(--color-primary)]/5 hover:border-[var(--color-primary)]/70'
                  : 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.12]'
              } ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <span
                className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-colors ${
                  isActive
                    ? 'bg-[var(--color-primary)] text-white'
                    : isCompleted
                    ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)]'
                    : 'bg-white/[0.06] text-gray-500'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : ''}`} />
                )}
              </span>
              <div className="hidden min-w-0 flex-1 sm:block">
                <span
                  className={`block truncate text-xs font-medium ${
                    isActive ? 'text-white' : isCompleted ? 'text-[var(--color-primary)]' : 'text-gray-500'
                  }`}
                >
                  {step.label}
                </span>
                <span
                  className={`block text-[10px] ${
                    isActive ? 'text-[var(--color-primary)]' : isCompleted ? 'text-gray-400' : 'text-gray-500'
                  }`}
                >
                  {isActive ? formatPercent(percent) : isCompleted ? 'Done' : formatPercent(percent)}
                </span>
              </div>
              {/* Animated pulse for active step */}
              {isActive && (
                <span
                  className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-[var(--color-primary)] opacity-90 animate-ping"
                  aria-hidden
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { STEPS as BROADCAST_STEPS };
