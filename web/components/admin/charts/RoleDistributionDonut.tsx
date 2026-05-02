'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import {
  CHART_TOOLTIP_BG,
  CHART_TOOLTIP_BORDER,
  CHART_TOOLTIP_TEXT,
} from '../../../lib/chartTheme';

export interface RoleDistributionItem {
  role: string;
  label: string;
  count: number;
  color: string;
}

const DEFAULT_COLORS = ['#f97316', '#0ea5e9', '#22c55e', '#a855f7'];

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
        className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        style={{ minHeight: height }}
      >
        <p className="text-sm text-gray-500">No role data</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      {title && (
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">{title}</p>
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
              <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: CHART_TOOLTIP_BG,
              border: `1px solid ${CHART_TOOLTIP_BORDER}`,
              borderRadius: '8px',
              color: CHART_TOOLTIP_TEXT,
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
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
              <span className="text-xs text-gray-600">
                {value}: {entry.payload?.value ?? 0}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
