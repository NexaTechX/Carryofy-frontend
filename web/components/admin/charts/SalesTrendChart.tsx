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
  salesColor = '#ff6600',
  earningsColor = '#10b981',
}: SalesTrendChartProps) {
  const dates = Array.from(
    new Set([
      ...salesTrend.map((p) => p.date),
      ...earningsTrend.map((p) => p.date),
    ])
  ).sort();

  const chartData = dates.map((date) => {
    const salesPoint = salesTrend.find((p) => p.date === date);
    const earningsPoint = earningsTrend.find((p) => p.date === date);
    return {
      date,
      label: new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      sales: salesPoint ? salesPoint.amount / 100 : 0,
      earnings: earningsPoint ? earningsPoint.amount / 100 : 0,
    };
  });

  const hasEarnings = showEarningsOverlay && earningsTrend.length > 0;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
          tickFormatter={(value) =>
            new Intl.NumberFormat('en-NG', {
              notation: 'compact',
              compactDisplay: 'short',
            }).format(value)
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
          formatter={(value: number, name: string) => [formatNgn(value), name === 'sales' ? 'Sales' : 'Earnings']}
          labelFormatter={(label) => label}
        />
        {hasEarnings && (
          <Legend
            formatter={(value) => (value === 'sales' ? 'Sales' : 'Earnings')}
            wrapperStyle={{ fontSize: 12 }}
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
              <Cell key={`sales-${index}`} fill={salesColor} opacity={0.85} />
            ))}
          </Bar>
        )}
        {view === 'bar' && hasEarnings && (
          <Bar dataKey="earnings" fill={earningsColor} radius={[4, 4, 0, 0]} name="earnings">
            {chartData.map((_, index) => (
              <Cell key={`earnings-${index}`} fill={earningsColor} opacity={0.75} />
            ))}
          </Bar>
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
