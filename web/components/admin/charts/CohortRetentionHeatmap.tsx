'use client';

/** One row: cohort month -> retention % per subsequent month. */
export interface CohortRow {
  cohortLabel: string; // e.g. "Jan 2025"
  retentionByMonth: number[]; // [M0, M1, M2, ...] as 0-100
}

interface CohortRetentionHeatmapProps {
  data: CohortRow[];
  /** Month labels for columns, e.g. ["M0", "M1", "M2", "M3"] */
  monthLabels?: string[];
  emptyMessage?: string;
}

function colorForPercent(pct: number): string {
  if (pct <= 0) return 'bg-[#1f2534]';
  if (pct < 20) return 'bg-emerald-900/50';
  if (pct < 40) return 'bg-emerald-700/60';
  if (pct < 60) return 'bg-emerald-500/70';
  if (pct < 80) return 'bg-emerald-400/80';
  return 'bg-emerald-400';
}

export default function CohortRetentionHeatmap({
  data,
  monthLabels,
  emptyMessage = 'No cohort data yet',
}: CohortRetentionHeatmapProps) {
  const cols = monthLabels ?? (data[0]?.retentionByMonth?.length
    ? data[0].retentionByMonth.map((_, i) => (i === 0 ? 'M0' : `M${i}`))
    : ['M0', 'M1', 'M2', 'M3', 'M4', 'M5']);

  if (!data.length) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-[#1f2534] bg-[#0f1524] p-6 text-gray-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="border border-[#1f2534] bg-[#0f1524] px-3 py-2 text-left text-xs font-medium text-gray-400">
              Cohort
            </th>
            {cols.map((label) => (
              <th
                key={label}
                className="border border-[#1f2534] bg-[#0f1524] px-2 py-2 text-center text-xs font-medium text-gray-400"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row.cohortLabel}>
              <td className="border border-[#1f2534] px-3 py-2 font-medium text-gray-200">
                {row.cohortLabel}
              </td>
              {cols.map((_, j) => {
                const pct = row.retentionByMonth[j] ?? 0;
                return (
                  <td key={j} className="border border-[#1f2534] p-1">
                    <div
                      className={`flex h-8 min-w-[2rem] items-center justify-center rounded ${colorForPercent(pct)} text-xs font-medium text-white`}
                      title={`${pct.toFixed(0)}%`}
                    >
                      {pct > 0 ? `${Math.round(pct)}%` : '—'}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Build placeholder cohort data for UI demo when backend doesn't provide it yet. */
export function placeholderCohortData(): CohortRow[] {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  return months.map((m, i) => ({
    cohortLabel: `${m} 2025`,
    retentionByMonth: [100, 100 - (i + 1) * 12, 70 - i * 8, 50 - i * 5, 35 - i * 3, 25 - i * 2].map((v) =>
      Math.max(0, Math.min(100, v))
    ),
  }));
}
