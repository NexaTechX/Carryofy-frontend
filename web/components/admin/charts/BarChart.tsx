import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

interface BarChartProps {
  data: Array<{ label: string; value: number }>;
  color?: string;
  valueFormatter?: (value: number) => string;
}

export default function BarChart({ data, color = '#ff6600', valueFormatter }: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsBarChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
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
            new Intl.NumberFormat('en-US', {
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
          formatter={(value: number) => (valueFormatter ? valueFormatter(value) : value.toLocaleString())}
          cursor={{ fill: '#1a1a1a' }}
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

