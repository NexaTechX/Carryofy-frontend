type Props = {
  isScheduled: boolean;
  scheduledAt: Date | null;
  onToggle: (value: boolean) => void;
  onChangeDateTime: (value: Date | null) => void;
  error?: string;
};

function toDateValue(date: Date | null): string {
  if (!date) return '';
  return date.toISOString().slice(0, 10);
}

function toTimeValue(date: Date | null): string {
  if (!date) return '';
  return date.toISOString().slice(11, 16);
}

export function SchedulePicker({
  isScheduled,
  scheduledAt,
  onToggle,
  onChangeDateTime,
  error,
}: Props) {
  return (
    <section className="rounded-lg border border-[#2a2a2a] bg-[#111111] p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Schedule</h2>
        <button
          type="button"
          onClick={() => onToggle(!isScheduled)}
          className={`h-6 w-11 rounded-full p-0.5 transition-all duration-150 ease-in ${
            isScheduled ? 'bg-[#F97316]' : 'bg-[#2a2a2a]'
          }`}
        >
          <span
            className={`block h-5 w-5 rounded-full bg-white transition-transform duration-150 ease-in ${
              isScheduled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
      <p className="mt-1 text-xs text-[#9ca3af]">Schedule for later</p>

      {isScheduled ? (
        <div className="mt-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={toDateValue(scheduledAt)}
              onChange={(event) => {
                const nextDate = event.target.value;
                if (!nextDate) return onChangeDateTime(null);
                const [year, month, day] = nextDate.split('-').map(Number);
                const base = scheduledAt ?? new Date();
                const next = new Date(base);
                next.setFullYear(year, month - 1, day);
                onChangeDateTime(next);
              }}
              className="rounded-md border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm text-white focus:border-[#F97316] focus:outline-none"
            />
            <input
              type="time"
              value={toTimeValue(scheduledAt)}
              onChange={(event) => {
                const nextTime = event.target.value;
                if (!nextTime) return;
                const [hours, minutes] = nextTime.split(':').map(Number);
                const base = scheduledAt ?? new Date();
                const next = new Date(base);
                next.setHours(hours, minutes, 0, 0);
                onChangeDateTime(next);
              }}
              className="rounded-md border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm text-white focus:border-[#F97316] focus:outline-none"
            />
          </div>
          <p className="text-xs text-[#9ca3af]">
            Will send on {toDateValue(scheduledAt) || '...'} at {toTimeValue(scheduledAt) || '...'} WAT
          </p>
          {error ? (
            <div className="inline-flex rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs text-red-300">
              {error}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
