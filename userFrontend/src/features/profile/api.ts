import { api } from '@/api/axios';
import { endpoints } from '@/api/endpoints';
import type { User, Venue } from '@/types';

export interface UpdateProfilePayload {
  name?: string;
  email?: string;
  phone?: string;
  preferences?: Partial<User['preferences']>;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export const profileApi = {
  get: async (): Promise<User> => {
    const { data } = await api.get<User>(endpoints.profile.get);
    return data;
  },
  update: async (payload: UpdateProfilePayload): Promise<User> => {
    const { data } = await api.patch<User>(endpoints.profile.update, payload);
    return data;
  },
  changePassword: async (payload: ChangePasswordPayload): Promise<void> => {
    await api.post(endpoints.profile.changePassword, payload);
  },
  saved: async (): Promise<Venue[]> => {
    const { data } = await api.get<Venue[]>(endpoints.profile.saved);
    return data;
  },
  toggleSaved: async (venueId: string): Promise<{ saved: boolean }> => {
    const { data } = await api.post(endpoints.profile.toggleSaved(venueId), {});
    return data;
  },
};
