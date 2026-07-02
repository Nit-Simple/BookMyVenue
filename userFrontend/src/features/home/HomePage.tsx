import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BadgeCheck, Headphones, ShieldCheck, Sparkles } from 'lucide-react';
import { SearchBar } from '@/features/venues/components/SearchBar';
import { VenueCarousel } from '@/features/venues/components/VenueCarousel';
import { DynamicIcon } from '@/utils/icons';
import { CATEGORIES } from '@/utils/constants';
import {
  useOfferVenues,
  usePopularVenues,
  useRecommendedVenues,
  useTrendingLocations,
  useTrendingVenues,
} from '@/features/venues/queries';
import { Skeleton } from '@/components/ui';

const trustItems = [
  { icon: BadgeCheck, title: 'Verified venues', text: 'Every listing is reviewed and quality-checked.' },
  { icon: ShieldCheck, title: 'Secure payments', text: 'Pay safely with cards, UPI or wallets.' },
  { icon: Sparkles, title: 'Best price promise', text: 'Exclusive offers you won’t find elsewhere.' },
  { icon: Headphones, title: '24/7 support', text: 'Real people, ready to help any time.' },
];

export function HomePage() {
  const popular = usePopularVenues();
  const trending = useTrendingVenues();
  const recommended = useRecommendedVenues();
  const offers = useOfferVenues();
  const locations = useTrendingLocations();

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1920&q=80"
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/55 to-slate-900/70" />
        </div>

        <div className="container-app relative py-20 sm:py-28 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-medium text-white backdrop-blur">
              <Sparkles className="h-4 w-4" /> 1,000+ premium venues across India
            </span>
            <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight text-white text-balance sm:text-5xl lg:text-6xl">
              Book the perfect venue for every occasion
            </h1>
            <p className="mt-4 max-w-xl text-lg text-slate-200">
              From dream weddings to corporate conferences — discover, compare and book stunning
              venues in minutes.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-8"
          >
            <SearchBar />
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="container-app py-10">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-900">Browse by occasion</h2>
            <p className="mt-1 text-sm text-slate-500">Find venues tailored to your event type</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {CATEGORIES.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to={`/venues?category=${cat.id}`}
                className="group flex h-full flex-col items-start gap-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-card transition-all hover:-translate-y-1 hover:border-brand-200 hover:shadow-card-hover"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700 transition-colors group-hover:bg-brand-700 group-hover:text-white">
                  <DynamicIcon name={cat.icon} className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="font-semibold text-slate-900">{cat.label}</h3>
                  <p className="mt-0.5 text-xs text-slate-500">{cat.description}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <VenueCarousel
        title="Popular venues"
        subtitle="Most booked spaces this month"
        venues={popular.data}
        isLoading={popular.isLoading}
        viewAllHref="/venues?sort=popular"
      />

      {/* Trending locations */}
      <section className="container-app py-8">
        <div className="mb-5">
          <h2 className="font-display text-2xl font-bold text-slate-900">Trending locations</h2>
          <p className="mt-1 text-sm text-slate-500">Explore venues in India’s top cities</p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {locations.isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[4/3] rounded-2xl" />
              ))
            : locations.data?.slice(0, 8).map((loc) => (
                <Link
                  key={loc.city}
                  to={`/venues?city=${encodeURIComponent(loc.city)}`}
                  className="group relative aspect-[4/3] overflow-hidden rounded-2xl"
                >
                  <img
                    src={loc.image}
                    alt={loc.city}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-4 text-white">
                    <h3 className="font-display text-lg font-bold">{loc.city}</h3>
                    <p className="text-sm text-slate-200">{loc.count} venues</p>
                  </div>
                </Link>
              ))}
        </div>
      </section>

      {/* Offers banner + carousel */}
      <section className="bg-gradient-to-br from-brand-700 to-brand-900 py-2">
        <div className="container-app flex flex-col items-center gap-4 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <h2 className="font-display text-2xl font-bold text-white">Special offers</h2>
            <p className="mt-1 text-brand-100">Save big on hand-picked venues — limited time only</p>
          </div>
          <Link
            to="/venues?offersOnly=true"
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 transition-transform hover:scale-105"
          >
            See all offers <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
      <VenueCarousel
        title="Venues with offers"
        venues={offers.data}
        isLoading={offers.isLoading}
        viewAllHref="/venues?offersOnly=true"
      />

      <VenueCarousel
        title="Trending now"
        subtitle="Venues getting a lot of attention"
        venues={trending.data}
        isLoading={trending.isLoading}
        viewAllHref="/venues?sort=popular"
      />

      <VenueCarousel
        title="Recommended for you"
        subtitle="Curated picks based on top ratings"
        venues={recommended.data}
        isLoading={recommended.isLoading}
        viewAllHref="/venues"
      />

      {/* Trust strip */}
      <section className="container-app py-12">
        <div className="grid grid-cols-1 gap-4 rounded-3xl bg-slate-900 p-8 sm:grid-cols-2 lg:grid-cols-4">
          {trustItems.map((item) => (
            <div key={item.title} className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-brand-300">
                <item.icon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-semibold text-white">{item.title}</h3>
                <p className="mt-0.5 text-sm text-slate-400">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
