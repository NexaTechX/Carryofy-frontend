import { Check, Store, Truck, Users } from 'lucide-react';
import type { RecipientKey } from '../../hooks/useBroadcast';

type Props = {
  selected: RecipientKey[];
  counts: { buyers: number; sellers: number; riders: number };
  isLoading: boolean;
  onToggle: (recipient: RecipientKey) => void;
  totalSelected: number;
  error?: string;
};

const OPTIONS: Array<{
  key: RecipientKey;
  label: string;
  Icon: typeof Users;
}> = [
  { key: 'buyers', label: 'Buyers', Icon: Users },
  { key: 'sellers', label: 'Sellers', Icon: Store },
  { key: 'riders', label: 'Riders', Icon: Truck },
];

export function RecipientSelector({
  selected,
  counts,
  isLoading,
  onToggle,
  totalSelected,
  error,
}: Props) {
  return (
    <section className="rounded-lg border border-[#2a2a2a] bg-[#111111] p-4">
      <div className="mb-1 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-white">Recipients</h2>
        <span className="text-xs text-[#9ca3af]">
          {totalSelected.toLocaleString()} total selected
        </span>
      </div>
      <p className="mb-3 text-xs text-[#6b7280]">
        Click a segment to include or exclude it from this broadcast.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {OPTIONS.map(({ key, label, Icon }) => {
          const active = selected.includes(key);
          const count = counts[key];
          return (
            <button
              key={key}
              type="button"
              aria-pressed={active}
              onClick={() => onToggle(key)}
              className={`relative rounded-lg border-2 p-3 text-left transition-all duration-150 ease-in ${
                active
                  ? 'border-[#F97316] bg-[#F97316]/15 ring-2 ring-[#F97316]/30'
                  : 'border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#3a3a3a] hover:bg-[#151515]'
              }`}
            >
              <span
                className={`absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded border ${
                  active
                    ? 'border-[#F97316] bg-[#F97316] text-white'
                    : 'border-[#3a3a3a] bg-[#111111] text-transparent'
                }`}
                aria-hidden
              >
                <Check className="h-3 w-3" />
              </span>

              <div className="mb-2 flex items-center gap-2 pr-6">
                <Icon className={`h-4 w-4 ${active ? 'text-[#F97316]' : 'text-[#9ca3af]'}`} />
                <span className="text-sm font-medium text-white">{label}</span>
              </div>

              {isLoading ? (
                <div className="h-4 w-24 animate-pulse rounded bg-[#2a2a2a]" />
              ) : (
                <>
                  <p className="text-xs text-[#9ca3af]">{count.toLocaleString()} users</p>
                  <p
                    className={`mt-1 text-xs font-medium ${
                      active ? 'text-[#F97316]' : 'text-[#6b7280]'
                    }`}
                  >
                    {active
                      ? `${count.toLocaleString()} of ${count.toLocaleString()} selected`
                      : 'Not selected — click to include'}
                  </p>
                </>
              )}
            </button>
          );
        })}
      </div>

      {error ? (
        <div className="mt-3 inline-flex rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs text-red-300">
          {error}
        </div>
      ) : null}
    </section>
  );
}
