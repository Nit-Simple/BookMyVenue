import dayjs from 'dayjs';
import { api } from './axios';
import { endpoints } from './endpoints';
import type { MaintenanceDay, ManagerBookingItem, VenueBooking } from '@/types';

/**
 * Calendar service.
 *
 * ✅ Bookings come from the real backend route GET /manager/bookings/venue/:venue_id
 *    (via `realApi: true`), wrapped as `{ bookings, total, limit, offset }`.
 * 🟡 Maintenance / blackout days have no backend model, migration or route yet,
 *    so they are still served by the mock adapter. TODO(backend).
 */
export const calendarApi = {
  async listBookings(
    venueId: string,
    range: { start: string; end: string },
  ): Promise<VenueBooking[]> {
    const { data } = await api.get<{ bookings: ManagerBookingItem[] }>(
      endpoints.calendar.bookings(venueId),
      { params: { limit: 100 }, realApi: true },
    );
    const bookings = (data.bookings ?? []).map((b): VenueBooking => ({
      booking_id: b.id,
      booking_reference: b.booking_reference,
      venue_id: b.venue_id,
      customer_name: b.user_name,
      customer_email: b.user_email,
      customer_phone: b.user_phone,
      start_time: b.start_time,
      end_time: b.end_time,
      guest_count: b.guest_count,
      status: b.status,
      total_amount: Number(b.total_amount),
      currency: b.currency,
    }));
    return bookings.filter(
      (b) =>
        dayjs(b.start_time).isAfter(dayjs(range.start).subtract(1, 'day')) &&
        dayjs(b.start_time).isBefore(dayjs(range.end).add(1, 'day')),
    );
  },

  async listMaintenance(venueId: string): Promise<MaintenanceDay[]> {
    const { data } = await api.get<MaintenanceDay[]>(endpoints.calendar.maintenance(venueId));
    return data ?? [];
  },

  async addMaintenance(
    venueId: string,
    payload: { date: string; reason?: string },
  ): Promise<MaintenanceDay> {
    const { data } = await api.post<MaintenanceDay>(endpoints.calendar.maintenance(venueId), payload);
    return data;
  },

  async removeMaintenance(venueId: string, id: string): Promise<void> {
    await api.delete(endpoints.calendar.maintenanceItem(venueId, id));
  },
};
