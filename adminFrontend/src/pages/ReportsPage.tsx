import { Info } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { RegistrationsChart } from '@/components/charts/RegistrationsChart';
import { CategoriesChart } from '@/components/charts/CategoriesChart';
import { Card, Badge, Skeleton, ErrorState } from '@/components/ui';
import { useAdminDashboard } from '@/hooks/useAdmin';

/**
 * Reports — registrations/approvals and categories are DERIVED from /admin/venues
 * (real). Revenue is a placeholder. TODO(backend): no reports/analytics endpoint.
 */
export default function ReportsPage() {
  const { data, isLoading, isError } = useAdminDashboard();

  if (isError) return <ErrorState onRetry={() => window.location.reload()} />;

  return (
    <>
      <PageHeader title="Reports" description="Onboarding analytics across the platform." />

      <div className="mb-4 flex items-start gap-2 rounded-xl border border-sky-100 bg-sky-50 p-4 text-sm text-sky-800">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        Registration & category reports are derived from live venue data. A dedicated reporting
        endpoint (incl. revenue) is not available yet.
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
        <Card className="p-5 lg:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Revenue</h3>
            <Badge variant="neutral">Coming soon</Badge>
          </div>
          <p className="text-sm text-slate-500">
            Revenue reporting will appear here once the backend exposes payment analytics. (TODO backend)
          </p>
        </Card>
      </div>
    </>
  );
}
