import { Link } from 'react-router-dom';
import { Check, Sparkles } from 'lucide-react';
import { Button, Card, Badge } from '@/components/ui';
import { CTASection } from '@/components/marketing/CTASection';

/**
 * Pricing is a PLACEHOLDER (per spec). There is no billing/plans backend for
 * partner commission. Figures below are illustrative. TODO(backend).
 */
const PLANS = [
  {
    name: 'Starter',
    price: 'Free',
    note: 'to list',
    features: ['List one venue', 'Booking calendar', 'Email support', 'Standard visibility'],
    highlighted: false,
  },
  {
    name: 'Growth',
    price: '5%',
    note: 'per booking',
    features: ['Everything in Starter', 'Featured placement', 'Analytics dashboard', 'Priority support'],
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    note: 'for chains',
    features: ['Multiple venues', 'Dedicated manager', 'Custom integrations', 'SLA support'],
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <>
      <section className="border-b border-slate-100 bg-brand-50">
        <div className="container-app py-16 text-center">
          <Badge variant="accent" className="mb-3">
            <Sparkles className="h-3 w-3" /> Placeholder pricing
          </Badge>
          <h1 className="font-display text-4xl font-extrabold text-slate-900">Simple, fair pricing</h1>
          <p className="mx-auto mt-4 max-w-2xl text-slate-600">
            Start free and only pay when you get bookings. Final pricing will be confirmed at launch.
          </p>
        </div>
      </section>

      <section className="container-app py-16">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {PLANS.map((p) => (
            <Card
              key={p.name}
              className={p.highlighted ? 'relative border-brand-200 p-7 ring-2 ring-brand-500' : 'p-7'}
            >
              {p.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-700 px-3 py-0.5 text-xs font-semibold text-white">
                  Most popular
                </span>
              )}
              <h3 className="text-lg font-bold text-slate-900">{p.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="font-display text-4xl font-extrabold text-slate-900">{p.price}</span>
                <span className="text-sm text-slate-500">{p.note}</span>
              </div>
              <ul className="mt-6 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-slate-700">
                    <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/register" className="mt-7 block">
                <Button fullWidth variant={p.highlighted ? 'primary' : 'outline'}>
                  Get started
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      </section>

      <CTASection />
    </>
  );
}
