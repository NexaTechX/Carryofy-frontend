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
  orderCount?: number;
}

interface DailyOrderValueChartProps {
  data: DailyOrderValuePoint[];
  comparisonData?: DailyOrderValuePoint[];
  view: DailyOrderValueView;
  showComparison: boolean;
  color?: string;
  comparisonColor?: string;
  granularity?: 'hour' | 'day' | 'month';
}

const formatNgn = (value: number) =>
  `₦${Math.round(value).toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;

function formatTickLabel(isoKey: string, granularity?: string): string {
  const d = new Date(isoKey);
  if (Number.isNaN(d.getTime())) return isoKey;
  if (granularity === 'hour') {
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  if (granularity === 'month') {
    return d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
  }
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function DailyOrderValueChart({
  data,
  comparisonData = [],
  view,
  showComparison,
  color = '#FF6B00',
  comparisonColor = '#6b7280',
  granularity,
}: DailyOrderValueChartProps) {
  const thisPeriodMap = new Map(data.map((p) => [p.date, p]));
  const compMap = new Map(comparisonData.map((p) => [p.date, p]));
  const allDates = Array.from(
    new Set([...data.map((p) => p.date), ...comparisonData.map((p) => p.date)])
  ).sort();

  const chartData = allDates.map((date) => {
    const cur = thisPeriodMap.get(date);
    const comp = compMap.get(date);
    return {
      date,
      label: formatTickLabel(date, granularity),
      value: cur ? cur.amount / 100 : 0,
      orderCount: cur?.orderCount ?? 0,
      comparison: comp ? comp.amount / 100 : 0,
    };
  });

  const hasComparison = showComparison && comparisonData.length > 0;

  const yTickFmt = (v: number) =>
    `₦${new Intl.NumberFormat('en-NG', { notation: 'compact', compactDisplay: 'short', maximumFractionDigits: 1 }).format(v)}`;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 4, bottom: 4 }}>
        <defs>
          <linearGradient id="dailyAreaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.45} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="areaFillComp" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={comparisonColor} stopOpacity={0.25} />
            <stop offset="95%" stopColor={comparisonColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a3142" vertical={false} />
        <XAxis
          dataKey="label"
          stroke="#6b7280"
          tick={{ fill: '#9ca3af', fontSize: 10 }}
          axisLine={{ stroke: '#2a3142' }}
          interval="preserveStartEnd"
          minTickGap={24}
        />
        <YAxis
          stroke="#6b7280"
          tick={{ fill: '#9ca3af', fontSize: 11 }}
          axisLine={{ stroke: '#2a3142' }}
          tickFormatter={yTickFmt}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#0f1524',
            border: '1px solid #2a3142',
            borderRadius: '8px',
            color: '#fff',
          }}
          labelStyle={{ color: '#9ca3af' }}
          formatter={(value: number, name: string, item: { payload?: { orderCount?: number } }) => {
            const oc = item?.payload?.orderCount;
            if (name === 'value') {
              const v = formatNgn(Number(value));
              return oc != null && oc > 0 ? [`${v} · ${oc} orders`, 'This period'] : [v, 'This period'];
            }
            return [formatNgn(Number(value)), 'Last period'];
          }}
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
            type="natural"
            dataKey="value"
            stroke={color}
            strokeWidth={2.5}
            dot={{ fill: color, r: 3 }}
            name="value"
          />
        )}
        {view === 'line' && hasComparison && (
          <Line
            type="natural"
            dataKey="comparison"
            stroke={comparisonColor}
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={{ fill: comparisonColor, r: 2 }}
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
            type="natural"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill="url(#dailyAreaFill)"
            name="value"
          />
        )}
        {view === 'area' && hasComparison && (
          <Area
            type="natural"
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
