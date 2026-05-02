'use client';

import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  CHART_AXIS,
  CHART_AXIS_LINE,
  CHART_GRID,
  CHART_TOOLTIP_BG,
  CHART_TOOLTIP_BORDER,
  CHART_TOOLTIP_TEXT,
} from '../../../lib/chartTheme';

const STATUS_ORDER = ['Pending', 'Processing', 'Out for Delivery', 'Delivered', 'Cancelled'] as const;

const STATUS_COLORS: Record<string, string> = {
  Pending: '#f59e0b',
  Processing: '#3b82f6',
  'Out for Delivery': '#a855f7',
  Delivered: '#22c55e',
  Cancelled: '#ef4444',
};

function normalizeLabel(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

interface OrderStatusBarChartProps {
  data: Array<{ label: string; value: number }>;
}

export default function OrderStatusBarChart({ data }: OrderStatusBarChartProps) {
  const byLabel = new Map<string, number>();
  for (const row of data) {
    const key = normalizeLabel(row.label);
    byLabel.set(key, row.value);
  }

  const chartData = STATUS_ORDER.map((label) => ({
    label,
    value: byLabel.get(label) ?? 0,
    fill: STATUS_COLORS[label] ?? '#6b7280',
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsBarChart data={chartData} margin={{ top: 28, right: 8, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
        <XAxis
          dataKey="label"
          stroke={CHART_AXIS}
          tick={{ fill: CHART_AXIS, fontSize: 10 }}
          axisLine={{ stroke: CHART_AXIS_LINE }}
          interval={0}
          angle={-18}
          textAnchor="end"
          height={56}
        />
        <YAxis
          stroke={CHART_AXIS}
          tick={{ fill: CHART_AXIS, fontSize: 11 }}
          axisLine={{ stroke: CHART_AXIS_LINE }}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: CHART_TOOLTIP_BG,
            border: `1px solid ${CHART_TOOLTIP_BORDER}`,
            borderRadius: '8px',
            color: CHART_TOOLTIP_TEXT,
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          }}
          formatter={(value: number) => [`${value} orders`, 'Count']}
        />
        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
          {chartData.map((entry) => (
            <Cell key={entry.label} fill={entry.fill} />
          ))}
          <LabelList
            dataKey="value"
            position="top"
            fill="#374151"
            fontSize={11}
            formatter={(v: number) => (v > 0 ? String(v) : '')}
          />
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
