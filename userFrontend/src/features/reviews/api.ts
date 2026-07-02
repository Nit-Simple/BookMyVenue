import { api } from '@/api/axios';
import { endpoints } from '@/api/endpoints';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/app/store/uiStore';
import { getErrorMessage } from '@/api/axios';
import { venueKeys } from '@/features/venues/queries';
import type { EventCategory, Review } from '@/types';

export interface CreateReviewPayload {
  venueId: string;
  rating: number;
  title: string;
  body: string;
  images: string[];
  eventCategory: EventCategory;
}

export const reviewsApi = {
  create: async (payload: CreateReviewPayload): Promise<Review> => {
    const { data } = await api.post<Review>(endpoints.reviews.create, payload);
    return data;
  },
};

export function useCreateReview() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (payload: CreateReviewPayload) => reviewsApi.create(payload),
    onSuccess: (review) => {
      qc.invalidateQueries({ queryKey: venueKeys.reviews(review.venueId) });
      toast({ variant: 'success', title: 'Review submitted', description: 'Thanks for your feedback!' });
    },
    onError: (err) =>
      toast({ variant: 'error', title: 'Could not submit review', description: getErrorMessage(err) }),
  });
}
