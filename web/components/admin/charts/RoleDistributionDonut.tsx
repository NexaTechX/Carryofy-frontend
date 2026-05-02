'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export interface RoleDistributionItem {
  role: string;
  label: string;
  count: number;
  color: string;
}

const DEFAULT_COLORS = ['#ff6600', '#0ea5e9', '#22c55e', '#a855f7'];

interface RoleDistributionDonutProps {
  data: RoleDistributionItem[];
  title?: string;
  height?: number;
}

export default function RoleDistributionDonut({
  data,
  title = 'Role distribution',
  height = 220,
}: RoleDistributionDonutProps) {
  const total = data.reduce((s, d) => s + d.count, 0);
  const chartData = data
    .filter((d) => d.count > 0)
    .map((d, i) => ({
      name: d.label,
      value: d.count,
      color: d.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
    }));

  if (chartData.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-2xl border border-[#1f1f1f] bg-[#111111] p-6"
        style={{ minHeight: height }}
      >
        <p className="text-sm text-gray-500">No role data</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#1f1f1f] bg-[#111111] p-4 shadow-[0_18px_38px_-24px_rgba(0,0,0,0.6)]">
      {title && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">{title}</p>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={56}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="#0b1018" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#0a0a0a',
              border: '1px solid #1f1f1f',
              borderRadius: '8px',
              color: '#fff',
            }}
            formatter={(value: number, name: string, item: { payload?: { value?: number } }) => {
              const raw = item?.payload?.value ?? value;
              const pct = total > 0 ? ((Number(raw) / total) * 100).toFixed(1) : '0';
              return [`${value} (${pct}%)`, name];
            }}
          />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            formatter={(value, entry) => (
              <span className="text-xs text-gray-300">
                {value}: {entry.payload?.value ?? 0}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
