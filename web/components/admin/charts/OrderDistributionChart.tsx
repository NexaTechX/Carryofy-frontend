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
  color = CHART_PRIMARY,
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
          tickFormatter={(v) => (Number.isFinite(v) ? v.toLocaleString() : '')}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: CHART_TOOLTIP_BG,
            border: `1px solid ${CHART_TOOLTIP_BORDER}`,
            borderRadius: '8px',
            color: CHART_TOOLTIP_TEXT,
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          }}
          formatter={(value: number, _name: string, props: { payload?: { percentage?: number } }) =>
            [
              `${value.toLocaleString()} (${props.payload?.percentage != null ? props.payload.percentage.toFixed(1) : 0}%)`,
              'Orders',
            ]
          }
          cursor={{ fill: CHART_CURSOR_FILL }}
        />
        <Bar
          dataKey="value"
          radius={[8, 8, 0, 0]}
          onClick={(payload: { status: string }) => onBarClick?.(payload.status)}
          cursor={onBarClick ? 'pointer' : 'default'}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={color} />
          ))}
          <LabelList
            dataKey="percentage"
            position="top"
            formatter={(p: number) => `${p.toFixed(1)}%`}
            fill="#6b7280"
            fontSize={11}
          />
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
