import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarCheck } from 'lucide-react';
import { useBookings } from './queries';
import { BookingCard } from './components/BookingCard';
import { EmptyState, ErrorState, Skeleton, Tabs } from '@/components/ui';
import type { Booking } from '@/types';

type TabKey = 'upcoming' | 'completed' | 'cancelled';

const filterByTab = (bookings: Booking[], tab: TabKey) => {
  switch (tab) {
    case 'upcoming':
      return bookings.filter((b) => b.status === 'confirmed' || b.status === 'pending');
    case 'completed':
      return bookings.filter((b) => b.status === 'completed');
    case 'cancelled':
      return bookings.filter((b) => b.status === 'cancelled');
  }
};

export function MyBookingsPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useBookings();
  const [tab, setTab] = useState<TabKey>('upcoming');

  const bookings = data ?? [];
  const filtered = filterByTab(bookings, tab);

  return (
    <div className="container-app py-6 lg:py-10">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-slate-900 sm:text-3xl">My bookings</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your upcoming, completed and cancelled events.</p>
      </div>

      <div className="mb-6 overflow-x-auto">
        <Tabs<TabKey>
          active={tab}
          onChange={setTab}
          tabs={[
            { value: 'upcoming', label: 'Upcoming', count: filterByTab(bookings, 'upcoming').length },
            { value: 'completed', label: 'Completed', count: filterByTab(bookings, 'completed').length },
            { value: 'cancelled', label: 'Cancelled', count: filterByTab(bookings, 'cancelled').length },
          ]}
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title={`No ${tab} bookings`}
          description={
            tab === 'upcoming'
              ? 'Once you book a venue it’ll show up here. Start exploring to find your perfect space.'
              : `You have no ${tab} bookings yet.`
          }
          action={tab === 'upcoming' ? { label: 'Explore venues', onClick: () => navigate('/venues') } : undefined}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      )}
    </div>
  );
}
