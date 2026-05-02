'use client';

import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  Cell,
} from 'recharts';
import {
  CHART_AXIS,
  CHART_AXIS_LINE,
  CHART_GRID,
  CHART_PRIMARY,
  CHART_TOOLTIP_BG,
  CHART_TOOLTIP_BORDER,
  CHART_TOOLTIP_TEXT,
} from '../../../lib/chartTheme';

export type SalesTrendView = 'line' | 'bar';

interface DataPoint {
  date: string;
  amount: number;
}

interface SalesTrendChartProps {
  salesTrend: DataPoint[];
  earningsTrend?: DataPoint[];
  view: SalesTrendView;
  showEarningsOverlay: boolean;
  salesColor?: string;
  earningsColor?: string;
}

const formatNgn = (value: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(value);

export default function SalesTrendChart({
  salesTrend,
  earningsTrend = [],
  view,
  showEarningsOverlay,
  salesColor = CHART_PRIMARY,
  earningsColor = '#22c55e',
}: SalesTrendChartProps) {
  const dates = Array.from(
    new Set([...salesTrend.map((p) => p.date), ...earningsTrend.map((p) => p.date)])
  ).sort();

  const chartData = dates.map((date) => {
    const salesPoint = salesTrend.find((p) => p.date === date);
    const earningsPoint = earningsTrend.find((p) => p.date === date);
    return {
      date,
      label: new Date(date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
      sales: salesPoint ? salesPoint.amount / 100 : 0,
      earnings: earningsPoint ? earningsPoint.amount / 100 : 0,
    };
  });

  const hasEarnings = showEarningsOverlay && earningsTrend.length > 0;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
          labelStyle={{ color: CHART_AXIS }}
          formatter={(value: number, name: string) => [formatNgn(value), name === 'sales' ? 'Sales' : 'Earnings']}
          labelFormatter={(label) => label}
        />
        {hasEarnings && (
          <Legend
            formatter={(value) => (value === 'sales' ? 'Sales' : 'Earnings')}
            wrapperStyle={{ fontSize: 12, color: CHART_TOOLTIP_TEXT }}
          />
        )}
        {view === 'line' && (
          <Line
            type="monotone"
            dataKey="sales"
            stroke={salesColor}
            strokeWidth={2}
            dot={{ fill: salesColor, r: 3 }}
            name="sales"
          />
        )}
        {view === 'line' && hasEarnings && (
          <Line
            type="monotone"
            dataKey="earnings"
            stroke={earningsColor}
            strokeWidth={2}
            dot={{ fill: earningsColor, r: 3 }}
            strokeDasharray="4 4"
            name="earnings"
          />
        )}
        {view === 'bar' && (
          <Bar dataKey="sales" fill={salesColor} radius={[4, 4, 0, 0]} name="sales">
            {chartData.map((_, index) => (
              <Cell key={`sales-${index}`} fill={salesColor} />
            ))}
          </Bar>
        )}
        {view === 'bar' && hasEarnings && (
          <Bar dataKey="earnings" fill={earningsColor} radius={[4, 4, 0, 0]} name="earnings">
            {chartData.map((_, index) => (
              <Cell key={`earnings-${index}`} fill={earningsColor} opacity={0.85} />
            ))}
          </Bar>
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
