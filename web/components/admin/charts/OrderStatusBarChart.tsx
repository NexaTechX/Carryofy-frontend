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

const STATUS_ORDER = [
  'Pending',
  'Processing',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
] as const;

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
        <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
        <XAxis
          dataKey="label"
          stroke="#6b7280"
          tick={{ fill: '#9ca3af', fontSize: 10 }}
          axisLine={{ stroke: '#1f1f1f' }}
          interval={0}
          angle={-18}
          textAnchor="end"
          height={56}
        />
        <YAxis
          stroke="#6b7280"
          tick={{ fill: '#6b7280', fontSize: 11 }}
          axisLine={{ stroke: '#1f1f1f' }}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#0a0a0a',
            border: '1px solid #2a3142',
            borderRadius: '8px',
            color: '#fff',
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
            fill="#e5e7eb"
            fontSize={11}
            formatter={(v: number) => (v > 0 ? String(v) : '')}
          />
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
