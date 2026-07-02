import { create } from 'zustand';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
}

export type ViewMode = 'grid' | 'list';

interface UiState {
  toasts: Toast[];
  pushToast: (toast: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;

  mobileMenuOpen: boolean;
  setMobileMenu: (open: boolean) => void;

  venueViewMode: ViewMode;
  setVenueViewMode: (mode: ViewMode) => void;

  /** Path to return to after the auth flow completes. */
  authRedirect: string | null;
  setAuthRedirect: (path: string | null) => void;
}

let toastCounter = 0;

export const useUiStore = create<UiState>((set, get) => ({
  toasts: [],
  pushToast: (toast) => {
    const id = `toast_${++toastCounter}`;
    set({ toasts: [...get().toasts, { ...toast, id }] });
    // Auto-dismiss after 4.5s.
    setTimeout(() => get().dismissToast(id), 4500);
  },
  dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),

  mobileMenuOpen: false,
  setMobileMenu: (open) => set({ mobileMenuOpen: open }),

  venueViewMode: 'grid',
  setVenueViewMode: (mode) => set({ venueViewMode: mode }),

  authRedirect: null,
  setAuthRedirect: (path) => set({ authRedirect: path }),
}));

/** Convenience hook for firing toasts without selecting the whole store. */
export function useToast() {
  return useUiStore((s) => s.pushToast);
}
