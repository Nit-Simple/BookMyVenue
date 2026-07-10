import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { StatusSlice } from '@/types';
import { BOOKING_STATUS_META } from '@/constants';

export function StatusPieChart({ data }: { data: StatusSlice[] }) {
  const chartData = data
    .filter((d) => d.count > 0)
    .map((d) => ({
      name: BOOKING_STATUS_META[d.status].label,
      value: d.count,
      color: BOOKING_STATUS_META[d.status].color,
    }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={58}
          outerRadius={92}
          paddingAngle={2}
          stroke="none"
        >
          {chartData.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v, n) => [v, n]}
          contentStyle={{
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            fontSize: 13,
            boxShadow: '0 10px 30px -10px rgb(0 0 0 / 0.2)',
          }}
        />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
