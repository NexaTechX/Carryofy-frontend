'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export interface RetentionDataPoint {
  period: string;
  rate: number;
}

interface RetentionTrendChartProps {
  data: RetentionDataPoint[];
  color?: string;
  height?: number;
  emptyMessage?: string;
}

export default function RetentionTrendChart({
  data,
  color = '#FF6B00',
  height = 160,
  emptyMessage = 'Not enough retention history to chart yet.',
}: RetentionTrendChartProps) {
  if (data.length < 2) {
    return (
      <div
        className="flex h-full min-h-[120px] items-center justify-center rounded-xl px-4 text-center text-sm text-gray-500"
        style={{ minHeight: height }}
      >
        {emptyMessage}
      </div>
    );
  }

  const chartData = data;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 12, right: 12, left: 4, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.12)" vertical={false} />
        <XAxis
          dataKey="period"
          stroke="#64748b"
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          axisLine={{ stroke: '#334155' }}
          tickLine={{ stroke: '#334155' }}
        />
        <YAxis
          domain={[0, 100]}
          stroke="#64748b"
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          axisLine={{ stroke: '#334155' }}
          tickLine={{ stroke: '#334155' }}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1c2432',
            border: '1px solid #2d3849',
            borderRadius: '8px',
            color: '#f1f4f8',
            fontSize: '13px',
          }}
          formatter={(value: number) => [`${value.toFixed(1)}%`, 'Retention']}
          labelFormatter={(label) => label}
        />
        <Line
          type="monotone"
          dataKey="rate"
          stroke={color}
          strokeWidth={2}
          dot={{ fill: color, r: 3 }}
          activeDot={{ r: 5, fill: color, stroke: '#131922', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
