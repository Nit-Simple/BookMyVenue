import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { EventCategory } from '@/types';

/** The draft a user assembles on a venue page and carries into the booking flow. */
export interface BookingDraft {
  venueId: string;
  venueName: string;
  packageId: string;
  category: EventCategory;
  eventDate: string;
  timeSlot: string; // "18:00-23:00"
  startTime: string;
  endTime: string;
  guestCount: number;
}

interface BookingDraftState {
  draft: BookingDraft | null;
  setDraft: (draft: BookingDraft) => void;
  patchDraft: (patch: Partial<BookingDraft>) => void;
  clearDraft: () => void;
}

export const useBookingDraftStore = create<BookingDraftState>()(
  persist(
    (set, get) => ({
      draft: null,
      setDraft: (draft) => set({ draft }),
      patchDraft: (patch) => {
        const current = get().draft;
        if (current) set({ draft: { ...current, ...patch } });
      },
      clearDraft: () => set({ draft: null }),
    }),
    { name: 'bmv_booking_draft' },
  ),
);
