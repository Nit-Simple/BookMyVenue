import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { tokenStorage } from '@/api/axios';
import type { AuthSession, AuthTokens, User } from '@/types';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  /** True once the persisted session has been rehydrated from storage. */
  hydrated: boolean;
  setSession: (session: AuthSession) => void;
  setTokens: (tokens: AuthTokens) => void;
  setUser: (user: User) => void;
  setHydrated: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      hydrated: false,

      setSession: (session) => {
        tokenStorage.set(session.tokens.accessToken, session.tokens.refreshToken);
        set({
          user: session.user,
          tokens: session.tokens,
          isAuthenticated: true,
        });
      },

      setTokens: (tokens) => {
        tokenStorage.set(tokens.accessToken, tokens.refreshToken);
        set({ tokens });
      },

      setUser: (user) => set({ user }),
      setHydrated: () => set({ hydrated: true }),

      logout: () => {
        tokenStorage.clear();
        set({ user: null, tokens: null, isAuthenticated: false });
      },
    }),
    {
      name: 'bmv_auth',
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Re-sync the token storage that the axios interceptors read from.
        if (state?.tokens) {
          tokenStorage.set(state.tokens.accessToken, state.tokens.refreshToken);
        }
        state?.setHydrated();
      },
    },
  ),
);
