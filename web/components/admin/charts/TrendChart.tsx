import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface TrendChartProps {
  data: Array<{ date: string; amount: number }>;
  color?: string;
}

export default function TrendChart({ data, color = '#ff6600' }: TrendChartProps) {
  const chartData = data.map((point) => ({
    date: new Date(point.date).toLocaleDateString('en-US', { weekday: 'short' }),
    value: point.amount / 100,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.4} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
        <XAxis
          dataKey="date"
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
          fillOpacity={1}
          fill="url(#colorValue)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

