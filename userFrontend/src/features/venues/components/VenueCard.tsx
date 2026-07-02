import { Link } from 'react-router-dom';
import { MapPin, Users, Tag } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Venue } from '@/types';
import { Badge, Rating } from '@/components/ui';
import { CATEGORY_MAP } from '@/utils/constants';
import { formatCurrency } from '@/utils/format';
import { cn } from '@/utils/cn';
import { SaveButton } from './SaveButton';

const availabilityMeta = {
  available: { label: 'Available', variant: 'success' as const },
  limited: { label: 'Few dates left', variant: 'warning' as const },
  booked: { label: 'Fully booked', variant: 'danger' as const },
};

export function VenueCard({ venue, view = 'grid' }: { venue: Venue; view?: 'grid' | 'list' }) {
  const category = CATEGORY_MAP[venue.category];
  const avail = availabilityMeta[venue.availability];

  if (view === 'list') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="group overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card transition-shadow hover:shadow-card-hover"
      >
        <Link to={`/venues/${venue.id}`} className="flex flex-col sm:flex-row">
          <div className="relative h-52 w-full shrink-0 overflow-hidden sm:h-auto sm:w-72">
            <img
              src={venue.images[0]}
              alt={venue.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {venue.offer && (
              <Badge variant="accent" className="absolute left-3 top-3" icon={<Tag className="h-3 w-3" />}>
                {venue.offer.discountPct}% OFF
              </Badge>
            )}
            <SaveButton venueId={venue.id} className="absolute right-3 top-3" />
          </div>
          <div className="flex flex-1 flex-col p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-lg font-bold text-slate-900">{venue.name}</h3>
                <p className="mt-0.5 flex items-center gap-1 text-sm text-slate-500">
                  <MapPin className="h-3.5 w-3.5" /> {venue.location.city}
                </p>
              </div>
              <Rating value={venue.rating} count={venue.reviewCount} />
            </div>
            <p className="mt-2 line-clamp-2 text-sm text-slate-600">{venue.tagline}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge variant="brand">{category.label}</Badge>
              <Badge variant="neutral" icon={<Users className="h-3 w-3" />}>
                {venue.capacityMin}–{venue.capacityMax}
              </Badge>
              <Badge variant={avail.variant}>{avail.label}</Badge>
            </div>
            <div className="mt-auto flex items-end justify-between pt-4">
              <div>
                <span className="text-xs text-slate-500">Starting from</span>
                <p className="text-xl font-bold text-slate-900">{formatCurrency(venue.startingPrice)}</p>
              </div>
              <span className="text-sm font-semibold text-brand-700 group-hover:underline">
                View details →
              </span>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="group overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card transition-all hover:-translate-y-1 hover:shadow-card-hover"
    >
      <Link to={`/venues/${venue.id}`}>
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={venue.images[0]}
            alt={venue.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
            {venue.offer ? (
              <Badge variant="accent" icon={<Tag className="h-3 w-3" />}>
                {venue.offer.discountPct}% OFF
              </Badge>
            ) : (
              <span />
            )}
            <SaveButton venueId={venue.id} />
          </div>
          <div className="absolute bottom-3 left-3">
            <Badge
              variant={avail.variant}
              className={cn(avail.variant === 'success' && 'bg-white/95')}
            >
              {avail.label}
            </Badge>
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-1 font-display text-base font-bold text-slate-900">
              {venue.name}
            </h3>
            <Rating value={venue.rating} showValue className="shrink-0" />
          </div>
          <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="line-clamp-1">{venue.location.city}</span>
            <span className="text-slate-300">·</span>
            <span className="shrink-0">{category.label}</span>
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
            <Users className="h-3.5 w-3.5" />
            Up to {venue.capacityMax} guests
            <span className="text-slate-300">·</span>
            {venue.reviewCount} reviews
          </div>
          <div className="mt-3 flex items-baseline gap-1 border-t border-slate-100 pt-3">
            <span className="text-lg font-bold text-slate-900">
              {formatCurrency(venue.startingPrice)}
            </span>
            <span className="text-xs text-slate-500">/ event onwards</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
