import { useState, useEffect } from 'react';
import { ShoppingBag, Megaphone, Truck, ChevronDown, ChevronUp, X } from 'lucide-react';
import type { BroadcastAudience, AudienceFilters, AudienceCount } from '../../../lib/admin/types';
import { getAudienceCount } from '../../../lib/admin/api';
import { useQuery } from '@tanstack/react-query';

interface AudienceSelectorProps {
  selected: BroadcastAudience[];
  filters?: AudienceFilters;
  onSelect: (audience: BroadcastAudience[]) => void;
  onFiltersChange: (filters: AudienceFilters) => void;
}

const AUDIENCE_CONFIG = {
  BUYER: {
    label: 'Buyers',
    icon: ShoppingBag,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
  },
  SELLER: {
    label: 'Sellers',
    icon: Megaphone,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
  },
  RIDER: {
    label: 'Riders',
    icon: Truck,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
  },
} as const;

export default function AudienceSelector({
  selected,
  filters = {},
  onSelect,
  onFiltersChange,
}: AudienceSelectorProps) {
  const [expanded, setExpanded] = useState<Record<BroadcastAudience, boolean>>({
    BUYER: false,
    SELLER: false,
    RIDER: false,
  });

  // Fetch audience counts with current filters
  const { data: counts, isLoading: countsLoading } = useQuery<AudienceCount>({
    queryKey: ['broadcast', 'audience-count', selected, filters],
    queryFn: () => getAudienceCount(selected, filters),
    enabled: selected.length > 0,
  });

  const toggleAudience = (audience: BroadcastAudience) => {
    if (selected.includes(audience)) {
      onSelect(selected.filter((a) => a !== audience));
    } else {
      onSelect([...selected, audience]);
    }
  };

  const toggleExpanded = (audience: BroadcastAudience) => {
    setExpanded((prev) => ({ ...prev, [audience]: !prev[audience] }));
  };

  const updateFilter = <K extends keyof AudienceFilters>(
    role: K,
    filterKey: string,
    value: any,
  ) => {
    onFiltersChange({
      ...filters,
      [role]: {
        ...(filters[role] || {}),
        [filterKey]: value,
      },
    });
  };

  const clearFilter = (role: BroadcastAudience, filterKey: string) => {
    const roleFilters = filters[role as keyof AudienceFilters];
    if (!roleFilters) return;

    const updated = { ...roleFilters };
    delete (updated as any)[filterKey];

    onFiltersChange({
      ...filters,
      [role]: Object.keys(updated).length > 0 ? updated : undefined,
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {(Object.keys(AUDIENCE_CONFIG) as BroadcastAudience[]).map((audience) => {
          const config = AUDIENCE_CONFIG[audience];
          const Icon = config.icon;
          const isSelected = selected.includes(audience);
          const count = counts?.[audience] ?? 0;
          const isExpanded = expanded[audience];

          return (
            <div key={audience}>
              <button
                type="button"
                onClick={() => toggleAudience(audience)}
                className={`group w-full flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all ${
                  isSelected
                    ? `${config.borderColor} ${config.bgColor} ring-1 ring-primary/20`
                    : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <div className={`rounded-lg p-2 ${isSelected ? 'bg-primary/10' : 'bg-white/[0.04]'}`}>
                    <Icon className={`h-5 w-5 ${isSelected ? 'text-primary' : config.color}`} />
                  </div>
                  <div className="flex items-center gap-2">
                    {countsLoading ? (
                      <span className="text-xs text-gray-500">Loading...</span>
                    ) : (
                      <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                        {count.toLocaleString()}
                      </span>
                    )}
                    {isSelected ? (
                      <div className="h-5 w-5 rounded bg-primary/20 flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      </div>
                    ) : (
                      <div className="h-5 w-5 rounded border border-gray-600" />
                    )}
                  </div>
                </div>
                <div>
                  <p className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                    {config.label}
                  </p>
                </div>
              </button>

              {/* Sub-filters */}
              {isSelected && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => toggleExpanded(audience)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-400 hover:text-gray-300 rounded-lg hover:bg-white/[0.02] transition-colors"
                  >
                    <span>Advanced filters</span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="mt-2 p-3 rounded-lg border border-white/[0.06] bg-white/[0.02] space-y-3">
                      {audience === 'BUYER' && (
                        <>
                          <label className="flex items-center gap-2 text-xs text-gray-300">
                            <input
                              type="checkbox"
                              checked={filters.buyer?.newUsers || false}
                              onChange={(e) => updateFilter('buyer', 'newUsers', e.target.checked)}
                              className="rounded border-white/[0.08]"
                            />
                            <span>New users (≤30 days)</span>
                          </label>
                          <label className="flex items-center gap-2 text-xs text-gray-300">
                            <input
                              type="checkbox"
                              checked={filters.buyer?.activeBuyers || false}
                              onChange={(e) => updateFilter('buyer', 'activeBuyers', e.target.checked)}
                              className="rounded border-white/[0.08]"
                            />
                            <span>Active buyers</span>
                          </label>
                          <label className="flex items-center gap-2 text-xs text-gray-300">
                            <input
                              type="checkbox"
                              checked={filters.buyer?.b2bBuyers || false}
                              onChange={(e) => updateFilter('buyer', 'b2bBuyers', e.target.checked)}
                              className="rounded border-white/[0.08]"
                            />
                            <span>B2B buyers</span>
                          </label>
                          <div>
                            <input
                              type="text"
                              placeholder="City (optional)"
                              value={filters.buyer?.city || ''}
                              onChange={(e) => updateFilter('buyer', 'city', e.target.value)}
                              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:border-primary/50 focus:outline-none"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              placeholder="State (optional)"
                              value={filters.buyer?.state || ''}
                              onChange={(e) => updateFilter('buyer', 'state', e.target.value)}
                              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:border-primary/50 focus:outline-none"
                            />
                          </div>
                        </>
                      )}

                      {audience === 'SELLER' && (
                        <>
                          <label className="flex items-center gap-2 text-xs text-gray-300">
                            <input
                              type="checkbox"
                              checked={filters.seller?.verified || false}
                              onChange={(e) => updateFilter('seller', 'verified', e.target.checked)}
                              className="rounded border-white/[0.08]"
                            />
                            <span>Verified sellers only</span>
                          </label>
                          <div>
                            <input
                              type="text"
                              placeholder="Category IDs (comma-separated)"
                              value={filters.seller?.categories?.join(', ') || ''}
                              onChange={(e) => {
                                const categories = e.target.value
                                  .split(',')
                                  .map((c) => c.trim())
                                  .filter(Boolean);
                                updateFilter('seller', 'categories', categories.length > 0 ? categories : undefined);
                              }}
                              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:border-primary/50 focus:outline-none"
                            />
                          </div>
                          <div>
                            <input
                              type="number"
                              placeholder="Newly approved products (days)"
                              value={filters.seller?.newlyApprovedProductsDays || ''}
                              onChange={(e) => {
                                const days = e.target.value ? parseInt(e.target.value, 10) : undefined;
                                updateFilter('seller', 'newlyApprovedProductsDays', days);
                              }}
                              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:border-primary/50 focus:outline-none"
                            />
                          </div>
                        </>
                      )}

                      {audience === 'RIDER' && (
                        <>
                          <label className="flex items-center gap-2 text-xs text-gray-300">
                            <input
                              type="checkbox"
                              checked={filters.rider?.activeOnly || false}
                              onChange={(e) => updateFilter('rider', 'activeOnly', e.target.checked)}
                              className="rounded border-white/[0.08]"
                            />
                            <span>Active riders only</span>
                          </label>
                          <label className="flex items-center gap-2 text-xs text-gray-300">
                            <input
                              type="checkbox"
                              checked={filters.rider?.onlineLast7Days || false}
                              onChange={(e) => updateFilter('rider', 'onlineLast7Days', e.target.checked)}
                              className="rounded border-white/[0.08]"
                            />
                            <span>Online in last 7 days</span>
                          </label>
                          <div>
                            <input
                              type="text"
                              placeholder="City (optional)"
                              value={filters.rider?.city || ''}
                              onChange={(e) => updateFilter('rider', 'city', e.target.value)}
                              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:border-primary/50 focus:outline-none"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Active filter chips */}
      {(filters.buyer || filters.seller || filters.rider) && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(filters).map(([role, roleFilters]) => {
            if (!roleFilters) return null;
            return Object.entries(roleFilters).map(([key, value]) => {
              if (!value || (Array.isArray(value) && value.length === 0)) return null;
              return (
                <div
                  key={`${role}-${key}`}
                  className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs text-primary border border-primary/20"
                >
                  <span className="capitalize">{role}</span>
                  <span className="text-gray-400">•</span>
                  <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <button
                    type="button"
                    onClick={() => clearFilter(role as BroadcastAudience, key)}
                    className="ml-1 hover:text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            });
          })}
        </div>
      )}
    </div>
  );
}
