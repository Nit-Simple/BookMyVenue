import { api } from './axios';
import { endpoints } from './endpoints';
import type { LoginRequest, RegisterRequest, TokenResponse } from '@/types';

/**
 * Auth service — mirrors the backend's email/password + JWT flow.
 *
 * Backend notes:
 *  - No phone/OAuth login. No `/me` endpoint (user derived from JWT claims).
 *  - `register` returns a user object (NOT tokens), so we immediately log in
 *    afterwards, matching the customer app's behavior.
 *  - Auth calls use `realApi: true` so they always hit the live backend even
 *    when the mock adapter is enabled for the rest of the app... except we keep
 *    them on the mock too when VITE_USE_MOCK=true (the mock implements them).
 */
export const authApi = {
  async login(payload: LoginRequest): Promise<TokenResponse> {
    const { data } = await api.post<TokenResponse>(endpoints.auth.login, payload);
    return data;
  },

  async register(payload: RegisterRequest): Promise<TokenResponse> {
    // Force the venue-manager role on the portal.
    await api.post(endpoints.auth.register, { ...payload, role: 'venue_manager' });
    // Backend register returns no tokens → log in to obtain them.
    return this.login({ email: payload.email, password: payload.password });
  },

  async logout(refreshToken: string | null): Promise<void> {
    try {
      await api.post(endpoints.auth.logout, { refresh_token: refreshToken });
    } catch {
      // Logout is best-effort; local session is cleared regardless.
    }
  },
};
