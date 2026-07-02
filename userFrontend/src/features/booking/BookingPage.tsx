import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  MapPin,
  Package,
  Users,
} from 'lucide-react';
import { StepIndicator } from './components/StepIndicator';
import { PriceSummary } from './components/PriceSummary';
import {
  PaymentMethodForm,
  emptyPaymentDetails,
  isPaymentValid,
  type PaymentDetails,
} from '@/features/payment/PaymentMethodForm';
import { PaymentProcessing, type PaymentPhase } from '@/features/payment/PaymentProcessing';
import { Button, Checkbox, EmptyState, PageLoader } from '@/components/ui';
import { useBookingDraftStore } from '@/app/store/bookingDraftStore';
import { useVenue } from '@/features/venues/queries';
import { useCreateBooking, usePayBooking } from './queries';
import { calculatePricing } from '@/utils/pricing';
import { CATEGORY_MAP, TIME_SLOTS } from '@/utils/constants';
import { formatCurrency, formatDateLong, formatTime12h } from '@/utils/format';
import { getErrorMessage } from '@/api/axios';
import { useToast } from '@/app/store/uiStore';
import type { Booking, PaymentType } from '@/types';
import { cn } from '@/utils/cn';

const STEPS = ['Booking details', 'Payment', 'Confirmation'];

export function BookingPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const draft = useBookingDraftStore((s) => s.draft);
  const clearDraft = useBookingDraftStore((s) => s.clearDraft);
  const { data: venue, isLoading } = useVenue(draft?.venueId);

  const createBooking = useCreateBooking();
  const payBooking = usePayBooking();

  const [step, setStep] = useState(0);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [paymentType, setPaymentType] = useState<PaymentType>('full');
  const [payment, setPayment] = useState<PaymentDetails>(emptyPaymentDetails);
  const [phase, setPhase] = useState<PaymentPhase>('idle');
  const [payError, setPayError] = useState<string>();
  const [simulateFailure, setSimulateFailure] = useState(false);

  const selectedPackage = venue?.packages.find((p) => p.id === draft?.packageId);

  const pricing = useMemo(() => {
    if (!venue || !selectedPackage || !draft) return null;
    return calculatePricing({
      pkg: selectedPackage,
      guestCount: draft.guestCount,
      category: draft.category,
      discountPct: venue.offer?.discountPct ?? 0,
    });
  }, [venue, selectedPackage, draft]);

  if (!draft) {
    return (
      <div className="container-app py-16">
        <EmptyState
          icon={CalendarDays}
          title="No booking in progress"
          description="Pick a venue and choose your event details to start a booking."
          action={{ label: 'Explore venues', onClick: () => navigate('/venues') }}
        />
      </div>
    );
  }

  if (isLoading || !venue || !pricing || !selectedPackage) {
    return <PageLoader label="Preparing your booking…" />;
  }

  const slot = TIME_SLOTS.find((s) => s.value === draft.timeSlot) ?? TIME_SLOTS[2];
  const payAmount =
    paymentType === 'advance' ? pricing.advanceAmount : pricing.total;

  // Step 1 → create booking, then advance.
  const goToPayment = () => {
    createBooking.mutate(
      {
        venueId: draft.venueId,
        packageId: draft.packageId,
        category: draft.category,
        eventDate: draft.eventDate,
        startTime: draft.startTime,
        endTime: draft.endTime,
        guestCount: draft.guestCount,
      },
      {
        onSuccess: (b) => {
          setBooking(b);
          setPaymentType(pricing.advanceEligible ? 'advance' : 'full');
          setStep(1);
        },
        onError: (err) =>
          toast({ variant: 'error', title: 'Could not start booking', description: getErrorMessage(err) }),
      },
    );
  };

  const runPayment = () => {
    if (!booking) return;
    setPhase('processing');
    setPayError(undefined);
    payBooking.mutate(
      {
        id: booking.id,
        payload: {
          type: paymentType,
          method: payment.method,
          amount: payAmount,
          forceFail: simulateFailure,
        },
      },
      {
        onSuccess: (res) => {
          setPhase('success');
          setTimeout(() => {
            setBooking(res.booking);
            setPhase('idle');
            setStep(2);
            clearDraft();
          }, 1300);
        },
        onError: (err) => {
          setPayError(getErrorMessage(err));
          setPhase('failed');
        },
      },
    );
  };

  return (
    <div className="container-app max-w-5xl py-6 lg:py-10">
      {step < 2 && (
        <button
          onClick={() => (step === 0 ? navigate(-1) : setStep(0))}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      )}

      <div className="mb-8">
        <StepIndicator steps={STEPS} current={step} />
      </div>

      {/* STEP 1 — details */}
      {step === 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="flex gap-4 p-4">
                <img
                  src={venue.images[0]}
                  alt={venue.name}
                  className="h-24 w-32 shrink-0 rounded-xl object-cover"
                />
                <div>
                  <h2 className="font-display text-lg font-bold text-slate-900">{venue.name}</h2>
                  <p className="mt-0.5 flex items-center gap-1 text-sm text-slate-500">
                    <MapPin className="h-3.5 w-3.5" /> {venue.location.city}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="mb-4 font-semibold text-slate-900">Event details</h3>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DetailItem icon={CalendarDays} label="Date" value={formatDateLong(draft.eventDate)} />
                <DetailItem
                  icon={Clock}
                  label="Time"
                  value={`${formatTime12h(slot.start)} – ${formatTime12h(slot.end)}`}
                />
                <DetailItem icon={Package} label="Package" value={selectedPackage.name} />
                <DetailItem
                  icon={Users}
                  label="Guests"
                  value={`${draft.guestCount} guests`}
                />
                <DetailItem
                  icon={CalendarDays}
                  label="Event type"
                  value={CATEGORY_MAP[draft.category].label}
                />
              </dl>
              <Link
                to={`/venues/${venue.id}`}
                className="mt-4 inline-block text-sm font-medium text-brand-700 hover:underline"
              >
                Edit selection
              </Link>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="mb-4 font-semibold text-slate-900">Price summary</h3>
              <PriceSummary pricing={pricing} />
              <Button fullWidth size="lg" className="mt-5" onClick={goToPayment} isLoading={createBooking.isPending}>
                Continue to payment
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* STEP 2 — payment */}
      {step === 1 && booking && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            {pricing.advanceEligible && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="font-semibold text-slate-900">Payment option</h3>
                <p className="mt-0.5 text-sm text-slate-500">
                  This is a large event — you can pay an advance now and the balance later.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <PayOption
                    selected={paymentType === 'advance'}
                    onClick={() => setPaymentType('advance')}
                    title="Pay advance (25%)"
                    amount={pricing.advanceAmount}
                    note={`Balance ${formatCurrency(pricing.remainingAmount)} due before the event`}
                  />
                  <PayOption
                    selected={paymentType === 'full'}
                    onClick={() => setPaymentType('full')}
                    title="Pay full amount"
                    amount={pricing.total}
                    note="Settle everything now — nothing left to pay"
                  />
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="mb-4 font-semibold text-slate-900">Payment method</h3>
              <PaymentMethodForm value={payment} onChange={setPayment} />
              <div className="mt-4 rounded-xl bg-amber-50 p-3">
                <Checkbox
                  checked={simulateFailure}
                  onChange={setSimulateFailure}
                  label={
                    <span className="text-xs text-amber-800">
                      Simulate a failed payment (for testing the failure flow)
                    </span>
                  }
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="mb-4 font-semibold text-slate-900">Price summary</h3>
              <PriceSummary pricing={pricing} showAdvance={false} />
              <div className="mt-4 flex items-center justify-between rounded-xl bg-brand-50 px-4 py-3">
                <span className="text-sm font-medium text-brand-900">Paying now</span>
                <span className="font-display text-lg font-bold text-brand-900">
                  {formatCurrency(payAmount)}
                </span>
              </div>
              <Button
                fullWidth
                size="lg"
                className="mt-4"
                disabled={!isPaymentValid(payment)}
                onClick={runPayment}
              >
                Pay {formatCurrency(payAmount)}
              </Button>
              <p className="mt-2 text-center text-xs text-slate-400">
                🔒 Payments are encrypted and secure
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* STEP 3 — confirmation */}
      {step === 2 && booking && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mx-auto max-w-xl text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 12, delay: 0.1 }}
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50"
          >
            <CheckCircle2 className="h-11 w-11 text-emerald-600" />
          </motion.div>
          <h1 className="mt-6 font-display text-2xl font-bold text-slate-900">Booking confirmed!</h1>
          <p className="mt-2 text-slate-500">
            Your booking at <span className="font-medium text-slate-700">{venue.name}</span> is confirmed.
            A confirmation has been sent to your email.
          </p>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-sm text-slate-500">Booking reference</span>
              <span className="font-mono text-sm font-bold text-slate-900">{booking.reference}</span>
            </div>
            <dl className="space-y-2.5 pt-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Event date</dt>
                <dd className="font-medium text-slate-900">{formatDateLong(booking.eventDate)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Amount paid</dt>
                <dd className="font-medium text-slate-900">
                  {formatCurrency(booking.payments.reduce((s, p) => s + p.amount, 0))}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Payment status</dt>
                <dd className="font-medium capitalize text-emerald-600">
                  {booking.paymentStatus === 'fully_paid' ? 'Fully paid' : 'Advance paid'}
                </dd>
              </div>
              {booking.paymentStatus === 'advance_paid' && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">Balance due</dt>
                  <dd className="font-medium text-amber-600">
                    {formatCurrency(booking.pricing.remainingAmount)}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button onClick={() => navigate(`/booking/${booking.id}`)}>View booking details</Button>
            <Button variant="outline" onClick={() => navigate('/my-bookings')}>
              Go to my bookings
            </Button>
          </div>
        </motion.div>
      )}

      <PaymentProcessing
        phase={phase}
        amount={payAmount}
        errorMessage={payError}
        onRetry={runPayment}
        onClose={() => setPhase('idle')}
      />
    </div>
  );
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-brand-600">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <dt className="text-xs text-slate-500">{label}</dt>
        <dd className="text-sm font-medium text-slate-900">{value}</dd>
      </div>
    </div>
  );
}

function PayOption({
  selected,
  onClick,
  title,
  amount,
  note,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  amount: number;
  note: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-xl border p-4 text-left transition-colors',
        selected
          ? 'border-brand-500 bg-brand-50/60 ring-1 ring-brand-500'
          : 'border-slate-200 hover:border-slate-300',
      )}
    >
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 font-display text-xl font-bold text-slate-900">{formatCurrency(amount)}</p>
      <p className="mt-1 text-xs text-slate-500">{note}</p>
    </button>
  );
}
