import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import type { EventCategory, Venue } from '@/types';
import { Button, DatePicker, Select, Stepper } from '@/components/ui';
import { PriceSummary } from '@/features/booking/components/PriceSummary';
import { CATEGORY_MAP, TIME_SLOTS } from '@/utils/constants';
import { calculatePricing } from '@/utils/pricing';
import { formatCurrency } from '@/utils/format';
import { useBookingDraftStore } from '@/app/store/bookingDraftStore';
import { useAuthStore } from '@/app/store/authStore';
import { useUiStore, useToast } from '@/app/store/uiStore';
import { cn } from '@/utils/cn';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useAvailabilityCheck } from '../queries';

const AVAILABILITY_MSG: Record<string, string> = {
  CONFLICT_EXISTS: 'Already booked for this time slot.',
  OUTSIDE_OPERATING_HOURS: 'Outside this venue’s operating hours.',
  PAST_TIME: 'Please choose a future date and time.',
  BELOW_MIN_DURATION: 'This slot is shorter than the venue’s minimum booking.',
  CAPACITY_EXCEEDED: 'Guest count exceeds this venue’s capacity.',
  VENUE_NOT_FOUND: 'This venue is not available.',
};

export function BookingWidget({ venue }: { venue: Venue }) {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setAuthRedirect = useUiStore((s) => s.setAuthRedirect);
  const setDraft = useBookingDraftStore((s) => s.setDraft);
  const toast = useToast();

  const [date, setDate] = useState('');
  const [category, setCategory] = useState<EventCategory>(venue.category);
  const [packageId, setPackageId] = useState(
    venue.packages.find((p) => p.popular)?.id ?? venue.packages[0].id,
  );
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[2].value);
  const [guests, setGuests] = useState(Math.min(venue.capacityMin + 50, venue.capacityMax));
  const [errors, setErrors] = useState<{ date?: string }>({});

  const selectedPackage = venue.packages.find((p) => p.id === packageId)!;
  const pricing = useMemo(
    () =>
      calculatePricing({
        pkg: selectedPackage,
        guestCount: guests,
        category,
        discountPct: venue.offer?.discountPct ?? 0,
      }),
    [selectedPackage, guests, category, venue.offer],
  );

  const debounced = useDebouncedValue({ date, timeSlot, guests }, 400);
  const debouncedRange = useMemo(() => {
    if (!debounced.date) return null;
    const s = TIME_SLOTS.find((x) => x.value === debounced.timeSlot)!;
    return {
      start: `${debounced.date}T${s.start}:00+05:30`,
      end: `${debounced.date}T${s.end}:00+05:30`,
    };
  }, [debounced.date, debounced.timeSlot]);

  const { data: availability, isFetching } = useAvailabilityCheck(
    venue.id,
    debouncedRange,
    debounced.guests,
  );

  const isBlocked = availability?.available === false;

  const handleContinue = () => {
    if (!date) {
      setErrors({ date: 'Please select an event date' });
      return;
    }
    const slot = TIME_SLOTS.find((s) => s.value === timeSlot)!;
    setDraft({
      venueId: venue.id,
      venueName: venue.name,
      packageId,
      category,
      eventDate: date,
      timeSlot,
      startTime: slot.start,
      endTime: slot.end,
      guestCount: guests,
    });

    if (!isAuthenticated) {
      toast({ variant: 'info', title: 'Please log in to continue your booking' });
      setAuthRedirect('/booking');
      navigate('/login');
      return;
    }
    navigate('/booking');
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-baseline justify-between">
        <div>
          <span className="font-display text-2xl font-bold text-slate-900">
            {formatCurrency(venue.startingPrice)}
          </span>
          <span className="text-sm text-slate-500"> onwards</span>
        </div>
        {venue.offer && (
          <span className="rounded-full bg-accent-50 px-2.5 py-1 text-xs font-semibold text-accent-700">
            {venue.offer.discountPct}% OFF · {venue.offer.code}
          </span>
        )}
      </div>

      <div className="mt-4 space-y-3">
        <DatePicker
          label="Event date"
          value={date}
          onChange={(d) => {
            setDate(d);
            setErrors({});
          }}
          disabledDates={venue.bookedDates}
          error={errors.date}
        />

        <Select
          label="Event type"
          value={category}
          onChange={(e) => setCategory(e.target.value as EventCategory)}
          options={venue.categories.map((c) => ({ value: c, label: CATEGORY_MAP[c].label }))}
        />

        <Select
          label="Time slot"
          value={timeSlot}
          onChange={(e) => setTimeSlot(e.target.value)}
          options={TIME_SLOTS.map((s) => ({ value: s.value, label: s.label }))}
        />

        <Stepper
          label="Number of guests"
          value={guests}
          onChange={setGuests}
          min={venue.capacityMin}
          max={venue.capacityMax}
          step={10}
        />
        <p className="-mt-1 text-xs text-slate-500">
          This venue hosts {venue.capacityMin}–{venue.capacityMax} guests.
        </p>
      </div>

      {/* Packages */}
      <div className="mt-4">
        <p className="mb-2 text-sm font-medium text-slate-700">Select a package</p>
        <div className="space-y-2">
          {venue.packages.map((pkg) => (
            <button
              key={pkg.id}
              onClick={() => setPackageId(pkg.id)}
              className={cn(
                'flex w-full items-center justify-between rounded-xl border p-3 text-left transition-colors',
                packageId === pkg.id
                  ? 'border-brand-500 bg-brand-50/60 ring-1 ring-brand-500'
                  : 'border-slate-200 hover:border-slate-300',
              )}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900">{pkg.name}</span>
                  {pkg.popular && (
                    <span className="rounded bg-accent-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-accent-700">
                      Popular
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-slate-500">{pkg.description}</p>
              </div>
              <div className="flex items-center gap-2 pl-2">
                <span className="text-sm font-semibold text-slate-900">
                  {formatCurrency(pkg.pricePerEvent)}
                </span>
                <span
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-full border',
                    packageId === pkg.id ? 'border-brand-600 bg-brand-600' : 'border-slate-300',
                  )}
                >
                  {packageId === pkg.id && <Check className="h-3 w-3 text-white" />}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-4">
        <PriceSummary pricing={pricing} />
      </div>

      <Button
        fullWidth
        size="lg"
        className="mt-4"
        onClick={handleContinue}
        disabled={venue.availability === 'booked' || isBlocked}
      >
        {isBlocked
          ? 'Not available for this slot'
          : venue.availability === 'booked'
            ? 'Fully booked'
            : 'Continue booking'}
      </Button>
      <p className="mt-2 text-center text-xs text-slate-400">You won’t be charged yet</p>

      {date && (
        <p
          className={cn(
            'mt-1 text-center text-xs',
            isBlocked
              ? 'font-medium text-red-600'
              : availability?.available
                ? 'text-emerald-600'
                : 'text-slate-400',
          )}
        >
          {isFetching && 'Checking availability…'}
          {!isFetching &&
            (isBlocked
              ? AVAILABILITY_MSG[availability!.status] ??
                availability!.message ??
                'Not available.'
              : availability?.available
                ? 'Available for this slot.'
                : '')}
        </p>
      )}
    </div>
  );
}
