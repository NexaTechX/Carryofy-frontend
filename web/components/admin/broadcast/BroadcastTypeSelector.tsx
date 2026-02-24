import { Rocket, Tag, Settings, AlertCircle, Bell, RotateCcw, Sparkles } from 'lucide-react';
import type { BroadcastType } from '../../../lib/admin/types';

interface BroadcastTypeSelectorProps {
  selected: BroadcastType | null;
  onSelect: (type: BroadcastType) => void;
  lastUsedAt?: Record<BroadcastType, string | null>;
  recommendedType?: BroadcastType | null;
  onQuickSend?: (type: BroadcastType) => void;
}

const TYPE_CONFIG: Record<BroadcastType, {
  label: string;
  description: string;
  icon: typeof Rocket;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  PRODUCT_LAUNCH: {
    label: 'Product Launch',
    description: 'Announce new products',
    icon: Rocket,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
  },
  PROMOTION: {
    label: 'Promotion / Campaign',
    description: 'Sales, discounts, special offers',
    icon: Tag,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
  },
  SYSTEM_UPDATE: {
    label: 'System Update',
    description: 'Platform updates and improvements',
    icon: Settings,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
  },
  OPERATIONAL_NOTICE: {
    label: 'Operational Notice',
    description: 'Important operational information',
    icon: Bell,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
  },
  URGENT_ALERT: {
    label: 'Urgent Alert',
    description: 'Critical alerts requiring immediate attention',
    icon: AlertCircle,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
  },
};

function formatLastUsed(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

export default function BroadcastTypeSelector({
  selected,
  onSelect,
  lastUsedAt = {} as Record<BroadcastType, string | null>,
  recommendedType = null,
  onQuickSend,
}: BroadcastTypeSelectorProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {(Object.keys(TYPE_CONFIG) as BroadcastType[]).map((type) => {
        const config = TYPE_CONFIG[type];
        const Icon = config.icon;
        const isSelected = selected === type;
        const lastUsed = lastUsedAt[type];
        const isRecommended = recommendedType === type;
        const canQuickSend = !!onQuickSend && !!lastUsed;

        return (
          <div key={type} className="relative">
            <button
              type="button"
              onClick={() => onSelect(type)}
              className={`group flex w-full flex-col items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                isSelected
                  ? `border-[var(--color-primary)]/60 bg-[var(--color-primary)]/[0.08] shadow-[0_0_0_1px_var(--color-primary)] ${config.borderColor}`
                  : 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex w-full items-start justify-between gap-2">
                <div className={`rounded-lg p-2 ${isSelected ? 'bg-primary/10' : 'bg-white/[0.04]'}`}>
                  <Icon className={`h-5 w-5 ${isSelected ? 'text-primary' : config.color}`} />
                </div>
                <div className="flex flex-wrap items-center justify-end gap-1.5">
                  {lastUsed && (
                    <span className="rounded-md bg-white/[0.08] px-2 py-0.5 text-[10px] text-gray-400" title={`Last used ${formatLastUsed(lastUsed)}`}>
                      Last used {formatLastUsed(lastUsed)}
                    </span>
                  )}
                  {isRecommended && (
                    <span className="flex items-center gap-0.5 rounded-md bg-[var(--color-primary)]/15 px-2 py-0.5 text-[10px] text-[var(--color-primary)]">
                      <Sparkles className="h-3 w-3" />
                      Recommended
                    </span>
                  )}
                </div>
              </div>
              <div className="w-full">
                <p className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                  {config.label}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">{config.description}</p>
              </div>
              {isSelected && (
                <div className="absolute right-3 top-3 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-white" />
                </div>
              )}
            </button>
            {canQuickSend && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickSend(type);
                }}
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02] py-1.5 text-xs text-gray-400 transition hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-primary)]/5 hover:text-[var(--color-primary)]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Send again with last settings
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
