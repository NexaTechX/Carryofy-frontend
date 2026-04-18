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
    <section className="rounded-lg border border-[#2a2a2a] bg-[#111111] p-4">
      <h2 className="mb-3 text-sm font-semibold text-white">Broadcast Type</h2>
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
                  ? 'border-[#F97316] bg-[#F97316] text-white'
                  : 'border-[#2a2a2a] bg-[#111111] text-[#9ca3af] hover:border-[#3a3a3a]'
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
