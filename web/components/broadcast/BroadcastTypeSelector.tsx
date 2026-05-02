const TYPES = [
  'Product Launch',
  'Promotion / Campaign',
  'System Update',
  'Operational Notice',
  'Urgent Alert',
];

type Props = {
  value: string;
  onChange: (next: string) => void;
};

export function BroadcastTypeSelector({ value, onChange }: Props) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold text-gray-900">Broadcast Type</h2>
      <div className="flex flex-wrap gap-2">
        {TYPES.map((type) => {
          const selected = value === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => onChange(type)}
              className={`inline-flex items-center gap-2 rounded-[20px] border px-3 py-1.5 text-xs transition-all duration-150 ease-in ${
                selected
                  ? 'border-orange-500 bg-orange-500 text-white'
                  : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-orange-200'
              }`}
            >
              {type === 'Urgent Alert' ? <span className="h-2 w-2 rounded-full bg-red-500" /> : null}
              {type}
            </button>
          );
        })}
      </div>
    </section>
  );
}
