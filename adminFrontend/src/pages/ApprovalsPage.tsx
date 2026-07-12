import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Check, ClipboardCheck, Eye, X } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchBar } from '@/components/common/SearchBar';
import { Pagination } from '@/components/common/Pagination';
import { StatusBadge } from '@/components/common/StatusBadge';
import { TableShell, Th, Td } from '@/components/common/Table';
import { DecisionDialog } from '@/components/admin/DecisionDialog';
import { Tabs, TableSkeleton, ErrorState, EmptyState } from '@/components/ui';
import { useAdminVenues, useApplications, useApplicationDecision } from '@/hooks/useAdmin';
import { usePermissions } from '@/hooks/usePermissions';
import { useTable } from '@/hooks/useTable';
import { getErrorMessage } from '@/api/axios';
import { formatDate } from '@/utils/format';
import type { ApplicationStatus, VenueListItem } from '@/types';

interface Row extends Record<string, unknown> {
  application_id: string;
  venue_id: string;
  venue_name: string;
  owner_name: string;
  city: string;
  state: string;
  category: string;
  submitted_at: string;
  status: ApplicationStatus;
  primary_image?: string | null;
}

const TABS: { value: ApplicationStatus; label: string }[] = [
  { value: 'PENDING_REVIEW', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

export default function ApprovalsPage() {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const [tab, setTab] = useState<ApplicationStatus>('PENDING_REVIEW');
  const [decision, setDecision] = useState<{ id: string; name: string; action: 'approve' | 'reject' } | null>(null);

  const applicationsQuery = useApplications(tab);
  const venuesQuery = useAdminVenues();
  const mutation = useApplicationDecision();

  const venueMap = useMemo(() => {
    const map = new Map<string, VenueListItem>();
    (venuesQuery.data ?? []).forEach((v) => map.set(v.venue_id, v));
    return map;
  }, [venuesQuery.data]);

  const rows: Row[] = useMemo(
    () =>
      (applicationsQuery.data ?? []).map((app) => {
        const v = venueMap.get(app.venue_id);
        return {
          application_id: app.application_id,
          venue_id: app.venue_id,
          venue_name: v?.venue_name ?? 'Unknown venue',
          owner_name: v?.owner_name ?? app.owner_id,
          city: v?.city ?? '—',
          state: v?.state ?? '',
          category: v?.venue_name?.split(' ').slice(1).join(' ') || '—',
          submitted_at: app.submitted_at,
          status: app.status,
          primary_image: v?.primary_image,
        };
      }),
    [applicationsQuery.data, venueMap],
  );

  const table = useTable<Row>({
    data: rows,
    searchFields: ['venue_name', 'owner_name', 'city'],
    pageSize: 8,
    initialSort: { key: 'submitted_at', dir: 'desc' },
  });

  const loading = applicationsQuery.isLoading || venuesQuery.isLoading;

  const runDecision = async (notes: string) => {
    if (!decision) return;
    try {
      await mutation.mutateAsync({ id: decision.id, action: decision.action, notes });
      toast.success(decision.action === 'approve' ? 'Venue approved.' : 'Venue rejected.');
      setDecision(null);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Action failed.'));
    }
  };

  return (
    <>
      <PageHeader title="Venue Approvals" description="Review and action venue onboarding requests." />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs tabs={TABS} active={tab} onChange={(v) => setTab(v)} />
        <SearchBar
          value={table.search}
          onChange={table.setSearch}
          placeholder="Search venue, owner or city…"
          className="sm:max-w-xs"
        />
      </div>

      {loading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : applicationsQuery.isError ? (
        <ErrorState onRetry={() => applicationsQuery.refetch()} />
      ) : table.total === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="Nothing here"
          description={`No ${TABS.find((t) => t.value === tab)?.label.toLowerCase()} applications.`}
        />
      ) : (
        <>
          <TableShell>
            <thead>
              <tr>
                <Th sortable active={table.sort?.key === 'venue_name'} dir={table.sort?.dir} onSort={() => table.toggleSort('venue_name')}>
                  Venue
                </Th>
                <Th sortable active={table.sort?.key === 'owner_name'} dir={table.sort?.dir} onSort={() => table.toggleSort('owner_name')}>
                  Owner
                </Th>
                <Th>Category</Th>
                <Th sortable active={table.sort?.key === 'city'} dir={table.sort?.dir} onSort={() => table.toggleSort('city')}>
                  Location
                </Th>
                <Th sortable active={table.sort?.key === 'submitted_at'} dir={table.sort?.dir} onSort={() => table.toggleSort('submitted_at')}>
                  Submitted
                </Th>
                <Th>Status</Th>
                <Th align="center">Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {table.rows.map((r) => (
                <tr key={r.application_id} className="hover:bg-slate-50/60">
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                        {r.primary_image && (
                          <img src={r.primary_image} alt="" className="h-full w-full object-cover" loading="lazy" />
                        )}
                      </div>
                      <span className="font-medium text-slate-900">{r.venue_name}</span>
                    </div>
                  </Td>
                  <Td>{r.owner_name}</Td>
                  <Td className="text-slate-500">{r.category}</Td>
                  <Td>
                    {r.city}
                    {r.state ? `, ${r.state}` : ''}
                  </Td>
                  <Td>{formatDate(r.submitted_at)}</Td>
                  <Td>
                    <StatusBadge kind="application" status={r.status} />
                  </Td>
                  <Td align="center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => navigate(`/approvals/${r.application_id}`)}
                        title="View details"
                        className="focus-ring rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {r.status === 'PENDING_REVIEW' && (
                        <>
                          {can('venues:approve') && (
                            <button
                              onClick={() => setDecision({ id: r.application_id, name: r.venue_name, action: 'approve' })}
                              title="Approve"
                              className="focus-ring rounded-lg p-2 text-emerald-600 hover:bg-emerald-50"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                          {can('venues:reject') && (
                            <button
                              onClick={() => setDecision({ id: r.application_id, name: r.venue_name, action: 'reject' })}
                              title="Reject"
                              className="focus-ring rounded-lg p-2 text-red-600 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
          <Pagination page={table.page} totalPages={table.totalPages} total={table.total} onChange={table.setPage} />
        </>
      )}

      <DecisionDialog
        open={!!decision}
        action={decision?.action ?? null}
        venueName={decision?.name}
        isLoading={mutation.isPending}
        onClose={() => setDecision(null)}
        onConfirm={runDecision}
      />
    </>
  );
}
