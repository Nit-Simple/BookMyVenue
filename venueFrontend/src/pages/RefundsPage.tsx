import { useState } from 'react';
import toast from 'react-hot-toast';
import { Check, Eye, RotateCcw, X } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchBar } from '@/components/common/SearchBar';
import { Pagination } from '@/components/common/Pagination';
import { StatusBadge } from '@/components/common/StatusBadge';
import { TableShell, Th, Td } from '@/components/common/Table';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { RefundDetailsDrawer } from '@/components/refunds/RefundDetailsDrawer';
import { Select, TableSkeleton, ErrorState, EmptyState } from '@/components/ui';
import { useMyVenue } from '@/hooks/useVenue';
import { useRefunds, useRefundAction } from '@/hooks/useRefunds';
import { useTable } from '@/hooks/useTable';
import { getErrorMessage } from '@/api/axios';
import { formatCurrency, formatDate } from '@/utils/format';
import { REFUND_STATUS_META } from '@/constants';
import type { Refund, RefundStatus } from '@/types';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  ...Object.entries(REFUND_STATUS_META).map(([value, meta]) => ({ value, label: meta.label })),
];

export default function RefundsPage() {
  const { venueId, hasVenue, isLoading: venueLoading } = useMyVenue();
  const { data, isLoading, isError, refetch } = useRefunds(venueId);
  const action = useRefundAction(venueId ?? '');

  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<Refund | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirm, setConfirm] = useState<{ id: string; kind: 'approve' | 'reject' } | null>(null);

  const table = useTable<Refund>({
    data: data ?? [],
    searchFields: ['booking_reference', 'customer_name', 'reason'],
    pageSize: 10,
    initialSort: { key: 'requested_at', dir: 'desc' },
    filter: statusFilter ? (r) => r.status === (statusFilter as RefundStatus) : undefined,
  });

  const loading = venueLoading || isLoading;

  const runAction = async (id: string, kind: 'approve' | 'reject') => {
    try {
      const updated = await action.mutateAsync({ id, action: kind });
      toast.success(kind === 'approve' ? 'Refund approved.' : 'Refund rejected.');
      setConfirm(null);
      setDrawerOpen(false);
      if (selected?.id === id) setSelected(updated);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Action failed.'));
    }
  };

  const openDetails = (r: Refund) => {
    setSelected(r);
    setDrawerOpen(true);
  };

  return (
    <>
      <PageHeader title="Refunds" description="Review and process refund requests." />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar
          value={table.search}
          onChange={table.setSearch}
          placeholder="Search by booking, customer or reason…"
          className="sm:max-w-md"
        />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={STATUS_OPTIONS}
          className="sm:w-52"
        />
      </div>

      {loading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : isError ? (
        <ErrorState
          title="Couldn’t load refunds"
          description="The refunds service is unavailable. (Backend route not yet implemented.)"
          onRetry={() => refetch()}
        />
      ) : !hasVenue ? (
        <EmptyState title="No venue yet" description="Create your venue profile to manage refunds." />
      ) : table.total === 0 ? (
        <EmptyState icon={RotateCcw} title="No refunds found" description="Try adjusting your filters." />
      ) : (
        <>
          <TableShell>
            <thead>
              <tr>
                <Th>Booking</Th>
                <Th sortable active={table.sort?.key === 'customer_name'} dir={table.sort?.dir} onSort={() => table.toggleSort('customer_name')}>
                  Customer
                </Th>
                <Th align="right" sortable active={table.sort?.key === 'refund_amount'} dir={table.sort?.dir} onSort={() => table.toggleSort('refund_amount')}>
                  Amount
                </Th>
                <Th>Status</Th>
                <Th>Reason</Th>
                <Th sortable active={table.sort?.key === 'requested_at'} dir={table.sort?.dir} onSort={() => table.toggleSort('requested_at')}>
                  Requested
                </Th>
                <Th align="center">Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {table.rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/60">
                  <Td className="font-mono text-xs font-semibold text-brand-700">{r.booking_reference}</Td>
                  <Td className="font-medium text-slate-900">{r.customer_name}</Td>
                  <Td align="right" className="font-semibold text-slate-900">
                    {formatCurrency(r.refund_amount, r.currency)}
                  </Td>
                  <Td>
                    <StatusBadge kind="refund" status={r.status} />
                  </Td>
                  <Td className="max-w-[200px] truncate" >{r.reason}</Td>
                  <Td>{formatDate(r.requested_at)}</Td>
                  <Td align="center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => openDetails(r)}
                        title="View details"
                        className="focus-ring rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {r.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => setConfirm({ id: r.id, kind: 'approve' })}
                            title="Approve"
                            className="focus-ring rounded-lg p-2 text-emerald-600 hover:bg-emerald-50"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setConfirm({ id: r.id, kind: 'reject' })}
                            title="Reject"
                            className="focus-ring rounded-lg p-2 text-red-600 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
          <Pagination
            page={table.page}
            totalPages={table.totalPages}
            total={table.total}
            onChange={table.setPage}
          />
        </>
      )}

      <RefundDetailsDrawer
        refund={selected}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onApprove={() => selected && runAction(selected.id, 'approve')}
        onReject={() => selected && runAction(selected.id, 'reject')}
        isActing={action.isPending}
      />

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && runAction(confirm.id, confirm.kind)}
        title={confirm?.kind === 'approve' ? 'Approve refund?' : 'Reject refund?'}
        description={
          confirm?.kind === 'approve'
            ? 'The refund will be marked approved and processed to the customer.'
            : 'The refund request will be rejected. The customer will be notified.'
        }
        confirmLabel={confirm?.kind === 'approve' ? 'Approve' : 'Reject'}
        variant={confirm?.kind === 'approve' ? 'primary' : 'danger'}
        isLoading={action.isPending}
      />
    </>
  );
}
