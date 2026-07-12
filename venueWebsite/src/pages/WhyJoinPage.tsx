import { CheckCircle2, CalendarCheck, CreditCard, LineChart, Headphones, Globe, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui';
import { CTASection } from '@/components/marketing/CTASection';

const REASONS = [
  { icon: Globe, title: 'Reach more customers', desc: 'Get discovered by customers searching for venues in your city.' },
  { icon: CalendarCheck, title: 'Manage bookings easily', desc: 'Accept, track and manage every booking from a single calendar.' },
  { icon: CreditCard, title: 'Get paid on time', desc: 'Collect online payments and advances with automatic settlements.' },
  { icon: LineChart, title: 'Grow with insights', desc: 'Understand your revenue and occupancy with built-in analytics.' },
  { icon: ShieldCheck, title: 'Verified & secure', desc: 'Every booking comes from a verified customer account.' },
  { icon: Headphones, title: 'Partner support', desc: 'Our team is here to help you get the most out of the platform.' },
];

const CHECKLIST = [
  'Free to list — pay only when you get bookings',
  'No long-term contracts',
  'Full control over pricing and availability',
  'Dedicated venue dashboard',
];

export default function WhyJoinPage() {
  return (
    <>
      <section className="border-b border-slate-100 bg-brand-50">
        <div className="container-app py-16 text-center">
          <h1 className="font-display text-4xl font-extrabold text-slate-900">Why join BookMyVenue</h1>
          <p className="mx-auto mt-4 max-w-2xl text-slate-600">
            Everything you need to grow your venue business, in one place.
          </p>
        </div>
      </section>

      <section className="container-app py-16">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {REASONS.map((r) => (
            <Card key={r.title} className="p-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <r.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-4 text-base font-bold text-slate-900">{r.title}</h3>
              <p className="mt-1.5 text-sm text-slate-500">{r.desc}</p>
            </Card>
          ))}
        </div>

        <Card className="mt-10 p-8">
          <h2 className="text-xl font-bold text-slate-900">What you get</h2>
          <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {CHECKLIST.map((c) => (
              <li key={c} className="flex items-center gap-2.5 text-sm text-slate-700">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                {c}
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <CTASection />
    </>
  );
}
