import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/api/auth';
import { setUnauthorizedHandler, tokenStorage } from '@/api/axios';
import { decodeJwt, isTokenExpired } from '@/utils/jwt';
import type { AuthUser, LoginRequest, Role } from '@/types';
import { AuthContext, type AuthContextValue } from './authContext';

const EMAIL_KEY = 'bmv_admin_email';

function userFromToken(token: string | null, email?: string | null): AuthUser | null {
  if (!token) return null;
  const claims = decodeJwt(token);
  if (!claims) return null;
  return {
    id: claims.sub,
    role: (claims.role as Role) ?? 'user',
    email: email ?? localStorage.getItem(EMAIL_KEY) ?? undefined,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const clearSession = useCallback(() => {
    tokenStorage.clear();
    localStorage.removeItem(EMAIL_KEY);
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  // Rehydrate from storage on mount.
  useEffect(() => {
    const access = tokenStorage.getAccess();
    if (access && !isTokenExpired(access)) {
      setUser(userFromToken(access));
    } else if (access) {
      // Expired access token but maybe a valid refresh token — keep the user
      // provisionally; the axios interceptor will refresh on the next call.
      setUser(userFromToken(access));
    }
    setHydrated(true);
  }, []);

  // Auto-logout when a token refresh ultimately fails.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession();
    });
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  const login = useCallback(async (payload: LoginRequest) => {
    const tokens = await authApi.login(payload);
    tokenStorage.set(tokens.access_token, tokens.refresh_token);
    localStorage.setItem(EMAIL_KEY, payload.email);
    setUser(userFromToken(tokens.access_token, payload.email));
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout(tokenStorage.getRefresh());
    clearSession();
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      hydrated,
      login,
      logout,
    }),
    [user, hydrated, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
