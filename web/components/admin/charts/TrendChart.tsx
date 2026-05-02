import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import {
  CHART_AXIS,
  CHART_AXIS_LINE,
  CHART_GRID,
  CHART_PRIMARY,
  CHART_TOOLTIP_BG,
  CHART_TOOLTIP_BORDER,
  CHART_TOOLTIP_TEXT,
} from '../../../lib/chartTheme';

interface TrendChartProps {
  data: Array<{ date: string; amount: number }>;
  color?: string;
}

export default function TrendChart({ data, color = CHART_PRIMARY }: TrendChartProps) {
  const chartData = data.map((point) => ({
    date: new Date(point.date).toLocaleDateString('en-US', { weekday: 'short' }),
    value: point.amount / 100,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
        <XAxis
          dataKey="date"
          stroke={CHART_AXIS}
          tick={{ fill: CHART_AXIS, fontSize: 11 }}
          axisLine={{ stroke: CHART_AXIS_LINE }}
        />
        <YAxis
          stroke={CHART_AXIS}
          tick={{ fill: CHART_AXIS, fontSize: 11 }}
          axisLine={{ stroke: CHART_AXIS_LINE }}
          tickFormatter={(value) =>
            new Intl.NumberFormat('en-NG', {
              notation: 'compact',
              compactDisplay: 'short',
            }).format(value)
          }
        />
        <Tooltip
          contentStyle={{
            backgroundColor: CHART_TOOLTIP_BG,
            border: `1px solid ${CHART_TOOLTIP_BORDER}`,
            borderRadius: '8px',
            color: CHART_TOOLTIP_TEXT,
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          }}
          formatter={(value: number) =>
            new Intl.NumberFormat('en-NG', {
              style: 'currency',
              currency: 'NGN',
              maximumFractionDigits: 0,
            }).format(value)
          }
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={color}
          fillOpacity={0.12}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
