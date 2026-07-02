import { api, tokenStorage } from '@/api/axios';
import { endpoints } from '@/api/endpoints';
import type { AuthSession, AuthTokens, User } from '@/types';

export interface LoginPayload {
  email?: string;
  phone?: string;
  password?: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
}

// ---------------------------------------------------------------------------
// Real-backend mappers
//
// The Go/Gin backend speaks snake_case and returns tokens and the user object
// separately (login → tokens only, register → user only). The rest of the app
// works with the `AuthSession = { user, tokens }` shape, so we map here.
// ---------------------------------------------------------------------------

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
}

/** Map the backend's snake_case token payload to the app's `AuthTokens`. */
function mapTokens(raw: TokenResponse): AuthTokens {
  return {
    accessToken: raw.access_token,
    refreshToken: raw.refresh_token,
    expiresAt: Date.now() + (raw.expires_in ?? 1800) * 1000,
  };
}

/** Best-effort decode of a JWT payload (no verification — display only). */
function decodeJwt(token: string): Record<string, unknown> {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/**
 * Build the app's `User` from whatever the backend gives us, synthesizing the
 * fields it doesn't return (avatar, preferences, saved venues). `onSuccess` in
 * useAuth only needs `user.name`, so a sensible fallback is enough.
 */
function buildUser(input: {
  id?: string;
  email?: string;
  phone?: string;
  name?: string;
}): User {
  const email = input.email ?? '';
  const name = input.name?.trim() || email.split('@')[0] || 'User';
  return {
    id: input.id ?? email,
    name,
    email,
    phone: input.phone ?? '',
    avatarUrl: '',
    createdAt: new Date().toISOString(),
    preferences: {
      preferredCity: '',
      preferredCategories: [],
      newsletter: false,
      smsAlerts: false,
      currency: 'INR',
    },
    savedVenueIds: [],
  };
}

/** Hit the real /auth/login and assemble a session from tokens + JWT claims. */
async function realLogin(email: string, password: string): Promise<AuthSession> {
  const { data } = await api.post<TokenResponse>(
    endpoints.auth.login,
    { email, password },
    { realApi: true },
  );
  const tokens = mapTokens(data);
  const claims = decodeJwt(tokens.accessToken);
  const user = buildUser({
    id: (claims.user_id ?? claims.sub ?? claims.id) as string | undefined,
    email: (claims.email as string | undefined) ?? email,
    phone: claims.phone as string | undefined,
  });
  return { user, tokens };
}

export const authApi = {
  // --- Real backend ---------------------------------------------------------
  login: async (payload: LoginPayload): Promise<AuthSession> => {
    return realLogin(payload.email ?? '', payload.password ?? '');
  },

  register: async (payload: RegisterPayload): Promise<AuthSession> => {
    // The backend's register returns the user but no tokens, so we register and
    // then log in with the same credentials to obtain a session.
    await api.post(
      endpoints.auth.register,
      { email: payload.email, password: payload.password, phone: payload.phone },
      { realApi: true },
    );
    const session = await realLogin(payload.email, payload.password);
    // Prefer the name the user just typed over the email-derived fallback.
    return { ...session, user: { ...session.user, name: payload.name, phone: payload.phone } };
  },

  logout: async (): Promise<void> => {
    await api.post(
      endpoints.auth.logout,
      { refresh_token: tokenStorage.getRefresh() },
      { realApi: true },
    );
  },

  // --- Mock only (no real backend endpoints exist for these yet) ------------
  sendOtp: async (phone: string): Promise<{ sent: boolean; devOtp: string }> => {
    const { data } = await api.post(endpoints.auth.sendOtp, { phone });
    return data;
  },
  verifyOtp: async (phone: string, otp: string): Promise<AuthSession> => {
    const { data } = await api.post<AuthSession>(endpoints.auth.verifyOtp, { phone, otp });
    return data;
  },
  google: async (): Promise<AuthSession> => {
    const { data } = await api.post<AuthSession>(endpoints.auth.google, {});
    return data;
  },
};
