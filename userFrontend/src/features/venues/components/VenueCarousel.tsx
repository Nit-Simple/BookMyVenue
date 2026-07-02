import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { Venue } from '@/types';
import { VenueCard } from './VenueCard';
import { VenueCardSkeleton } from '@/components/ui';

interface VenueCarouselProps {
  title: string;
  subtitle?: string;
  venues?: Venue[];
  isLoading?: boolean;
  viewAllHref?: string;
}

/** Horizontally scrolling row of venue cards used across the home page. */
export function VenueCarousel({
  title,
  subtitle,
  venues,
  isLoading,
  viewAllHref,
}: VenueCarouselProps) {
  return (
    <section className="container-app py-8">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
        {viewAllHref && (
          <Link
            to={viewAllHref}
            className="flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-700 hover:gap-2 hover:underline"
          >
            View all <ArrowRight className="h-4 w-4 transition-all" />
          </Link>
        )}
      </div>

      <div className="no-scrollbar -mx-4 flex snap-x gap-5 overflow-x-auto px-4 pb-2">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-72 shrink-0 snap-start">
                <VenueCardSkeleton />
              </div>
            ))
          : venues?.map((venue) => (
              <div key={venue.id} className="w-72 shrink-0 snap-start">
                <VenueCard venue={venue} />
              </div>
            ))}
      </div>
    </section>
  );
}
