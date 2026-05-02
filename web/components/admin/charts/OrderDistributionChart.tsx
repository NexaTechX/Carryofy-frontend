'use client';

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  LabelList,
} from 'recharts';

export interface OrderDistributionItem {
  status: string;
  count: number;
  percentage: number;
}

interface OrderDistributionChartProps {
  data: OrderDistributionItem[];
  color?: string;
  onBarClick?: (status: string) => void;
}

export default function OrderDistributionChart({
  data,
  color = '#ff6600',
  onBarClick,
}: OrderDistributionChartProps) {
  const chartData = data.map((entry) => ({
    label: entry.status.replace(/_/g, ' '),
    value: entry.count,
    percentage: entry.percentage,
    status: entry.status,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsBarChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
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
          tickFormatter={(v) => (Number.isFinite(v) ? v.toLocaleString() : '')}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#0a0a0a',
            border: '1px solid #1f1f1f',
            borderRadius: '8px',
            color: '#fff',
          }}
          formatter={(value: number, _name: string, props: { payload?: { percentage?: number } }) =>
            [`${value.toLocaleString()} (${props.payload?.percentage != null ? props.payload.percentage.toFixed(1) : 0}%)`, 'Orders']
          }
          cursor={{ fill: '#1a1a1a' }}
        />
        <Bar
          dataKey="value"
          radius={[8, 8, 0, 0]}
          onClick={(payload: { status: string }) => onBarClick?.(payload.status)}
          cursor={onBarClick ? 'pointer' : 'default'}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={color} opacity={0.8 + index * 0.04} />
          ))}
          <LabelList
            dataKey="percentage"
            position="top"
            formatter={(p: number) => `${p.toFixed(1)}%`}
            fill="#9ca3af"
            fontSize={11}
          />
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
