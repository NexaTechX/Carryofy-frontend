import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

interface BarChartProps {
  data: Array<{ label: string; value: number }>;
  color?: string;
  valueFormatter?: (value: number) => string;
  yAxisTickFormatter?: (value: number) => string;
}

export default function BarChart({
  data,
  color = '#FF6B00',
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
      <RechartsBarChart data={data} margin={{ top: 12, right: 8, left: 4, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.12)" vertical={false} />
        <XAxis
          dataKey="label"
          stroke="#64748b"
          tick={{ fill: '#94a3b8', fontSize: 12 }}
          axisLine={{ stroke: '#334155' }}
          tickLine={{ stroke: '#334155' }}
        />
        <YAxis
          stroke="#64748b"
          tick={{ fill: '#94a3b8', fontSize: 12 }}
          axisLine={{ stroke: '#334155' }}
          tickLine={{ stroke: '#334155' }}
          tickFormatter={yFmt}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1c2432',
            border: '1px solid #2d3849',
            borderRadius: '8px',
            color: '#f1f4f8',
            fontSize: '13px',
          }}
          formatter={(value: number) => (valueFormatter ? valueFormatter(value) : value.toLocaleString())}
          cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
        />
        <Bar dataKey="value" radius={[8, 8, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={color} opacity={0.8 + index * 0.05} />
          ))}
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}

