import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Wrench } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { CalendarView, type CalendarEvent } from '@/components/calendar/CalendarView';
import { BookingDetailsDrawer } from '@/components/calendar/BookingDetailsDrawer';
import { MaintenanceDialog } from '@/components/calendar/MaintenanceDialog';
import { Button, PageLoader, ErrorState, EmptyState } from '@/components/ui';
import { BOOKING_STATUS_META } from '@/constants';
import { useMyVenue } from '@/hooks/useVenue';
import { useMaintenanceDays, useVenueBookings } from '@/hooks/useCalendar';
import type { VenueBooking } from '@/types';

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
      {Object.values(BOOKING_STATUS_META).map((m) => (
        <span key={m.label} className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: m.color }} />
          {m.label}
        </span>
      ))}
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#475569' }} />
        Maintenance
      </span>
    </div>
  );
}

export default function CalendarPage() {
  const { venueId, hasVenue, isLoading: venueLoading } = useMyVenue();
  const [range, setRange] = useState({
    start: dayjs().startOf('month').subtract(7, 'day').format('YYYY-MM-DD'),
    end: dayjs().endOf('month').add(7, 'day').format('YYYY-MM-DD'),
  });
  const [selected, setSelected] = useState<VenueBooking | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const bookingsQuery = useVenueBookings(venueId, range);
  const maintenanceQuery = useMaintenanceDays(venueId);

  const bookings = useMemo(() => bookingsQuery.data ?? [], [bookingsQuery.data]);
  const maintenance = useMemo(() => maintenanceQuery.data ?? [], [maintenanceQuery.data]);

  const onSelectEvent = (event: CalendarEvent) => {
    if (event.resource.kind === 'booking') {
      setSelected(event.resource.booking);
      setDrawerOpen(true);
    } else {
      setDialogOpen(true);
    }
  };

  if (venueLoading) return <PageLoader label="Loading calendar…" />;
  if (!hasVenue || !venueId) {
    return (
      <>
        <PageHeader title="Calendar" />
        <EmptyState title="No venue yet" description="Create your venue profile to view its booking calendar." />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Calendar"
        description="View bookings and block maintenance days."
        actions={
          <Button variant="outline" onClick={() => setDialogOpen(true)} leftIcon={<Wrench className="h-4 w-4" />}>
            Maintenance
          </Button>
        }
      />

      <div className="mb-4">
        <Legend />
      </div>

      {bookingsQuery.isError ? (
        <ErrorState
          title="Couldn’t load bookings"
          description="The venue bookings service is unavailable. (Backend route not yet implemented.)"
          onRetry={() => bookingsQuery.refetch()}
        />
      ) : bookingsQuery.isLoading ? (
        <PageLoader label="Loading bookings…" />
      ) : (
        <CalendarView
          bookings={bookings}
          maintenance={maintenance}
          onSelectEvent={onSelectEvent}
          onRangeChange={setRange}
        />
      )}

      <BookingDetailsDrawer
        booking={selected}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
      <MaintenanceDialog
        venueId={venueId}
        maintenance={maintenance}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </>
  );
}
