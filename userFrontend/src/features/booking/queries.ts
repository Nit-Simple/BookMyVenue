import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  bookingApi,
  type CreateBookingPayload,
  type PayPayload,
} from './api';

export const bookingKeys = {
  all: ['bookings'] as const,
  list: ['bookings', 'list'] as const,
  detail: (id: string) => ['bookings', 'detail', id] as const,
  invoice: (id: string) => ['bookings', 'invoice', id] as const,
};

export function useBookings() {
  return useQuery({ queryKey: bookingKeys.list, queryFn: bookingApi.list });
}

export function useBooking(id: string | undefined) {
  return useQuery({
    queryKey: bookingKeys.detail(id ?? ''),
    queryFn: () => bookingApi.detail(id!),
    enabled: !!id,
  });
}

export function useInvoice(id: string | undefined) {
  return useQuery({
    queryKey: bookingKeys.invoice(id ?? ''),
    queryFn: () => bookingApi.invoice(id!),
    enabled: !!id,
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBookingPayload) => bookingApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: bookingKeys.list }),
  });
}

export function usePayBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PayPayload }) =>
      bookingApi.pay(id, payload),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: bookingKeys.list });
      qc.invalidateQueries({ queryKey: bookingKeys.detail(res.booking.id) });
    },
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      bookingApi.cancel(id, reason),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: bookingKeys.list });
      qc.invalidateQueries({ queryKey: bookingKeys.detail(res.booking.id) });
    },
  });
}
