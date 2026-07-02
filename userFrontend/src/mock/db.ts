import {
  generateBookings,
  generateReviews,
  generateUsers,
  generateVenues,
} from './generators';
import { FAQS } from './faqs';
import type {
  Booking,
  FaqItem,
  Invoice,
  Review,
  SupportTicket,
  User,
} from '@/types';

// ---------------------------------------------------------------------------
// In-memory database seeded deterministically. Catalog data (venues, users,
// reviews) is regenerated each load; user-driven mutations (new bookings,
// reviews, tickets, saved venues, profile edits) are persisted to
// localStorage so they survive refreshes — emulating a backend + DB.
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'bmv_db_v1';

interface PersistedState {
  bookings: Booking[];
  reviews: Review[];
  tickets: SupportTicket[];
  invoices: Invoice[];
  savedVenueIds: string[];
  /** Patches applied to the demo user profile. */
  profilePatch: Partial<User> | null;
}

const venues = generateVenues(100);
const users = generateUsers(20);
const baseReviews = generateReviews(venues, users);
const { bookings: baseBookings, invoices: baseInvoices } = generateBookings(venues, users);

// The signed-in demo customer. Their bookings are a slice of the generated set.
const DEMO_USER_ID = 'user_1';
baseBookings.slice(0, 14).forEach((b) => {
  b.userId = DEMO_USER_ID;
});

const faqs: FaqItem[] = FAQS;

function loadPersisted(): PersistedState {
  if (typeof localStorage === 'undefined') return emptyState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as PersistedState;
    return { ...emptyState(), ...parsed };
  } catch {
    return emptyState();
  }
}

function emptyState(): PersistedState {
  return {
    bookings: [],
    reviews: [],
    tickets: [],
    invoices: [],
    savedVenueIds: [],
    profilePatch: null,
  };
}

let persisted = loadPersisted();

function save() {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
  } catch {
    /* storage full / unavailable — non-fatal for a prototype */
  }
}

export const db = {
  // ----- read-only catalog -----
  venues,
  users,
  faqs,

  getDemoUser(): User {
    const base = users.find((u) => u.id === DEMO_USER_ID)!;
    return {
      ...base,
      ...persisted.profilePatch,
      savedVenueIds: persisted.savedVenueIds,
    };
  },

  // ----- reviews -----
  allReviews(): Review[] {
    return [...persisted.reviews, ...baseReviews];
  },
  addReview(review: Review) {
    persisted.reviews = [review, ...persisted.reviews];
    save();
  },

  // ----- bookings -----
  allBookings(): Booking[] {
    return [...persisted.bookings, ...baseBookings];
  },
  getBooking(id: string): Booking | undefined {
    return this.allBookings().find((b) => b.id === id);
  },
  addBooking(booking: Booking) {
    persisted.bookings = [booking, ...persisted.bookings];
    save();
  },
  updateBooking(id: string, patch: Partial<Booking>) {
    const idx = persisted.bookings.findIndex((b) => b.id === id);
    if (idx >= 0) {
      persisted.bookings[idx] = { ...persisted.bookings[idx], ...patch };
      save();
      return persisted.bookings[idx];
    }
    // Mutating a seed booking: clone it into the persisted layer.
    const base = baseBookings.find((b) => b.id === id);
    if (base) {
      const merged = { ...base, ...patch };
      persisted.bookings = [merged, ...persisted.bookings];
      save();
      return merged;
    }
    return undefined;
  },

  // ----- invoices -----
  allInvoices(): Invoice[] {
    return [...persisted.invoices, ...baseInvoices];
  },
  getInvoice(id: string): Invoice | undefined {
    return this.allInvoices().find((i) => i.id === id);
  },
  addInvoice(invoice: Invoice) {
    persisted.invoices = [invoice, ...persisted.invoices];
    save();
  },

  // ----- support tickets -----
  allTickets(): SupportTicket[] {
    return persisted.tickets;
  },
  addTicket(ticket: SupportTicket) {
    persisted.tickets = [ticket, ...persisted.tickets];
    save();
  },

  // ----- saved venues -----
  savedVenueIds(): string[] {
    return persisted.savedVenueIds;
  },
  toggleSavedVenue(venueId: string): boolean {
    const set = new Set(persisted.savedVenueIds);
    let saved: boolean;
    if (set.has(venueId)) {
      set.delete(venueId);
      saved = false;
    } else {
      set.add(venueId);
      saved = true;
    }
    persisted.savedVenueIds = [...set];
    save();
    return saved;
  },

  // ----- profile -----
  patchProfile(patch: Partial<User>) {
    persisted.profilePatch = { ...persisted.profilePatch, ...patch };
    save();
    return this.getDemoUser();
  },

  reset() {
    persisted = emptyState();
    save();
  },
};

export { DEMO_USER_ID };
