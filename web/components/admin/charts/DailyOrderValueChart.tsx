'use client';

import {
  ComposedChart,
  Line,
  Bar,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  Cell,
} from 'recharts';

export type DailyOrderValueView = 'line' | 'bar' | 'area';

export interface DailyOrderValuePoint {
  date: string;
  amount: number; // kobo
}

interface DailyOrderValueChartProps {
  /** This period (e.g. current 7d/30d) */
  data: DailyOrderValuePoint[];
  /** Last period same length for comparison */
  comparisonData?: DailyOrderValuePoint[];
  view: DailyOrderValueView;
  showComparison: boolean;
  color?: string;
  comparisonColor?: string;
}

const formatNgn = (value: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(value);

export default function DailyOrderValueChart({
  data,
  comparisonData = [],
  view,
  showComparison,
  color = '#ff6600',
  comparisonColor = '#6b7280',
}: DailyOrderValueChartProps) {
  const thisPeriodMap = new Map(data.map((p) => [p.date, p.amount / 100]));
  const compMap = new Map(comparisonData.map((p) => [p.date, p.amount / 100]));
  const allDates = Array.from(
    new Set([...data.map((p) => p.date), ...comparisonData.map((p) => p.date)])
  ).sort();

  const chartData = allDates.map((date) => ({
    date,
    label: new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    value: thisPeriodMap.get(date) ?? 0,
    comparison: compMap.get(date) ?? 0,
  }));

  const hasComparison = showComparison && comparisonData.length > 0;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.4} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="areaFillComp" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={comparisonColor} stopOpacity={0.25} />
            <stop offset="95%" stopColor={comparisonColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
        <XAxis
          dataKey="label"
          stroke="#6b7280"
          tick={{ fill: '#6b7280', fontSize: 11 }}
          axisLine={{ stroke: '#1f1f1f' }}
        />
        <YAxis
          stroke="#6b7280"
          tick={{ fill: '#6b7280', fontSize: 11 }}
          axisLine={{ stroke: '#1f1f1f' }}
          tickFormatter={(v) =>
            new Intl.NumberFormat('en-NG', { notation: 'compact', compactDisplay: 'short' }).format(v)
          }
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#0a0a0a',
            border: '1px solid #1f1f1f',
            borderRadius: '8px',
            color: '#fff',
          }}
          labelStyle={{ color: '#9ca3af' }}
          formatter={(value: number, name: string) => [
            formatNgn(Number(value)),
            name === 'value' ? 'This period' : 'Last period',
          ]}
          labelFormatter={(label) => label}
        />
        {hasComparison && (
          <Legend
            formatter={(value) => (value === 'value' ? 'This period' : 'Last period')}
            wrapperStyle={{ fontSize: 12 }}
          />
        )}

        {view === 'line' && (
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={{ fill: color, r: 4 }}
            name="value"
          />
        )}
        {view === 'line' && hasComparison && (
          <Line
            type="monotone"
            dataKey="comparison"
            stroke={comparisonColor}
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={{ fill: comparisonColor, r: 3 }}
            name="comparison"
          />
        )}

        {view === 'bar' && (
          <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} name="value">
            {chartData.map((_, i) => (
              <Cell key={`v-${i}`} fill={color} opacity={0.9} />
            ))}
          </Bar>
        )}
        {view === 'bar' && hasComparison && (
          <Bar dataKey="comparison" fill={comparisonColor} radius={[4, 4, 0, 0]} name="comparison">
            {chartData.map((_, i) => (
              <Cell key={`c-${i}`} fill={comparisonColor} opacity={0.5} />
            ))}
          </Bar>
        )}

        {view === 'area' && (
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill="url(#areaFill)"
            name="value"
          />
        )}
        {view === 'area' && hasComparison && (
          <Area
            type="monotone"
            dataKey="comparison"
            stroke={comparisonColor}
            strokeWidth={2}
            strokeDasharray="4 4"
            fill="url(#areaFillComp)"
            name="comparison"
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
