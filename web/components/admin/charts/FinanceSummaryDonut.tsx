import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { formatNgnFromKobo } from '../../../lib/api/utils';

export type FinanceDonutEntry = { name: string; value: number; color: string };

type Props = {
  data: FinanceDonutEntry[];
};

export default function FinanceSummaryDonut({ data }: Props) {
  if (data.length === 0) {
    return (
      <p className="flex h-full items-center justify-center text-xs text-gray-500">No data yet</p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={42}
          outerRadius={64}
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
          formatter={(value: number, name: string) => [formatNgnFromKobo(value), name] as [string, string]}
        />
        <Legend
          layout="vertical"
          align="right"
          verticalAlign="middle"
          formatter={(value) => <span className="text-xs text-gray-400">{value}</span>}
          iconSize={8}
          iconType="circle"
          wrapperStyle={{ fontSize: 11 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
