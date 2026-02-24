'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export interface DonutChartItem {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

interface DonutChartProps {
  data: DonutChartItem[];
  height?: number;
  showLegend?: boolean;
  valueFormatter?: (value: number) => string;
}

const DEFAULT_COLORS = ['#25D366', '#1DA1F2', '#1877F2', '#6b7280']; // WhatsApp, Twitter, Facebook, Other

export default function DonutChart({
  data,
  height = 280,
  showLegend = true,
  valueFormatter = (v) => v.toLocaleString(),
}: DonutChartProps) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center text-gray-400" style={{ height }}>
        No data
      </div>
    );
  }

  const chartData = data.map((d) => ({ ...d, fill: d.color }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius="55%"
          outerRadius="80%"
          paddingAngle={2}
          dataKey="value"
          nameKey="name"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f1524" strokeWidth={2} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: '#0a0a0a',
            border: '1px solid #1f1f1f',
            borderRadius: '8px',
            color: '#fff',
          }}
          formatter={(value: number, name: string, props: { payload?: { percentage?: number } }) => [
            `${valueFormatter(value)} (${(props.payload?.percentage ?? 0).toFixed(1)}%)`,
            name,
          ]}
        />
        {showLegend && (
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            formatter={(value, entry) => {
              const p = (entry?.payload as unknown) as DonutChartItem | undefined;
              return (
                <span className="text-gray-300 text-sm">
                  {value} — {p?.percentage != null ? p.percentage.toFixed(1) : 0}%
                </span>
              );
            }}
            wrapperStyle={{ fontSize: 12 }}
          />
        )}
      </PieChart>
    </ResponsiveContainer>
  );
}

export function platformToColor(platform: string): string {
  const p = platform.toLowerCase();
  if (p.includes('whatsapp')) return '#25D366';
  if (p.includes('twitter') || p === 'x') return '#1DA1F2';
  if (p.includes('facebook')) return '#1877F2';
  if (p.includes('instagram')) return '#E4405F';
  return '#6b7280';
}

export function buildDonutData(
  items: { platform: string; count: number }[],
  colorMap: (platform: string) => string = platformToColor
): DonutChartItem[] {
  const total = items.reduce((s, i) => s + i.count, 0);
  if (total === 0) return [];
  return items.map((item) => ({
    name: item.platform.charAt(0).toUpperCase() + item.platform.slice(1).replace(/_/g, ' '),
    value: item.count,
    percentage: (item.count / total) * 100,
    color: colorMap(item.platform),
  }));
}
