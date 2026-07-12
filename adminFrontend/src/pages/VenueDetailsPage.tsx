import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Ban,
  Building2,
  Check,
  Clock,
  Mail,
  MapPin,
  Phone,
  Snowflake,
  Users,
  X,
  FileWarning,
  CircleCheck,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { DecisionDialog } from '@/components/admin/DecisionDialog';
import { Card, Badge, Button, PageLoader, ErrorState } from '@/components/ui';
import {
  useApplicationDetail,
  useApplicationDecision,
  useVenueDetail,
} from '@/hooks/useAdmin';
import { usePermissions } from '@/hooks/usePermissions';
import { adminApi } from '@/api/admin';
import { getErrorMessage } from '@/api/axios';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { selectBasePrice } from '@/utils/pricing';
import type { VenueApplication } from '@/types';

function Detail({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-medium text-slate-900">{value || '—'}</p>
      </div>
    </div>
  );
}

function Timeline({ app }: { app: VenueApplication }) {
  const events = [
    { label: 'Application submitted', at: app.submitted_at, done: true },
    {
      label:
        app.status === 'APPROVED'
          ? 'Approved'
          : app.status === 'REJECTED'
            ? 'Rejected'
            : 'Awaiting review',
      at: app.reviewed_at,
      done: app.status !== 'PENDING_REVIEW',
    },
  ];
  return (
    <ol className="relative space-y-4 border-l border-slate-200 pl-5">
      {events.map((e, i) => (
        <li key={i} className="relative">
          <span className="absolute -left-[27px] top-0.5 bg-white">
            {e.done ? (
              <CircleCheck className="h-4 w-4 text-brand-600" />
            ) : (
              <Clock className="h-4 w-4 text-amber-500" />
            )}
          </span>
          <p className="text-sm font-medium text-slate-900">{e.label}</p>
          <p className="text-xs text-slate-500">{e.at ? formatDateTime(e.at) : 'Pending'}</p>
        </li>
      ))}
    </ol>
  );
}

export default function VenueDetailsPage() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();
  const { can } = usePermissions();

  const appQuery = useApplicationDetail(applicationId);
  const venueId = appQuery.data?.venue_id;
  const venueQuery = useVenueDetail(venueId);
  const mutation = useApplicationDecision();

  const [decision, setDecision] = useState<'approve' | 'reject' | null>(null);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [suspending, setSuspending] = useState(false);

  if (appQuery.isLoading) return <PageLoader label="Loading application…" />;
  if (appQuery.isError || !appQuery.data) return <ErrorState onRetry={() => appQuery.refetch()} />;

  const app = appQuery.data;
  const venue = venueQuery.data; // may be undefined on real backend (no pending-venue detail route)
  const base = selectBasePrice(venue?.pricing);

  const runDecision = async (notes: string) => {
    try {
      await mutation.mutateAsync({ id: app.application_id, action: decision!, notes });
      toast.success(decision === 'approve' ? 'Venue approved.' : 'Venue rejected.');
      setDecision(null);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Action failed.'));
    }
  };

  const runSuspend = async () => {
    if (!venueId) return;
    setSuspending(true);
    try {
      await adminApi.suspend(venueId); // TODO(backend): no suspend endpoint
      toast.success('Venue suspended.');
      setSuspendOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Suspend is not available yet.'));
    } finally {
      setSuspending(false);
    }
  };

  const isPending = app.status === 'PENDING_REVIEW';

  return (
    <>
      <button
        onClick={() => navigate(-1)}
        className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> Back to approvals
      </button>

      <PageHeader
        title={venue?.venue_name ?? 'Venue application'}
        description={`Application ${app.application_id}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge kind="application" status={app.status} />
            {isPending && can('venues:approve') && (
              <Button onClick={() => setDecision('approve')} leftIcon={<Check className="h-4 w-4" />}>
                Approve
              </Button>
            )}
            {isPending && can('venues:reject') && (
              <Button variant="danger" onClick={() => setDecision('reject')} leftIcon={<X className="h-4 w-4" />}>
                Reject
              </Button>
            )}
            {app.status === 'APPROVED' && can('venues:suspend') && (
              <Button variant="outline" onClick={() => setSuspendOpen(true)} leftIcon={<Ban className="h-4 w-4" />}>
                Suspend
              </Button>
            )}
          </div>
        }
      />

      {!venue && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
          <FileWarning className="mt-0.5 h-4 w-4 shrink-0" />
          Full venue detail isn’t available from the backend for non-approved venues yet
          (no admin venue-detail route). Showing application metadata only. (TODO backend)
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {venue && (
            <>
              {/* Media */}
              <Card className="p-5">
                <h3 className="mb-4 text-sm font-semibold text-slate-900">Media</h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {venue.media.map((m) => (
                    <div key={m.media_id} className="aspect-[4/3] overflow-hidden rounded-xl border border-slate-200">
                      <img src={m.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                    </div>
                  ))}
                </div>
              </Card>

              {/* Business & contact */}
              <Card className="p-5">
                <h3 className="mb-4 text-sm font-semibold text-slate-900">Business & contact</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Detail icon={Building2} label="Category" value={venue.venue_type} />
                  <Detail icon={Users} label="Capacity" value={`${venue.seating_capacity} guests`} />
                  <Detail icon={Mail} label="Email" value={venue.email} />
                  <Detail icon={Phone} label="Phone" value={venue.phone} />
                  <Detail
                    icon={Snowflake}
                    label="Air conditioned"
                    value={venue.is_air_conditioned ? 'Yes' : 'No'}
                  />
                  <Detail
                    icon={Clock}
                    label="Hours"
                    value={`${venue.opening_period} – ${venue.closing_period}`}
                  />
                  {base && (
                    <Detail
                      icon={Building2}
                      label="Base price"
                      value={`${formatCurrency(base.price_per_hour, base.currency)}/hr`}
                    />
                  )}
                </div>
              </Card>

              {/* Address */}
              <Card className="p-5">
                <h3 className="mb-4 text-sm font-semibold text-slate-900">Address</h3>
                <Detail
                  icon={MapPin}
                  label="Location"
                  value={
                    <>
                      {venue.addressline_1}
                      {venue.addressline_2 ? `, ${venue.addressline_2}` : ''}
                      <br />
                      {venue.city}, {venue.district}, {venue.state} {venue.postal_code}
                    </>
                  }
                />
              </Card>

              {/* Documents (TODO backend) */}
              <Card className="p-5">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">Documents</h3>
                  <Badge variant="neutral">Coming soon</Badge>
                </div>
                <p className="text-sm text-slate-500">
                  GST / trade license documents aren’t part of the venue model yet. (TODO backend)
                </p>
              </Card>
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="mb-4 text-sm font-semibold text-slate-900">Owner</h3>
            <Detail icon={Users} label="Owner ID" value={app.owner_id} />
          </Card>

          <Card className="p-5">
            <h3 className="mb-4 text-sm font-semibold text-slate-900">Review timeline</h3>
            <Timeline app={app} />
            {app.admin_notes && (
              <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                <span className="font-medium text-slate-700">Admin notes: </span>
                {app.admin_notes}
              </div>
            )}
          </Card>
        </div>
      </div>

      <DecisionDialog
        open={!!decision}
        action={decision}
        venueName={venue?.venue_name}
        isLoading={mutation.isPending}
        onClose={() => setDecision(null)}
        onConfirm={runDecision}
      />
      <ConfirmDialog
        open={suspendOpen}
        onClose={() => setSuspendOpen(false)}
        onConfirm={runSuspend}
        title="Suspend venue?"
        description="Suspending temporarily removes the venue from the platform. (Backend support pending.)"
        confirmLabel="Suspend"
        variant="danger"
        isLoading={suspending}
      />
    </>
  );
}
