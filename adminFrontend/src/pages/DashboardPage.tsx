import { Link } from 'react-router-dom';
import {
  Ban,
  CalendarPlus,
  CheckCircle2,
  Clock,
  IndianRupee,
  CalendarCheck,
  XCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatsCard } from '@/components/common/StatsCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { RegistrationsChart } from '@/components/charts/RegistrationsChart';
import { CategoriesChart } from '@/components/charts/CategoriesChart';
import { Card, StatCardSkeleton, Skeleton, ErrorState } from '@/components/ui';
import { useAdminDashboard } from '@/hooks/useAdmin';
import { formatCurrencyCompact, formatRelative } from '@/utils/format';

export default function DashboardPage() {
  const { data, isLoading, isError } = useAdminDashboard();

  return (
    <>
      <PageHeader title="Dashboard" description="Platform onboarding at a glance." />

      {isError ? (
        <ErrorState title="Couldn’t load dashboard" onRetry={() => window.location.reload()} />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {isLoading || !data ? (
              Array.from({ length: 7 }).map((_, i) => <StatCardSkeleton key={i} />)
            ) : (
              <>
                <StatsCard label="Pending Requests" value={String(data.metrics.pending)} icon={Clock} tone="warning" />
                <StatsCard label="Approved Venues" value={String(data.metrics.approved)} icon={CheckCircle2} tone="success" />
                <StatsCard label="Rejected Venues" value={String(data.metrics.rejected)} icon={XCircle} tone="danger" />
                <StatsCard label="Suspended Venues" value={String(data.metrics.suspended)} icon={Ban} tone="neutral" />
                <StatsCard label="Today’s Registrations" value={String(data.metrics.today_registrations)} icon={CalendarPlus} tone="brand" />
                <StatsCard label="Total Bookings" value={String(data.metrics.total_bookings)} icon={CalendarCheck} tone="info" />
                <StatsCard label="Revenue" value={formatCurrencyCompact(data.metrics.total_revenue)} icon={IndianRupee} tone="success" />
              </>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <h3 className="mb-4 text-sm font-semibold text-slate-900">Registrations & Approvals</h3>
              {isLoading || !data ? <Skeleton className="h-[280px] w-full" /> : <RegistrationsChart data={data.registrationsTrend} />}
            </Card>
            <Card className="p-5">
              <h3 className="mb-4 text-sm font-semibold text-slate-900">Venues by Category</h3>
              {isLoading || !data ? <Skeleton className="h-[280px] w-full" /> : <CategoriesChart data={data.categories} />}
            </Card>
          </div>

          <Card className="p-5">
            <div className="mb-1 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Latest Registrations</h3>
              <Link to="/approvals" className="text-sm font-medium text-brand-700 hover:text-brand-800">
                View all
              </Link>
            </div>
            {isLoading || !data ? (
              <Skeleton className="h-40 w-full" />
            ) : data.recent.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">No registrations yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {data.recent.map((v) => (
                  <div key={v.venue_id} className="flex items-center justify-between gap-3 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="h-10 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                        {v.primary_image && <img src={v.primary_image} alt="" className="h-full w-full object-cover" loading="lazy" />}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">{v.venue_name}</p>
                        <p className="truncate text-xs text-slate-500">
                          {v.city}, {v.state} · {formatRelative(v.created_at)}
                        </p>
                      </div>
                    </div>
                    <StatusBadge kind="onboarding" status={v.onboarding_status} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
