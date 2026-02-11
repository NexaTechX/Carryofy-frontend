import { Rocket, Tag, Settings, AlertCircle, Bell } from 'lucide-react';
import type { BroadcastType } from '../../../lib/admin/types';

interface BroadcastTypeSelectorProps {
  selected: BroadcastType | null;
  onSelect: (type: BroadcastType) => void;
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

export default function BroadcastTypeSelector({ selected, onSelect }: BroadcastTypeSelectorProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {(Object.keys(TYPE_CONFIG) as BroadcastType[]).map((type) => {
        const config = TYPE_CONFIG[type];
        const Icon = config.icon;
        const isSelected = selected === type;

        return (
          <button
            key={type}
            type="button"
            onClick={() => onSelect(type)}
            className={`group flex flex-col items-start gap-3 rounded-xl border p-4 text-left transition-all ${
              isSelected
                ? `${config.borderColor} ${config.bgColor} ring-1 ring-primary/20`
                : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]'
            }`}
          >
            <div className="flex w-full items-center justify-between">
              <div className={`rounded-lg p-2 ${isSelected ? 'bg-primary/10' : 'bg-white/[0.04]'}`}>
                <Icon className={`h-5 w-5 ${isSelected ? 'text-primary' : config.color}`} />
              </div>
              {isSelected && (
                <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-white" />
                </div>
              )}
            </div>
            <div>
              <p className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                {config.label}
              </p>
              <p className="mt-0.5 text-xs text-gray-500">{config.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
