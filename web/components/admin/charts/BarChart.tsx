import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import {
  CHART_AXIS,
  CHART_AXIS_LINE,
  CHART_CURSOR_FILL,
  CHART_GRID,
  CHART_PRIMARY,
  CHART_TOOLTIP_BG,
  CHART_TOOLTIP_BORDER,
  CHART_TOOLTIP_TEXT,
} from '../../../lib/chartTheme';

interface BarChartProps {
  data: Array<{ label: string; value: number }>;
  color?: string;
  valueFormatter?: (value: number) => string;
  yAxisTickFormatter?: (value: number) => string;
}

export default function BarChart({
  data,
  color = CHART_PRIMARY,
  valueFormatter,
  yAxisTickFormatter,
}: BarChartProps) {
  const yFmt =
    yAxisTickFormatter ??
    ((value: number) =>
      new Intl.NumberFormat('en-US', {
        notation: 'compact',
        compactDisplay: 'short',
      }).format(value));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsBarChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
        <XAxis
          dataKey="label"
          stroke={CHART_AXIS}
          tick={{ fill: CHART_AXIS, fontSize: 11 }}
          axisLine={{ stroke: CHART_AXIS_LINE }}
        />
        <YAxis
          stroke={CHART_AXIS}
          tick={{ fill: CHART_AXIS, fontSize: 11 }}
          axisLine={{ stroke: CHART_AXIS_LINE }}
          tickFormatter={yFmt}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: CHART_TOOLTIP_BG,
            border: `1px solid ${CHART_TOOLTIP_BORDER}`,
            borderRadius: '8px',
            color: CHART_TOOLTIP_TEXT,
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          }}
          formatter={(value: number) => (valueFormatter ? valueFormatter(value) : value.toLocaleString())}
          cursor={{ fill: CHART_CURSOR_FILL }}
        />
        <Bar dataKey="value" radius={[8, 8, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={color} />
          ))}
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
