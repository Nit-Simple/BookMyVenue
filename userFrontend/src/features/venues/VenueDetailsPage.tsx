import { useParams, Link } from 'react-router-dom';
import { ChevronRight, MapPin, ShieldCheck, Star, Users } from 'lucide-react';
import { useVenue, useVenueReviews } from './queries';
import { VenueGallery } from './components/VenueGallery';
import { BookingWidget } from './components/BookingWidget';
import { SaveButton } from './components/SaveButton';
import { ReviewSection } from '@/features/reviews/components/ReviewSection';
import { CancellationPolicyCard } from '@/features/booking/components/CancellationPolicyCard';
import { DynamicIcon } from '@/utils/icons';
import { Badge, Calendar, DetailSkeleton, ErrorState, Rating } from '@/components/ui';
import { CATEGORY_MAP } from '@/utils/constants';
import { formatCurrency } from '@/utils/format';

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 font-display text-xl font-bold text-slate-900">{children}</h2>;
}

export function VenueDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { data: venue, isLoading, isError, refetch } = useVenue(id);
  const { data: reviews, isLoading: reviewsLoading } = useVenueReviews(id);

  if (isLoading) return <DetailSkeleton />;
  if (isError || !venue)
    return (
      <div className="container-app py-10">
        <ErrorState
          title="Venue not found"
          description="This venue may have been removed or the link is incorrect."
          onRetry={refetch}
        />
      </div>
    );

  const category = CATEGORY_MAP[venue.category];

  return (
    <div className="container-app py-6">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1.5 text-sm text-slate-500">
        <Link to="/" className="hover:text-brand-700">Home</Link>
        <ChevronRight className="h-4 w-4" />
        <Link to="/venues" className="hover:text-brand-700">Venues</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="truncate text-slate-700">{venue.name}</span>
      </nav>

      {/* Title row */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900 sm:text-3xl">
            {venue.name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
            <Rating value={venue.rating} count={venue.reviewCount} />
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4 text-slate-400" />
              {venue.location.address}, {venue.location.city}
            </span>
            <Badge variant="brand">{category.label}</Badge>
          </div>
        </div>
        <SaveButton venueId={venue.id} className="h-10 w-10 border border-slate-200 shadow-none" />
      </div>

      <VenueGallery images={venue.images} name={venue.name} />

      <div className="mt-8 grid gap-10 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-10 lg:col-span-2">
          <div>
            <p className="text-lg font-medium text-brand-800">{venue.tagline}</p>
            <p className="mt-3 leading-relaxed text-slate-600">{venue.description}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <span className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-2.5 text-sm">
                <Users className="h-4 w-4 text-brand-600" />
                <span className="font-medium text-slate-700">
                  {venue.capacityMin}–{venue.capacityMax} guests
                </span>
              </span>
              <span className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-2.5 text-sm">
                <Star className="h-4 w-4 text-amber-400" />
                <span className="font-medium text-slate-700">{venue.rating} rating</span>
              </span>
              <span className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-2.5 text-sm">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span className="font-medium text-slate-700">Verified venue</span>
              </span>
            </div>
          </div>

          {/* Amenities */}
          <div>
            <SectionHeading>Amenities</SectionHeading>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {venue.amenities.map((a) => (
                <div key={a.id} className="flex items-center gap-2.5 text-sm text-slate-700">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                    <DynamicIcon name={a.icon} className="h-4 w-4" />
                  </span>
                  {a.label}
                </div>
              ))}
            </div>
          </div>

          {/* Packages */}
          <div>
            <SectionHeading>Available packages</SectionHeading>
            <div className="grid gap-4 sm:grid-cols-3">
              {venue.packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="flex flex-col rounded-2xl border border-slate-200 p-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900">{pkg.name}</h3>
                    {pkg.popular && <Badge variant="accent">Popular</Badge>}
                  </div>
                  <p className="mt-2 font-display text-xl font-bold text-slate-900">
                    {formatCurrency(pkg.pricePerEvent)}
                  </p>
                  {pkg.pricePerGuest > 0 && (
                    <p className="text-xs text-slate-500">+ {formatCurrency(pkg.pricePerGuest)}/guest</p>
                  )}
                  <ul className="mt-3 space-y-1.5">
                    {pkg.inclusions.map((inc) => (
                      <li key={inc} className="flex items-start gap-2 text-xs text-slate-600">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                        {inc}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Availability calendar */}
          <div>
            <SectionHeading>Availability</SectionHeading>
            <div className="rounded-2xl border border-slate-200 p-5 sm:max-w-sm">
              <Calendar value="" onChange={() => {}} disabledDates={venue.bookedDates} />
              <p className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <span className="h-3 w-3 rounded bg-slate-200" /> Unavailable dates are disabled
              </p>
            </div>
          </div>

          {/* Location */}
          <div>
            <SectionHeading>Location</SectionHeading>
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="flex h-56 items-center justify-center bg-gradient-to-br from-brand-50 to-slate-100">
                <div className="text-center">
                  <MapPin className="mx-auto h-8 w-8 text-brand-600" />
                  <p className="mt-2 font-medium text-slate-700">
                    {venue.location.address}, {venue.location.city}
                  </p>
                  <p className="text-sm text-slate-500">
                    {venue.location.state} · {venue.location.pincode}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Cancellation policy */}
          <div>
            <SectionHeading>Cancellation policy</SectionHeading>
            <CancellationPolicyCard policyId={venue.cancellationPolicyId} />
          </div>

          {/* Reviews */}
          <div id="reviews">
            <SectionHeading>Guest reviews</SectionHeading>
            <ReviewSection
              reviews={reviews}
              isLoading={reviewsLoading}
              averageRating={venue.rating}
            />
          </div>
        </div>

        {/* Right column — sticky booking widget */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-20">
            <BookingWidget venue={venue} />
          </div>
        </div>
      </div>
    </div>
  );
}
