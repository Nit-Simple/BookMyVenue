import { Building2, Heart, Target } from 'lucide-react';
import { Card } from '@/components/ui';
import { CTASection } from '@/components/marketing/CTASection';

const VALUES = [
  { icon: Target, title: 'Our mission', desc: 'To help every venue owner reach more customers and run a thriving business online.' },
  { icon: Heart, title: 'Partner-first', desc: 'We build tools that put venue partners in control of their bookings and revenue.' },
  { icon: Building2, title: 'Quality listings', desc: 'Every venue is verified, so customers and partners can transact with confidence.' },
];

export default function AboutPage() {
  return (
    <>
      <section className="border-b border-slate-100 bg-brand-50">
        <div className="container-app py-16 text-center">
          <h1 className="font-display text-4xl font-extrabold text-slate-900">About BookMyVenue</h1>
          <p className="mx-auto mt-4 max-w-2xl text-slate-600">
            BookMyVenue is a marketplace connecting customers with the perfect venue for every
            occasion — and giving venue owners the tools to grow.
          </p>
        </div>
      </section>

      <section className="container-app grid grid-cols-1 gap-5 py-16 md:grid-cols-3">
        {VALUES.map((v) => (
          <Card key={v.title} className="p-6">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <v.icon className="h-6 w-6" />
            </span>
            <h3 className="mt-4 text-base font-bold text-slate-900">{v.title}</h3>
            <p className="mt-1.5 text-sm text-slate-500">{v.desc}</p>
          </Card>
        ))}
      </section>

      <CTASection />
    </>
  );
}
