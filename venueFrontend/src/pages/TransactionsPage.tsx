import { useState } from 'react';
import toast from 'react-hot-toast';
import { Download, FileText, Receipt } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchBar } from '@/components/common/SearchBar';
import { Pagination } from '@/components/common/Pagination';
import { StatusBadge } from '@/components/common/StatusBadge';
import { TableShell, Th, Td } from '@/components/common/Table';
import { Select, Button, TableSkeleton, ErrorState, EmptyState } from '@/components/ui';
import { useMyVenue } from '@/hooks/useVenue';
import { useTransactions } from '@/hooks/useTransactions';
import { useTable } from '@/hooks/useTable';
import { formatCurrency, formatDate } from '@/utils/format';
import { PAYMENT_STATUS_META } from '@/constants';
import type { PaymentStatus, Transaction } from '@/types';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  ...Object.entries(PAYMENT_STATUS_META).map(([value, meta]) => ({ value, label: meta.label })),
];

export default function TransactionsPage() {
  const { venueId, hasVenue, isLoading: venueLoading } = useMyVenue();
  const { data, isLoading, isError, refetch } = useTransactions(venueId);
  const [statusFilter, setStatusFilter] = useState('');

  const table = useTable<Transaction>({
    data: data ?? [],
    searchFields: ['invoice_number', 'booking_reference', 'customer_name'],
    pageSize: 10,
    initialSort: { key: 'date', dir: 'desc' },
    filter: statusFilter ? (r) => r.payment_status === (statusFilter as PaymentStatus) : undefined,
  });

  const loading = venueLoading || isLoading;

  const handleInvoice = () => {
    // TODO(backend): no invoice endpoint yet.
    toast('Invoice download will be available once the backend supports it.', { icon: '📄' });
  };
  const handleExport = () => {
    // TODO(backend): no export endpoint yet.
    toast('Export will be available once the backend supports it.', { icon: '📤' });
  };

  return (
    <>
      <PageHeader
        title="Transactions"
        description="Payment history across all your bookings."
        actions={
          <Button variant="outline" onClick={handleExport} leftIcon={<Download className="h-4 w-4" />}>
            Export
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar
          value={table.search}
          onChange={table.setSearch}
          placeholder="Search by invoice, booking or customer…"
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
        <TableSkeleton rows={8} cols={7} />
      ) : isError ? (
        <ErrorState
          title="Couldn’t load transactions"
          description="The transactions service is unavailable. (Backend route not yet implemented.)"
          onRetry={() => refetch()}
        />
      ) : !hasVenue ? (
        <EmptyState title="No venue yet" description="Create your venue profile to see transactions." />
      ) : table.total === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No transactions found"
          description="Try adjusting your search or filters."
        />
      ) : (
        <>
          <TableShell>
            <thead>
              <tr>
                <Th sortable active={table.sort?.key === 'invoice_number'} dir={table.sort?.dir} onSort={() => table.toggleSort('invoice_number')}>
                  Invoice
                </Th>
                <Th>Booking</Th>
                <Th sortable active={table.sort?.key === 'customer_name'} dir={table.sort?.dir} onSort={() => table.toggleSort('customer_name')}>
                  Customer
                </Th>
                <Th align="right" sortable active={table.sort?.key === 'amount'} dir={table.sort?.dir} onSort={() => table.toggleSort('amount')}>
                  Amount
                </Th>
                <Th align="right">Advance</Th>
                <Th align="right">Remaining</Th>
                <Th>Status</Th>
                <Th sortable active={table.sort?.key === 'date'} dir={table.sort?.dir} onSort={() => table.toggleSort('date')}>
                  Date
                </Th>
                <Th align="center">Invoice</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {table.rows.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/60">
                  <Td className="font-mono text-xs font-semibold text-brand-700">{t.invoice_number}</Td>
                  <Td className="font-mono text-xs">{t.booking_reference}</Td>
                  <Td className="font-medium text-slate-900">{t.customer_name}</Td>
                  <Td align="right" className="font-semibold text-slate-900">
                    {formatCurrency(t.amount, t.currency)}
                  </Td>
                  <Td align="right">{formatCurrency(t.advance_paid, t.currency)}</Td>
                  <Td align="right" className={t.remaining_amount > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                    {formatCurrency(t.remaining_amount, t.currency)}
                  </Td>
                  <Td>
                    <StatusBadge kind="payment" status={t.payment_status} />
                  </Td>
                  <Td>{formatDate(t.date)}</Td>
                  <Td align="center">
                    <button
                      onClick={handleInvoice}
                      title="Download invoice"
                      className="focus-ring rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-brand-700"
                    >
                      <FileText className="h-4 w-4" />
                    </button>
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
    </>
  );
}
