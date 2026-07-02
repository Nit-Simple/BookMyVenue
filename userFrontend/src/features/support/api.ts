import { api } from '@/api/axios';
import { endpoints } from '@/api/endpoints';
import type { FaqItem, SupportTicket, TicketPriority } from '@/types';

export interface CreateTicketPayload {
  subject: string;
  category: string;
  message: string;
  priority: TicketPriority;
}

export const supportApi = {
  faqs: async (): Promise<FaqItem[]> => {
    const { data } = await api.get<FaqItem[]>(endpoints.support.faqs);
    return data;
  },
  tickets: async (): Promise<SupportTicket[]> => {
    const { data } = await api.get<SupportTicket[]>(endpoints.support.tickets);
    return data;
  },
  createTicket: async (payload: CreateTicketPayload): Promise<SupportTicket> => {
    const { data } = await api.post<SupportTicket>(endpoints.support.tickets, payload);
    return data;
  },
};
