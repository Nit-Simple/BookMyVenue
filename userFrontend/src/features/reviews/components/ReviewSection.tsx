import { Star } from 'lucide-react';
import type { Review } from '@/types';
import { Avatar, EmptyState, Rating, Skeleton } from '@/components/ui';
import { formatRelative } from '@/utils/format';

function RatingBars({ reviews }: { reviews: Review[] }) {
  const counts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.round(r.rating) === star).length,
  }));
  const total = reviews.length || 1;
  return (
    <div className="space-y-1.5">
      {counts.map(({ star, count }) => (
        <div key={star} className="flex items-center gap-2 text-xs">
          <span className="flex w-8 items-center gap-0.5 text-slate-500">
            {star} <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-amber-400"
              style={{ width: `${(count / total) * 100}%` }}
            />
          </div>
          <span className="w-6 text-right text-slate-400">{count}</span>
        </div>
      ))}
    </div>
  );
}

export function ReviewSection({
  reviews,
  isLoading,
  averageRating,
}: {
  reviews?: Review[];
  isLoading?: boolean;
  averageRating: number;
}) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <EmptyState
        icon={Star}
        title="No reviews yet"
        description="Be the first to share your experience after your event."
      />
    );
  }

  return (
    <div>
      <div className="mb-6 grid gap-6 rounded-2xl border border-slate-100 bg-slate-50/60 p-5 sm:grid-cols-[auto_1fr] sm:items-center">
        <div className="text-center sm:border-r sm:border-slate-200 sm:pr-8">
          <div className="font-display text-4xl font-bold text-slate-900">
            {averageRating.toFixed(1)}
          </div>
          <Rating value={averageRating} showValue={false} className="mt-1 justify-center" />
          <p className="mt-1 text-xs text-slate-500">{reviews.length} reviews</p>
        </div>
        <RatingBars reviews={reviews} />
      </div>

      <div className="space-y-5">
        {reviews.map((review) => (
          <div key={review.id} className="border-b border-slate-100 pb-5 last:border-0">
            <div className="flex items-start gap-3">
              <Avatar src={review.userAvatar} name={review.userName} size={40} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{review.userName}</p>
                    <p className="text-xs text-slate-400">{formatRelative(review.createdAt)}</p>
                  </div>
                  <Rating value={review.rating} showValue={false} />
                </div>
                <h4 className="mt-2 text-sm font-semibold text-slate-900">{review.title}</h4>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{review.body}</p>
                {review.images.length > 0 && (
                  <div className="mt-3 flex gap-2">
                    {review.images.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt="Review"
                        loading="lazy"
                        className="h-20 w-20 rounded-lg object-cover"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
