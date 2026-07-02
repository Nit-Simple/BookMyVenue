import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Clock, Mail, MessageSquarePlus, Phone, Ticket } from 'lucide-react';
import { useCreateTicket, useTickets } from './queries';
import { Badge, Button, Card, EmptyState, Input, Select, Textarea, Skeleton } from '@/components/ui';
import { formatRelative } from '@/utils/format';
import type { TicketPriority, TicketStatus } from '@/types';

const ticketSchema = z.object({
  subject: z.string().min(4, 'Enter a short subject'),
  category: z.string().min(1, 'Select a category'),
  priority: z.enum(['low', 'medium', 'high']),
  message: z.string().min(15, 'Please describe your issue (15+ characters)'),
});
type TicketValues = z.infer<typeof ticketSchema>;

const CATEGORIES = ['Booking', 'Payments', 'Cancellation', 'Account', 'Venue Issue', 'Other'];

const statusMeta: Record<TicketStatus, { label: string; variant: 'warning' | 'info' | 'success' | 'neutral' }> = {
  open: { label: 'Open', variant: 'warning' },
  in_progress: { label: 'In progress', variant: 'info' },
  resolved: { label: 'Resolved', variant: 'success' },
  closed: { label: 'Closed', variant: 'neutral' },
};

export function SupportPage() {
  const create = useCreateTicket();
  const { data: tickets, isLoading } = useTickets();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TicketValues>({
    resolver: zodResolver(ticketSchema),
    defaultValues: { priority: 'medium', category: 'Booking' },
  });

  return (
    <div className="container-app py-8 lg:py-12">
      <div className="mb-8 max-w-2xl">
        <h1 className="font-display text-3xl font-bold text-slate-900">Customer support</h1>
        <p className="mt-2 text-slate-500">
          Raise a ticket and our team will respond within 24 hours. Looking for a quick answer?{' '}
          <Link to="/faq" className="font-medium text-brand-700 hover:underline">
            Browse the FAQs
          </Link>
          .
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Contact / create ticket */}
        <div className="lg:col-span-3">
          <Card className="p-6">
            <div className="mb-5 flex items-center gap-2">
              <MessageSquarePlus className="h-5 w-5 text-brand-600" />
              <h2 className="font-semibold text-slate-900">Create a ticket</h2>
            </div>
            <form
              onSubmit={handleSubmit((v) =>
                create.mutate(v as { subject: string; category: string; message: string; priority: TicketPriority }, {
                  onSuccess: () => reset({ priority: 'medium', category: 'Booking', subject: '', message: '' }),
                }),
              )}
              className="space-y-4"
            >
              <Input label="Subject" placeholder="Briefly, what's this about?" error={errors.subject?.message} {...register('subject')} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label="Category"
                  options={CATEGORIES.map((c) => ({ value: c, label: c }))}
                  error={errors.category?.message}
                  {...register('category')}
                />
                <Select
                  label="Priority"
                  options={[
                    { value: 'low', label: 'Low' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'high', label: 'High' },
                  ]}
                  error={errors.priority?.message}
                  {...register('priority')}
                />
              </div>
              <Textarea
                label="Message"
                rows={5}
                placeholder="Describe your issue in detail. Include your booking reference if relevant."
                error={errors.message?.message}
                {...register('message')}
              />
              <Button type="submit" isLoading={create.isPending}>
                Submit ticket
              </Button>
            </form>
          </Card>

          {/* Contact channels */}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Card className="flex items-center gap-3 p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <Phone className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">Call us</p>
                <p className="text-sm text-slate-500">1800-123-456 (9 AM–9 PM)</p>
              </div>
            </Card>
            <Card className="flex items-center gap-3 p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <Mail className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">Email us</p>
                <p className="text-sm text-slate-500">hello@bookmyvenue.app</p>
              </div>
            </Card>
          </div>
        </div>

        {/* Ticket list */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <Ticket className="h-5 w-5 text-brand-600" />
              <h2 className="font-semibold text-slate-900">Your tickets</h2>
            </div>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-xl" />
                ))}
              </div>
            ) : !tickets || tickets.length === 0 ? (
              <EmptyState
                icon={Ticket}
                title="No tickets yet"
                description="Raised tickets and their status will appear here."
                className="py-8"
              />
            ) : (
              <div className="space-y-3">
                {tickets.map((t) => {
                  const meta = statusMeta[t.status];
                  return (
                    <div key={t.id} className="rounded-xl border border-slate-100 p-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900">{t.subject}</p>
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-500">{t.message}</p>
                      <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                        <span className="font-mono">{t.reference}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {formatRelative(t.createdAt)}
                        </span>
                        <span>·</span>
                        <span className="capitalize">{t.category}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
