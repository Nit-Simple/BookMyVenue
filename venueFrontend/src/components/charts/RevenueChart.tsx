import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { MonthlyPoint } from '@/types';
import { formatCurrency, formatCurrencyCompact } from '@/utils/format';

export function RevenueChart({ data }: { data: MonthlyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} stroke="#94a3b8" />
        <YAxis
          tickFormatter={(v) => formatCurrencyCompact(Number(v))}
          tickLine={false}
          axisLine={false}
          fontSize={12}
          stroke="#94a3b8"
          width={64}
        />
        <Tooltip
          cursor={{ fill: '#f1f5f9' }}
          formatter={(v) => [formatCurrency(Number(v)), 'Revenue']}
          contentStyle={{
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            fontSize: 13,
            boxShadow: '0 10px 30px -10px rgb(0 0 0 / 0.2)',
          }}
        />
        <Bar dataKey="revenue" fill="#0d9488" radius={[6, 6, 0, 0]} maxBarSize={36} />
      </BarChart>
    </ResponsiveContainer>
  );
}
