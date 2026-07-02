import { api } from '@/api/axios';
import { endpoints } from '@/api/endpoints';
import type {
  Booking,
  EventCategory,
  Invoice,
  PaymentMethod,
  PaymentRecord,
  PaymentType,
  RefundRecord,
} from '@/types';

export interface CreateBookingPayload {
  venueId: string;
  packageId: string;
  category: EventCategory;
  eventDate: string;
  startTime: string;
  endTime: string;
  guestCount: number;
}

export interface PayPayload {
  type: PaymentType;
  method: PaymentMethod;
  amount: number;
  forceFail?: boolean;
}

export const bookingApi = {
  list: async (): Promise<Booking[]> => {
    const { data } = await api.get<Booking[]>(endpoints.bookings.list);
    return data;
  },
  detail: async (id: string): Promise<Booking> => {
    const { data } = await api.get<Booking>(endpoints.bookings.detail(id));
    return data;
  },
  create: async (payload: CreateBookingPayload): Promise<Booking> => {
    const { data } = await api.post<Booking>(endpoints.bookings.create, payload);
    return data;
  },
  pay: async (
    id: string,
    payload: PayPayload,
  ): Promise<{ booking: Booking; payment: PaymentRecord }> => {
    const { data } = await api.post(endpoints.bookings.pay(id), payload);
    return data;
  },
  cancel: async (
    id: string,
    reason: string,
  ): Promise<{ booking: Booking; refund: RefundRecord }> => {
    const { data } = await api.post(endpoints.bookings.cancel(id), { reason });
    return data;
  },
  invoice: async (id: string): Promise<Invoice> => {
    const { data } = await api.get<Invoice>(endpoints.bookings.invoice(id));
    return data;
  },
};
