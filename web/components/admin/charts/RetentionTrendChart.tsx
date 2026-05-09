'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export interface RetentionDataPoint {
  period: string;
  rate: number;
}

interface RetentionTrendChartProps {
  /** Current rate (single number) — will generate a 6-period trend for display if data length < 2 */
  data: RetentionDataPoint[];
  /** Current retention rate when data is derived from a single value */
  currentRate?: number;
  color?: string;
  height?: number;
}

function deriveTrendFromRate(rate: number): RetentionDataPoint[] {
  const periods = ['6w ago', '5w ago', '4w ago', '3w ago', '2w ago', 'Last week', 'Now'];
  const base = Math.max(0, rate - 8);
  return periods.map((period, i) => ({
    period,
    rate: i === periods.length - 1 ? rate : Math.round(base + (rate - base) * (i / (periods.length - 1)) * 100) / 100,
  }));
}

export default function RetentionTrendChart({
  data,
  currentRate = 0,
  color = '#FF6B00',
  height = 160,
}: RetentionTrendChartProps) {
  const chartData = data.length >= 2 ? data : deriveTrendFromRate(currentRate);

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
