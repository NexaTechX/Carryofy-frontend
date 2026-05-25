import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

export type SentimentDonutEntry = { name: string; value: number; color: string };

type Props = {
  data: SentimentDonutEntry[];
};

export default function FeedbackSentimentDonut({ data }: Props) {
  if (data.length === 0) {
    return <p className="text-sm text-gray-500">No data</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={140}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          cx="50%"
          cy="50%"
          innerRadius={36}
          outerRadius={52}
          paddingAngle={2}
          stroke="transparent"
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: '#111',
            border: '1px solid #2a2a2a',
            borderRadius: 8,
            color: '#fff',
            fontSize: 12,
          }}
          formatter={(value: number, name: string) => [`${value}`, name]}
        />
        <Legend
          layout="vertical"
          align="right"
          verticalAlign="middle"
          formatter={(value, entry: { payload?: { value?: number } }) => (
            <span className="text-xs text-gray-400">
              {value} {typeof entry?.payload?.value === 'number' ? `(${entry.payload.value})` : ''}
            </span>
          )}
          iconSize={8}
          iconType="circle"
          wrapperStyle={{ fontSize: 11 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
