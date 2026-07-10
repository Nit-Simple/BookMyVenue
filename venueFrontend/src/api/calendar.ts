import { api } from './axios';
import { endpoints } from './endpoints';
import type { MaintenanceDay, VenueBooking } from '@/types';

/**
 * Calendar service.
 *
 * TODO(backend): NONE of these endpoints exist yet.
 *  - Bookings are customer-scoped only; there is no venue-manager route to list
 *    a venue's bookings (the repo has GetByVenueAndDateRange / GetVenueDailyBookings
 *    but they are unrouted).
 *  - Maintenance / blackout days have no model, migration or route at all.
 * These call anticipated endpoints served by the mock adapter.
 */
export const calendarApi = {
  async listBookings(
    venueId: string,
    range: { start: string; end: string },
  ): Promise<VenueBooking[]> {
    const { data } = await api.get<VenueBooking[]>(endpoints.calendar.bookings(venueId), {
      params: { start: range.start, end: range.end },
    });
    return data ?? [];
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
