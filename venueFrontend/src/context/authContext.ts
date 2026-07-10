import { createContext } from 'react';
import type { AuthUser, LoginRequest, RegisterRequest } from '@/types';

export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  /** False until the persisted session has been read from storage. */
  hydrated: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
