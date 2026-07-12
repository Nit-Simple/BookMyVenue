import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CalendarCheck,
  CreditCard,
  LineChart,
  ShieldCheck,
  Star,
  Users,
  Zap,
  ClipboardList,
  BadgeCheck,
  Rocket,
} from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { CTASection } from '@/components/marketing/CTASection';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.5 },
};

const BENEFITS = [
  { icon: CalendarCheck, title: 'More bookings', desc: 'Reach thousands of customers actively searching for venues like yours.' },
  { icon: CreditCard, title: 'Secure payments', desc: 'Collect advances and payments online with automatic settlements.' },
  { icon: LineChart, title: 'Powerful insights', desc: 'Track revenue, occupancy and booking trends from one dashboard.' },
  { icon: ShieldCheck, title: 'Verified customers', desc: 'Every booking is backed by a verified customer account.' },
];

const STATS = [
  { value: '12k+', label: 'Bookings processed' },
  { value: '1,800+', label: 'Partner venues' },
  { value: '4.8/5', label: 'Partner rating' },
  { value: '30+', label: 'Cities' },
];

const STEPS = [
  { icon: ClipboardList, title: 'Register your venue', desc: 'Fill in your venue details, amenities and photos in a few minutes.' },
  { icon: BadgeCheck, title: 'Get verified', desc: 'Our team reviews and approves your listing to keep quality high.' },
  { icon: Rocket, title: 'Start earning', desc: 'Go live, receive booking requests and manage everything online.' },
];

const TESTIMONIALS = [
  { name: 'Rohan D.', venue: 'Grand Pavilion, Mumbai', quote: 'We doubled our weekend bookings within two months of joining BookMyVenue.' },
  { name: 'Meera S.', venue: 'Lakeview Lawns, Jaipur', quote: 'The dashboard makes managing enquiries and payments effortless.' },
  { name: 'Aditya K.', venue: 'Skyline Rooftop, Bengaluru', quote: 'Verified customers and on-time payouts — exactly what we needed.' },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 to-white">
        <div className="container-app grid items-center gap-10 py-16 lg:grid-cols-2 lg:py-24">
          <motion.div {...fadeUp}>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
              <Zap className="h-3.5 w-3.5" /> Grow your venue business
            </span>
            <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight text-slate-900 sm:text-5xl">
              List your venue. <br />
              <span className="text-brand-700">Fill your calendar.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-slate-600">
              Join India’s fastest-growing venue marketplace. Reach more customers, manage
              bookings, and get paid — all in one place.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register">
                <Button size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  List your venue
                </Button>
              </Link>
              <Link to="/why-join">
                <Button size="lg" variant="outline">
                  Why join?
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <img
              src="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=900&q=80"
              alt="A beautifully decorated venue"
              className="aspect-[4/3] w-full rounded-3xl object-cover shadow-elevated"
            />
            <div className="absolute -bottom-5 -left-5 hidden rounded-2xl bg-white p-4 shadow-card sm:block">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <CalendarCheck className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-900">+38% bookings</p>
                  <p className="text-xs text-slate-500">avg. in first quarter</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="container-app py-16">
        <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-extrabold text-slate-900">Why BookMyVenue</h2>
          <p className="mt-3 text-slate-600">Everything you need to turn your space into a thriving business.</p>
        </motion.div>
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((b, i) => (
            <motion.div key={b.title} {...fadeUp} transition={{ duration: 0.5, delay: i * 0.05 }}>
              <Card className="h-full p-6">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <b.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 text-base font-bold text-slate-900">{b.title}</h3>
                <p className="mt-1.5 text-sm text-slate-500">{b.desc}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="bg-slate-900">
        <div className="container-app grid grid-cols-2 gap-8 py-14 lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-display text-3xl font-extrabold text-white sm:text-4xl">{s.value}</p>
              <p className="mt-1 text-sm text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How onboarding works */}
      <section className="container-app py-16">
        <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-extrabold text-slate-900">How onboarding works</h2>
          <p className="mt-3 text-slate-600">Go from sign-up to your first booking in three simple steps.</p>
        </motion.div>
        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <motion.div key={s.title} {...fadeUp} transition={{ duration: 0.5, delay: i * 0.08 }}>
              <Card className="relative h-full p-6">
                <span className="absolute right-5 top-5 font-display text-4xl font-extrabold text-slate-100">
                  {i + 1}
                </span>
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
                  <s.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 text-base font-bold text-slate-900">{s.title}</h3>
                <p className="mt-1.5 text-sm text-slate-500">{s.desc}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials (mock) */}
      <section className="bg-slate-50">
        <div className="container-app py-16">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-extrabold text-slate-900">Loved by venue partners</h2>
            <p className="mt-3 text-slate-600">Join thousands of owners growing with BookMyVenue.</p>
          </motion.div>
          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={t.name} {...fadeUp} transition={{ duration: 0.5, delay: i * 0.06 }}>
                <Card className="h-full p-6">
                  <div className="flex gap-0.5 text-accent-500">
                    {Array.from({ length: 5 }).map((_, k) => (
                      <Star key={k} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="mt-3 text-sm text-slate-700">“{t.quote}”</p>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                      {t.name[0]}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                      <p className="text-xs text-slate-500">{t.venue}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
          <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <Users className="h-3.5 w-3.5" /> Testimonials shown are illustrative.
          </p>
        </div>
      </section>

      <CTASection />
    </>
  );
}
