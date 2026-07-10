import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { calendarApi } from '@/api/calendar';
import { queryKeys } from '@/constants/queryKeys';

export function useVenueBookings(venueId: string | undefined, range: { start: string; end: string }) {
  return useQuery({
    queryKey: queryKeys.calendar.bookings(range),
    queryFn: () => calendarApi.listBookings(venueId as string, range),
    enabled: !!venueId,
  });
}

export function useMaintenanceDays(venueId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.calendar.maintenance(),
    queryFn: () => calendarApi.listMaintenance(venueId as string),
    enabled: !!venueId,
  });
}

export function useAddMaintenance(venueId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { date: string; reason?: string }) =>
      calendarApi.addMaintenance(venueId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.calendar.maintenance() }),
  });
}

export function useRemoveMaintenance(venueId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => calendarApi.removeMaintenance(venueId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.calendar.maintenance() }),
  });
}
