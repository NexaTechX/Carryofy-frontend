'use client';

import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { CHART_PRIMARY } from '../../../lib/chartTheme';

interface SparklineProps {
  data: Array<{ date: string; value: number }>;
  color?: string;
  height?: number;
}

export default function Sparkline({ data, color = CHART_PRIMARY, height = 48 }: SparklineProps) {
  if (!data.length) return null;
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            fill={color}
            fillOpacity={0.12}
            isAnimationActive={true}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
