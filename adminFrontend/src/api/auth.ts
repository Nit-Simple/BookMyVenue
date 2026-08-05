import { api } from './axios';
import { endpoints } from './endpoints';
import type { LoginRequest, TokenResponse } from '@/types';

/**
 * Admin auth service — email/password + JWT, same `/auth/login` as every role.
 *
 * There is intentionally NO register (the admin portal is internal-only; admins
 * are provisioned out-of-band). There is no `/me` endpoint, so the current admin
 * is derived from the JWT claims (`sub`, `role`).
 * TODO(backend): no forgot-password / change-password endpoints.
 */
export const authApi = {
  async login(payload: LoginRequest): Promise<TokenResponse> {
    const { data } = await api.post<TokenResponse>(endpoints.auth.login, payload, { realApi: true });
    return data;
  },

  async logout(refreshToken: string | null): Promise<void> {
    try {
      await api.post(endpoints.auth.logout, { refresh_token: refreshToken }, { realApi: true });
    } catch {
      // best-effort; local session cleared regardless
    }
  },
};
