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
export interface BackendCancelResponse {
  booking_id: string;
  status: string;
  cancelled_at: string;
  cancellation_reason: string;
  refund_status: string;
}

export interface CreateBookingResponse {
  booking_id: string;
  booking_reference: string;
  venue_id: string;
  venue_name: string;
  start_time: string;
  end_time: string;
  guest_count: number;
  total_amount: string;
  total_amount_paise: number;
  currency: string;
  status: string;
  razorpay_key_id: string;
  razorpay_order_id: string;
  expires_at: string;
}

export interface PayPayload {
  type: PaymentType;
  method: PaymentMethod;
  amount: number;
  forceFail?: boolean;
}

function toCreatePayload(p: CreateBookingPayload) {
  return {
    venue_id: p.venueId,
    start_time: `${p.eventDate}T${p.startTime}:00+05:30`,
    end_time: `${p.eventDate}T${p.endTime}:00+05:30`,
    guest_count: p.guestCount,
    special_requests: '',
  };
}
function fromCreateResponse(r: CreateBookingResponse, p: CreateBookingPayload): Booking {
  return {
    id: r.booking_id,
    reference: r.booking_reference,
    venueId: r.venue_id,
    venueName: r.venue_name || '',
    venueImage: '',
    venueCity: '',
    userId: '',
    category: p.category,
    packageId: p.packageId,
    packageName: '',
    eventDate: p.eventDate,
    startTime: p.startTime,
    endTime: p.endTime,
    guestCount: r.guest_count,
    status: r.status.toLowerCase() as Booking['status'],
    paymentStatus: 'unpaid',
    pricing: {
      venuePrice: 0,
      guestCharge: 0,
      discount: 0,
      serviceCharge: 0,
      tax: 0,
      total: r.total_amount_paise / 100,
      advanceAmount: 0,
      remainingAmount: 0,
      advanceEligible: false,
    },
    payments: [],
    invoiceId: '',
    refund: null,
    createdAt: r.expires_at,
    cancellationPolicyId: '',
  };
}


function fromCancelResponse(r: BackendCancelResponse, reason: string): { booking: Booking; refund: RefundRecord } {
  return {
    booking: { id: r.booking_id, status: r.status.toLowerCase() } as Booking,
    refund: {
      bookingId: r.booking_id,
      reason: r.cancellation_reason || reason,
      status: r.refund_status === 'PROCESSED' ? 'completed' : 'processing',
      createdAt: r.cancelled_at,
    } as RefundRecord,
  };
}

export const bookingApi = {
  // list: async (): Promise<Booking[]> => {
  //   const { data } = await api.get<Booking[]>(endpoints.bookings.list);
  //   return data;
  // },

  list: async (): Promise<Booking[]> => {
    const { data } = await api.get<{ bookings: Booking[]; total: number; limit: number; offset: number }>(
      endpoints.bookings.list,
      { realApi: true }
    );
    return data.bookings;
  },

  // detail: async (id: string): Promise<Booking> => {
  //   const { data } = await api.get<Booking>(endpoints.bookings.detail(id));
  //   return data;
  // },

  detail: async (id: string): Promise<Booking> => {
    const { data } = await api.get<Booking>(
      endpoints.bookings.detail(id),
      { realApi: true }
    );
    return data;
  },


  // create: async (payload: CreateBookingPayload): Promise<Booking> => {
  //   const { data } = await api.post<Booking>(endpoints.bookings.create, payload);
  //   return data;
  // },

  create: async (payload: CreateBookingPayload): Promise<Booking & { razorpayKeyId: string; razorpayOrderId: string }> => {
    const { data } = await api.post<CreateBookingResponse>(
      endpoints.bookings.create,
      toCreatePayload(payload),
      { realApi: true }
    );
    return { ...fromCreateResponse(data, payload), razorpayKeyId: data.razorpay_key_id, razorpayOrderId: data.razorpay_order_id };
  },

confirm: async (id: string, payload: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
}): Promise<{ id: string; status: string }> => {
    const { data } = await api.post(
        endpoints.bookings.confirm(id),
        payload,
        { realApi: true }
    );
    return { id, status: (data as { status?: string })?.status ?? 'CONFIRMED' };
},

  pay: async (
    id: string,
    payload: PayPayload,
  ): Promise<{ booking: Booking; payment: PaymentRecord }> => {
    const { data } = await api.post(endpoints.bookings.pay(id), payload);
    return data;
  },

  cancel: async (id: string, reason: string) => {
    const { data } = await api.delete<BackendCancelResponse>(
      endpoints.bookings.detail(id), 
      { data: { booking_id: id, reason }, realApi: true }
    );
    return fromCancelResponse(data, reason);
  },


  invoice: async (id: string): Promise<Invoice> => {
    const { data } = await api.get<Invoice>(endpoints.bookings.invoice(id));
    return data;
  },
};
