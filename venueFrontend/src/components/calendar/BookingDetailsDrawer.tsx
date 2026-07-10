import {
  CalendarDays,
  Clock,
  Hash,
  Mail,
  MessageSquare,
  Phone,
  User,
  Users,
} from 'lucide-react';
import { Drawer } from '@/components/ui';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatCurrency, formatDateLong, formatTimeRange } from '@/utils/format';
import type { VenueBooking } from '@/types';

function Row({ icon: Icon, label, value }: { icon: typeof User; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-medium text-slate-900">{value}</p>
      </div>
    </div>
  );
}

export function BookingDetailsDrawer({
  booking,
  open,
  onClose,
}: {
  booking: VenueBooking | null;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Drawer open={open} onClose={onClose} title="Booking details">
      {booking && (
        <div className="divide-y divide-slate-100">
          <div className="flex items-center justify-between pb-3">
            <span className="font-mono text-sm font-semibold text-brand-700">
              {booking.booking_reference}
            </span>
            <StatusBadge kind="booking" status={booking.status} />
          </div>
          <Row icon={User} label="Customer" value={booking.customer_name} />
          {booking.customer_email && (
            <Row icon={Mail} label="Email" value={booking.customer_email} />
          )}
          {booking.customer_phone && (
            <Row icon={Phone} label="Phone" value={booking.customer_phone} />
          )}
          <Row icon={CalendarDays} label="Date" value={formatDateLong(booking.start_time)} />
          <Row
            icon={Clock}
            label="Time"
            value={formatTimeRange(booking.start_time, booking.end_time)}
          />
          <Row icon={Users} label="Guests" value={booking.guest_count} />
          <Row
            icon={Hash}
            label="Total amount"
            value={formatCurrency(booking.total_amount, booking.currency)}
          />
          {booking.special_requests && (
            <Row icon={MessageSquare} label="Special requests" value={booking.special_requests} />
          )}
        </div>
      )}
    </Drawer>
  );
}
