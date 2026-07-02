import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi, type LoginPayload, type RegisterPayload } from './api';
import { useAuthStore } from '@/app/store/authStore';
import { useUiStore, useToast } from '@/app/store/uiStore';
import { getErrorMessage } from '@/api/axios';
import type { AuthSession } from '@/types';

/** Central auth controller: mutations + store + post-login redirect. */
export function useAuth() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const setSession = useAuthStore((s) => s.setSession);
  const logoutStore = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authRedirect = useUiStore((s) => s.authRedirect);
  const setAuthRedirect = useUiStore((s) => s.setAuthRedirect);

  const onSuccess = (session: AuthSession) => {
    setSession(session);
    toast({ variant: 'success', title: `Welcome, ${session.user.name.split(' ')[0]}!` });
    const dest = authRedirect ?? '/';
    setAuthRedirect(null);
    navigate(dest, { replace: true });
  };

  const onError = (err: unknown) => {
    toast({ variant: 'error', title: 'Authentication failed', description: getErrorMessage(err) });
  };

  const loginMutation = useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess,
    onError,
  });

  const registerMutation = useMutation({
    mutationFn: (payload: RegisterPayload) => authApi.register(payload),
    onSuccess,
    onError,
  });

  const sendOtpMutation = useMutation({
    mutationFn: (phone: string) => authApi.sendOtp(phone),
    onError,
  });

  const verifyOtpMutation = useMutation({
    mutationFn: ({ phone, otp }: { phone: string; otp: string }) =>
      authApi.verifyOtp(phone, otp),
    onSuccess,
    onError,
  });

  const googleMutation = useMutation({
    mutationFn: () => authApi.google(),
    onSuccess,
    onError,
  });

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      logoutStore();
      queryClient.clear();
      toast({ variant: 'info', title: 'Signed out' });
      navigate('/');
    }
  };

  return {
    user,
    isAuthenticated,
    loginMutation,
    registerMutation,
    sendOtpMutation,
    verifyOtpMutation,
    googleMutation,
    logout,
  };
}
