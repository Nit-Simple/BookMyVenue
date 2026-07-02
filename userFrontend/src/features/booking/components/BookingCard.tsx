import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, MapPin, Users } from 'lucide-react';
import type { Booking } from '@/types';
import { Badge, Button } from '@/components/ui';
import { bookingStatusMeta, paymentStatusMeta } from './statusMeta';
import { CancelBookingModal } from './CancelBookingModal';
import { formatCurrency, formatDate } from '@/utils/format';

export function BookingCard({ booking }: { booking: Booking }) {
  const navigate = useNavigate();
  const [cancelOpen, setCancelOpen] = useState(false);
  const status = bookingStatusMeta[booking.status];
  const payment = paymentStatusMeta[booking.paymentStatus];
  const canCancel = booking.status === 'confirmed' || booking.status === 'pending';

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card transition-shadow hover:shadow-card-hover">
      <div className="flex flex-col sm:flex-row">
        <img
          src={booking.venueImage}
          alt={booking.venueName}
          loading="lazy"
          className="h-40 w-full object-cover sm:h-auto sm:w-44"
        />
        <div className="flex flex-1 flex-col p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-display text-base font-bold text-slate-900">{booking.venueName}</h3>
              <p className="mt-0.5 flex items-center gap-1 text-sm text-slate-500">
                <MapPin className="h-3.5 w-3.5" /> {booking.venueCity}
              </p>
            </div>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-slate-600">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-slate-400" /> {formatDate(booking.eventDate)}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-slate-400" /> {booking.guestCount} guests
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant={payment.variant}>{payment.label}</Badge>
            <span className="text-sm font-semibold text-slate-900">
              {formatCurrency(booking.pricing.total)}
            </span>
            <span className="text-xs text-slate-400">· {booking.reference}</span>
          </div>

          <div className="mt-auto flex flex-wrap gap-2 pt-4">
            <Button size="sm" variant="outline" onClick={() => navigate(`/booking/${booking.id}`)}>
              View details
            </Button>
            {canCancel && (
              <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => setCancelOpen(true)}>
                Cancel booking
              </Button>
            )}
          </div>
        </div>
      </div>

      <CancelBookingModal booking={booking} open={cancelOpen} onClose={() => setCancelOpen(false)} />
    </div>
  );
}
