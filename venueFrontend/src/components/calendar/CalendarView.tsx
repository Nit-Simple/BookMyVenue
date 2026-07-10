import { useCallback, useMemo, useState } from 'react';
import { Calendar, dayjsLocalizer, Views, type View } from 'react-big-calendar';
import dayjs from 'dayjs';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { BOOKING_STATUS_META } from '@/constants';
import type { MaintenanceDay, VenueBooking } from '@/types';

const localizer = dayjsLocalizer(dayjs);

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource:
    | { kind: 'booking'; booking: VenueBooking }
    | { kind: 'maintenance'; maintenance: MaintenanceDay };
}

interface CalendarViewProps {
  bookings: VenueBooking[];
  maintenance: MaintenanceDay[];
  onSelectEvent: (event: CalendarEvent) => void;
  onRangeChange?: (range: { start: string; end: string }) => void;
}

export function CalendarView({
  bookings,
  maintenance,
  onSelectEvent,
  onRangeChange,
}: CalendarViewProps) {
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState<Date>(new Date());

  const events = useMemo<CalendarEvent[]>(() => {
    const bookingEvents: CalendarEvent[] = bookings.map((b) => ({
      id: b.booking_id,
      title: `${b.customer_name} · ${b.guest_count} guests`,
      start: new Date(b.start_time),
      end: new Date(b.end_time),
      resource: { kind: 'booking', booking: b },
    }));
    const maintenanceEvents: CalendarEvent[] = maintenance.map((m) => ({
      id: m.id,
      title: `🛠 Maintenance${m.reason ? ` · ${m.reason}` : ''}`,
      start: dayjs(m.date).startOf('day').toDate(),
      end: dayjs(m.date).endOf('day').toDate(),
      allDay: true,
      resource: { kind: 'maintenance', maintenance: m },
    }));
    return [...maintenanceEvents, ...bookingEvents];
  }, [bookings, maintenance]);

  const eventPropGetter = useCallback((event: CalendarEvent) => {
    if (event.resource.kind === 'maintenance') {
      return {
        style: {
          backgroundColor: '#475569',
          borderRadius: 6,
          color: '#fff',
          border: 'none',
        },
      };
    }
    const color = BOOKING_STATUS_META[event.resource.booking.status].color;
    return { style: { backgroundColor: color, borderRadius: 6, border: 'none' } };
  }, []);

  const handleRangeChange = useCallback(
    (range: Date[] | { start: Date; end: Date }) => {
      if (!onRangeChange) return;
      let start: Date;
      let end: Date;
      if (Array.isArray(range)) {
        start = range[0];
        end = range[range.length - 1];
      } else {
        start = range.start;
        end = range.end;
      }
      onRangeChange({
        start: dayjs(start).format('YYYY-MM-DD'),
        end: dayjs(end).format('YYYY-MM-DD'),
      });
    },
    [onRangeChange],
  );

  return (
    <div className="h-[72vh] min-h-[560px] rounded-2xl border border-slate-100 bg-white p-4 shadow-card">
      <Calendar<CalendarEvent>
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        view={view}
        onView={setView}
        date={date}
        onNavigate={setDate}
        views={[Views.MONTH, Views.WEEK, Views.DAY]}
        popup
        onSelectEvent={onSelectEvent}
        eventPropGetter={eventPropGetter}
        onRangeChange={handleRangeChange}
        style={{ height: '100%' }}
      />
    </div>
  );
}
