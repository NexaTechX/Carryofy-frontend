'use client';

export interface CohortRow {
  cohortLabel: string;
  retentionByMonth: number[];
}

interface CohortRetentionHeatmapProps {
  data: CohortRow[];
  monthLabels?: string[];
  emptyMessage?: string;
}

function colorForPercent(pct: number): string {
  if (pct <= 0) return 'bg-gray-100 text-gray-400';
  if (pct < 20) return 'bg-green-100 text-green-800';
  if (pct < 40) return 'bg-green-200 text-green-900';
  if (pct < 60) return 'bg-green-300 text-green-900';
  if (pct < 80) return 'bg-green-500 text-white';
  return 'bg-green-600 text-white';
}

export default function CohortRetentionHeatmap({
  data,
  monthLabels,
  emptyMessage = 'No cohort data yet',
}: CohortRetentionHeatmapProps) {
  const cols =
    monthLabels ??
    (data[0]?.retentionByMonth?.length
      ? data[0].retentionByMonth.map((_, i) => (i === 0 ? 'M0' : `M${i}`))
      : ['M0', 'M1', 'M2', 'M3', 'M4', 'M5']);

  if (!data.length) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Cohort
            </th>
            {cols.map((label) => (
              <th
                key={label}
                className="border-b border-gray-200 bg-gray-50 px-2 py-2 text-center text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.cohortLabel} className="border-b border-gray-100 hover:bg-orange-50/50">
              <td className="px-3 py-2 font-medium text-gray-900">{row.cohortLabel}</td>
              {cols.map((_, j) => {
                const pct = row.retentionByMonth[j] ?? 0;
                return (
                  <td key={j} className="p-1">
                    <div
                      className={`flex h-8 min-w-[2rem] items-center justify-center rounded text-xs font-medium ${colorForPercent(pct)}`}
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

export function placeholderCohortData(): CohortRow[] {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  return months.map((m, i) => ({
    cohortLabel: `${m} 2025`,
    retentionByMonth: [100, 100 - (i + 1) * 12, 70 - i * 8, 50 - i * 5, 35 - i * 3, 25 - i * 2].map((v) =>
      Math.max(0, Math.min(100, v))
    ),
  }));
}
