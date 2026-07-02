import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  MapPin,
  Package,
  Star,
  Users,
} from 'lucide-react';
import { useBooking, useInvoice } from './queries';
import { bookingStatusMeta, paymentStatusMeta } from './components/statusMeta';
import { CancelBookingModal } from './components/CancelBookingModal';
import { PayBalanceModal } from '@/features/payment/PayBalanceModal';
import { ReviewFormModal } from '@/features/reviews/components/ReviewFormModal';
import { downloadInvoice } from './invoice';
import { Badge, Button, Card, ErrorState, PageLoader } from '@/components/ui';
import {
  formatCurrency,
  formatDate,
  formatDateLong,
  formatDateTime,
  formatTime12h,
} from '@/utils/format';
import { CATEGORY_MAP } from '@/utils/constants';

const methodLabel: Record<string, string> = { card: 'Card', upi: 'UPI', wallet: 'Wallet' };
const typeLabel: Record<string, string> = { advance: 'Advance', remaining: 'Balance', full: 'Full payment' };

export function OrderDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: booking, isLoading, isError, refetch } = useBooking(id);
  const { data: invoice } = useInvoice(id);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  if (isLoading) return <PageLoader label="Loading booking…" />;
  if (isError || !booking)
    return (
      <div className="container-app py-10">
        <ErrorState title="Booking not found" onRetry={refetch} />
      </div>
    );

  const status = bookingStatusMeta[booking.status];
  const payment = paymentStatusMeta[booking.paymentStatus];
  const p = booking.pricing;
  const amountPaid = booking.payments.reduce((s, x) => s + x.amount, 0);
  const canCancel = booking.status === 'confirmed' || booking.status === 'pending';
  const hasBalance = booking.paymentStatus === 'advance_paid' && booking.status !== 'cancelled';

  return (
    <div className="container-app max-w-5xl py-6 lg:py-10">
      <button
        onClick={() => navigate('/my-bookings')}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back to my bookings
      </button>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Booking details</h1>
          <p className="mt-1 font-mono text-sm text-slate-500">{booking.reference}</p>
        </div>
        <div className="flex gap-2">
          <Badge variant={status.variant}>{status.label}</Badge>
          <Badge variant={payment.variant}>{payment.label}</Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Summary */}
          <Card className="overflow-hidden">
            <Link to={`/venues/${booking.venueId}`} className="flex gap-4 p-4 hover:bg-slate-50">
              <img src={booking.venueImage} alt={booking.venueName} className="h-24 w-32 shrink-0 rounded-xl object-cover" />
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900">{booking.venueName}</h2>
                <p className="mt-0.5 flex items-center gap-1 text-sm text-slate-500">
                  <MapPin className="h-3.5 w-3.5" /> {booking.venueCity}
                </p>
                <span className="mt-2 inline-block text-sm font-medium text-brand-700">View venue →</span>
              </div>
            </Link>
            <dl className="grid grid-cols-2 gap-4 border-t border-slate-100 p-4 sm:grid-cols-4">
              <Detail icon={CalendarDays} label="Date" value={formatDate(booking.eventDate)} />
              <Detail icon={Clock} label="Time" value={`${formatTime12h(booking.startTime)}–${formatTime12h(booking.endTime)}`} />
              <Detail icon={Package} label="Package" value={booking.packageName} />
              <Detail icon={Users} label="Guests" value={`${booking.guestCount}`} />
            </dl>
          </Card>

          {/* Invoice */}
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Invoice</h3>
              {invoice && (
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<Download className="h-4 w-4" />}
                  onClick={() => downloadInvoice(booking, invoice)}
                >
                  Download
                </Button>
              )}
            </div>
            <div className="space-y-2.5 text-sm">
              <InvoiceRow label="Venue charge" value={formatCurrency(p.venuePrice)} />
              {p.guestCharge > 0 && <InvoiceRow label="Per-guest charges" value={formatCurrency(p.guestCharge)} />}
              {p.discount > 0 && <InvoiceRow label="Discount" value={`– ${formatCurrency(p.discount)}`} positive />}
              <InvoiceRow label="Service charge (5%)" value={formatCurrency(p.serviceCharge)} muted />
              <InvoiceRow label="Tax / GST (18%)" value={formatCurrency(p.tax)} muted />
              <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                <span className="font-semibold text-slate-900">Total</span>
                <span className="font-display text-lg font-bold text-slate-900">{formatCurrency(p.total)}</span>
              </div>
              <InvoiceRow label="Total paid" value={formatCurrency(amountPaid)} />
              {invoice && invoice.amountDue > 0 && (
                <InvoiceRow label="Balance due" value={formatCurrency(invoice.amountDue)} />
              )}
            </div>
          </Card>

          {/* Payment history */}
          <Card className="p-5">
            <h3 className="mb-4 font-semibold text-slate-900">Payment history</h3>
            {booking.payments.length === 0 ? (
              <p className="text-sm text-slate-500">No payments recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {booking.payments.map((pay) => (
                  <div key={pay.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                        <CheckCircle2 className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {typeLabel[pay.type]} · {methodLabel[pay.method]}
                        </p>
                        <p className="text-xs text-slate-400">
                          {formatDateTime(pay.createdAt)} · {pay.reference}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-slate-900">{formatCurrency(pay.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Refund status */}
          {booking.refund && (
            <Card className="border-sky-100 bg-sky-50/40 p-5">
              <h3 className="mb-3 font-semibold text-slate-900">Refund status</h3>
              <div className="space-y-2 text-sm">
                <InvoiceRow label="Refund amount" value={formatCurrency(booking.refund.amount)} />
                <InvoiceRow label="Refund percentage" value={`${booking.refund.refundPct}%`} muted />
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Status</span>
                  <Badge variant={booking.refund.status === 'completed' ? 'success' : 'warning'}>
                    {booking.refund.status === 'completed' ? 'Refund completed' : 'Processing'}
                  </Badge>
                </div>
                <p className="pt-1 text-xs text-slate-500">
                  {booking.refund.status === 'completed'
                    ? 'The refund has been credited to your original payment method.'
                    : 'Refunds typically reach your account within 5–7 business days.'}
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* Side actions */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20 p-5">
            <h3 className="font-semibold text-slate-900">Actions</h3>
            <div className="mt-4 space-y-2.5">
              {hasBalance && (
                <Button fullWidth onClick={() => setPayOpen(true)}>
                  Pay balance ({formatCurrency(p.remainingAmount)})
                </Button>
              )}
              {invoice && (
                <Button
                  fullWidth
                  variant="outline"
                  leftIcon={<Download className="h-4 w-4" />}
                  onClick={() => downloadInvoice(booking, invoice)}
                >
                  Download invoice
                </Button>
              )}
              {booking.status === 'completed' && (
                <Button
                  fullWidth
                  variant="subtle"
                  leftIcon={<Star className="h-4 w-4" />}
                  onClick={() => setReviewOpen(true)}
                >
                  Write a review
                </Button>
              )}
              {canCancel && (
                <Button
                  fullWidth
                  variant="ghost"
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => setCancelOpen(true)}
                >
                  Cancel booking
                </Button>
              )}
              <Button fullWidth variant="ghost" onClick={() => navigate('/support')}>
                Need help?
              </Button>
            </div>

            <div className="mt-5 border-t border-slate-100 pt-4 text-sm">
              <p className="text-slate-500">Booked on</p>
              <p className="font-medium text-slate-900">{formatDateLong(booking.createdAt)}</p>
              <p className="mt-3 text-slate-500">Event type</p>
              <p className="font-medium text-slate-900">{CATEGORY_MAP[booking.category].label}</p>
            </div>
          </Card>
        </div>
      </div>

      <CancelBookingModal booking={booking} open={cancelOpen} onClose={() => setCancelOpen(false)} />
      <PayBalanceModal booking={booking} open={payOpen} onClose={() => setPayOpen(false)} />
      <ReviewFormModal
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        venueId={booking.venueId}
        venueName={booking.venueName}
        category={booking.category}
      />
    </div>
  );
}

function Detail({ icon: Icon, label, value }: { icon: typeof CalendarDays; label: string; value: string }) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs text-slate-500">
        <Icon className="h-3.5 w-3.5" /> {label}
      </dt>
      <dd className="mt-0.5 text-sm font-medium text-slate-900">{value}</dd>
    </div>
  );
}

function InvoiceRow({
  label,
  value,
  muted,
  positive,
}: {
  label: string;
  value: string;
  muted?: boolean;
  positive?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={muted ? 'text-slate-500' : 'text-slate-600'}>{label}</span>
      <span className={positive ? 'font-medium text-emerald-600' : 'font-medium text-slate-900'}>{value}</span>
    </div>
  );
}
