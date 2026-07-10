import {
  CalendarCheck,
  CalendarClock,
  CalendarRange,
  Clock,
  IndianRupee,
  TrendingUp,
  Wallet,
  XCircle,
  CreditCard,
  CalendarPlus,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { StatsCard } from '@/components/common/StatsCard';
import { RevenueChart } from '@/components/charts/RevenueChart';
import { BookingChart } from '@/components/charts/BookingChart';
import { StatusPieChart } from '@/components/charts/StatusPieChart';
import { Card, Badge, StatCardSkeleton, Skeleton, ErrorState, EmptyState } from '@/components/ui';
import { useMyVenue } from '@/hooks/useVenue';
import { useDashboardAnalytics } from '@/hooks/useDashboard';
import { formatCurrency, formatCurrencyCompact } from '@/utils/format';
import { BOOKING_STATUS_META, PAYMENT_STATUS_META } from '@/constants';
import type { ActivityItem, BookingStatus, PaymentStatus } from '@/types';

function ActivityRow({ item }: { item: ActivityItem }) {
  const isPayment = item.type === 'payment';
  const meta = item.status
    ? isPayment
      ? PAYMENT_STATUS_META[item.status as PaymentStatus]
      : BOOKING_STATUS_META[item.status as BookingStatus]
    : null;
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-900">{item.title}</p>
        <p className="truncate text-xs text-slate-500">{item.subtitle}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        {item.amount != null && (
          <span className="text-sm font-semibold text-slate-900">{formatCurrency(item.amount)}</span>
        )}
        {meta && <Badge variant={meta.variant}>{meta.label}</Badge>}
      </div>
    </div>
  );
}

function ActivityCard({
  title,
  icon: Icon,
  items,
  emptyText,
}: {
  title: string;
  icon: typeof Clock;
  items: ActivityItem[];
  emptyText: string;
}) {
  return (
    <Card className="flex flex-col p-5">
      <div className="mb-1 flex items-center gap-2">
        <Icon className="h-4 w-4 text-brand-600" />
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">{emptyText}</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {items.map((item) => (
            <ActivityRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </Card>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { venueId, isLoading: venueLoading, hasVenue } = useMyVenue();
  const { data, isLoading, isError, refetch } = useDashboardAnalytics(venueId);

  const loading = venueLoading || isLoading;

  if (!venueLoading && !hasVenue) {
    return (
      <>
        <PageHeader title="Dashboard" />
        <EmptyState
          icon={CalendarPlus}
          title="No venue yet"
          description="Create your venue profile to start receiving bookings and see analytics here."
          action={{ label: 'Set up your venue', onClick: () => navigate('/profile') }}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader title="Dashboard" description="An overview of your venue’s bookings and revenue." />

      {isError ? (
        <ErrorState
          title="Couldn’t load analytics"
          description="The analytics service is unavailable. (Backend route not yet implemented.)"
          onRetry={() => refetch()}
        />
      ) : (
        <div className="space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {loading || !data ? (
              Array.from({ length: 8 }).map((_, i) => <StatCardSkeleton key={i} />)
            ) : (
              <>
                <StatsCard
                  label="Total Bookings"
                  value={String(data.metrics.total_bookings)}
                  icon={CalendarCheck}
                  tone="brand"
                />
                <StatsCard
                  label="Monthly Bookings"
                  value={String(data.metrics.monthly_bookings)}
                  icon={CalendarClock}
                  tone="info"
                />
                <StatsCard
                  label="Yearly Bookings"
                  value={String(data.metrics.yearly_bookings)}
                  icon={CalendarRange}
                  tone="accent"
                />
                <StatsCard
                  label="Total Revenue"
                  value={formatCurrencyCompact(data.metrics.total_revenue)}
                  icon={IndianRupee}
                  tone="success"
                />
                <StatsCard
                  label="Monthly Revenue"
                  value={formatCurrencyCompact(data.metrics.monthly_revenue)}
                  icon={Wallet}
                  tone="success"
                />
                <StatsCard
                  label="Pending Requests"
                  value={String(data.metrics.pending_requests)}
                  icon={Clock}
                  tone="warning"
                />
                <StatsCard
                  label="Cancelled Bookings"
                  value={String(data.metrics.cancelled_bookings)}
                  icon={XCircle}
                  tone="danger"
                />
                <StatsCard
                  label="Avg. Booking Value"
                  value={formatCurrency(
                    data.metrics.total_bookings
                      ? Math.round(data.metrics.total_revenue / data.metrics.total_bookings)
                      : 0,
                  )}
                  icon={TrendingUp}
                  tone="brand"
                />
              </>
            )}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="p-5 lg:col-span-2">
              <h3 className="mb-4 text-sm font-semibold text-slate-900">Monthly Revenue</h3>
              {loading || !data ? (
                <Skeleton className="h-[280px] w-full" />
              ) : (
                <RevenueChart data={data.monthly} />
              )}
            </Card>
            <Card className="p-5">
              <h3 className="mb-4 text-sm font-semibold text-slate-900">Booking Status</h3>
              {loading || !data ? (
                <Skeleton className="h-[280px] w-full" />
              ) : (
                <StatusPieChart data={data.statusBreakdown} />
              )}
            </Card>
          </div>

          <Card className="p-5">
            <h3 className="mb-4 text-sm font-semibold text-slate-900">Monthly Booking Trend</h3>
            {loading || !data ? (
              <Skeleton className="h-[280px] w-full" />
            ) : (
              <BookingChart data={data.monthly} />
            )}
          </Card>

          {/* Recent activity */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {loading || !data ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64 w-full" />)
            ) : (
              <>
                <ActivityCard
                  title="Recent Bookings"
                  icon={CalendarCheck}
                  items={data.recentBookings}
                  emptyText="No recent bookings."
                />
                <ActivityCard
                  title="Recent Payments"
                  icon={CreditCard}
                  items={data.recentPayments}
                  emptyText="No recent payments."
                />
                <ActivityCard
                  title="Upcoming Bookings"
                  icon={Clock}
                  items={data.upcomingBookings}
                  emptyText="No upcoming bookings."
                />
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
