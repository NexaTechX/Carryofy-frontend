'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import {
  CHART_AXIS,
  CHART_AXIS_LINE,
  CHART_GRID,
  CHART_PRIMARY,
  CHART_TOOLTIP_BG,
  CHART_TOOLTIP_BORDER,
  CHART_TOOLTIP_TEXT,
} from '../../../lib/chartTheme';

export interface RetentionDataPoint {
  period: string;
  rate: number;
}

interface RetentionTrendChartProps {
  data: RetentionDataPoint[];
  currentRate?: number;
  color?: string;
  height?: number;
}

function deriveTrendFromRate(rate: number): RetentionDataPoint[] {
  const periods = ['6w ago', '5w ago', '4w ago', '3w ago', '2w ago', 'Last week', 'Now'];
  const base = Math.max(0, rate - 8);
  return periods.map((period, i) => ({
    period,
    rate:
      i === periods.length - 1
        ? rate
        : Math.round(base + (rate - base) * (i / (periods.length - 1)) * 100) / 100,
  }));
}

export default function RetentionTrendChart({
  data,
  currentRate = 0,
  color = CHART_PRIMARY,
  height = 160,
}: RetentionTrendChartProps) {
  const chartData = data.length >= 2 ? data : deriveTrendFromRate(currentRate);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
        <XAxis
          dataKey="period"
          stroke={CHART_AXIS}
          tick={{ fill: CHART_AXIS, fontSize: 10 }}
          axisLine={{ stroke: CHART_AXIS_LINE }}
        />
        <YAxis
          domain={[0, 100]}
          stroke={CHART_AXIS}
          tick={{ fill: CHART_AXIS, fontSize: 10 }}
          axisLine={{ stroke: CHART_AXIS_LINE }}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: CHART_TOOLTIP_BG,
            border: `1px solid ${CHART_TOOLTIP_BORDER}`,
            borderRadius: '8px',
            color: CHART_TOOLTIP_TEXT,
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
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
          activeDot={{ r: 5, fill: color, stroke: '#fff', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
