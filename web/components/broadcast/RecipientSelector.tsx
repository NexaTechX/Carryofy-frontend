import { Store, Truck, Users } from 'lucide-react';
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
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold text-gray-900">Recipients</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {OPTIONS.map(({ key, label, Icon }) => {
          const active = selected.includes(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => onToggle(key)}
              className={`rounded-lg border p-3 text-left transition-all duration-150 ease-in ${
                active
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-transparent bg-gray-50 hover:border-gray-200'
              }`}
            >
              <div className="mb-2 flex items-center gap-2">
                <Icon className={`h-4 w-4 ${active ? 'text-orange-600' : 'text-gray-500'}`} />
                <span className="text-sm font-medium text-gray-900">{label}</span>
              </div>
              {isLoading ? (
                <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
              ) : (
                <p className="text-xs text-gray-500">{counts[key].toLocaleString()} users</p>
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-sm text-gray-600">{totalSelected.toLocaleString()} recipients selected</p>
      {error ? (
        <div className="mt-2 inline-flex rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs text-red-700">
          {error}
        </div>
      ) : null}
    </section>
  );
}
