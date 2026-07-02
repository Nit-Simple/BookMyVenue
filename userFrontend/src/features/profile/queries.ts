import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  profileApi,
  type ChangePasswordPayload,
  type UpdateProfilePayload,
} from './api';
import { useAuthStore } from '@/app/store/authStore';
import { useToast } from '@/app/store/uiStore';
import { getErrorMessage } from '@/api/axios';

export const profileKeys = {
  saved: ['profile', 'saved'] as const,
};

export function useSavedVenues() {
  return useQuery({ queryKey: profileKeys.saved, queryFn: profileApi.saved });
}

export function useUpdateProfile() {
  const setUser = useAuthStore((s) => s.setUser);
  const toast = useToast();
  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => profileApi.update(payload),
    onSuccess: (user) => {
      setUser(user);
      toast({ variant: 'success', title: 'Profile updated' });
    },
    onError: (err) =>
      toast({ variant: 'error', title: 'Update failed', description: getErrorMessage(err) }),
  });
}

export function useChangePassword() {
  const toast = useToast();
  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) => profileApi.changePassword(payload),
    onSuccess: () => toast({ variant: 'success', title: 'Password changed successfully' }),
    onError: (err) =>
      toast({ variant: 'error', title: 'Could not change password', description: getErrorMessage(err) }),
  });
}

export function useToggleSaved() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (venueId: string) => profileApi.toggleSaved(venueId),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: profileKeys.saved });
      toast({
        variant: res.saved ? 'success' : 'info',
        title: res.saved ? 'Saved to your list' : 'Removed from saved',
      });
    },
  });
}
