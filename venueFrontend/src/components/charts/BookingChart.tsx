import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { MonthlyPoint } from '@/types';

export function BookingChart({ data }: { data: MonthlyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="bookingGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f97316" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} stroke="#94a3b8" />
        <YAxis
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          fontSize={12}
          stroke="#94a3b8"
          width={32}
        />
        <Tooltip
          formatter={(v) => [v, 'Bookings']}
          contentStyle={{
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            fontSize: 13,
            boxShadow: '0 10px 30px -10px rgb(0 0 0 / 0.2)',
          }}
        />
        <Area
          type="monotone"
          dataKey="bookings"
          stroke="#ea580c"
          strokeWidth={2.5}
          fill="url(#bookingGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
