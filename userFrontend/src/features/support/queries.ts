import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supportApi, type CreateTicketPayload } from './api';
import { useToast } from '@/app/store/uiStore';
import { getErrorMessage } from '@/api/axios';

export const supportKeys = {
  faqs: ['support', 'faqs'] as const,
  tickets: ['support', 'tickets'] as const,
};

export function useFaqs() {
  return useQuery({ queryKey: supportKeys.faqs, queryFn: supportApi.faqs });
}

export function useTickets() {
  return useQuery({ queryKey: supportKeys.tickets, queryFn: supportApi.tickets });
}

export function useCreateTicket() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (payload: CreateTicketPayload) => supportApi.createTicket(payload),
    onSuccess: (ticket) => {
      qc.invalidateQueries({ queryKey: supportKeys.tickets });
      toast({
        variant: 'success',
        title: 'Ticket created',
        description: `Reference ${ticket.reference}. We’ll respond within 24 hours.`,
      });
    },
    onError: (err) =>
      toast({ variant: 'error', title: 'Could not create ticket', description: getErrorMessage(err) }),
  });
}
