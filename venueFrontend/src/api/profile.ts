import { api } from './axios';
import { endpoints } from './endpoints';
import type {
  CreateVenueRequest,
  VenueApplication,
  VenueDetail,
  VenueListItem,
} from '@/types';

/**
 * Venue profile service — all endpoints are REAL (Go/Gin backend).
 *
 * Backend constraints surfaced by the UI:
 *  - PATCH is only allowed while onboarding_status === 'PENDING_APPROVAL'.
 *  - Media can only be attached at creation (multipart). There is no standalone
 *    add/replace/delete-media route yet → editing media is a TODO(backend).
 */
export const profileApi = {
  async listVenues(): Promise<VenueListItem[]> {
    const { data } = await api.get<VenueListItem[]>(endpoints.venues.list, { realApi: true });
    return data ?? [];
  },

  async getVenue(id: string): Promise<VenueDetail> {
    const { data } = await api.get<VenueDetail>(endpoints.venues.detail(id), { realApi: true });
    return data;
  },

  /**
   * Create a venue. The backend accepts multipart/form-data with a `data` JSON
   * field plus `media` files (≥3 images required, uploaded to Cloudinary).
   */
  async createVenue(payload: CreateVenueRequest, files: File[]): Promise<VenueDetail> {
    const form = new FormData();
    form.append('data', JSON.stringify(payload));
    files.forEach((file) => form.append('media', file));
    const { data } = await api.post<VenueDetail>(endpoints.venues.create, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      realApi: true,
    });
    return data;
  },

  async updateVenue(id: string, patch: Partial<CreateVenueRequest>): Promise<VenueDetail> {
    const { data } = await api.patch<VenueDetail>(endpoints.venues.update(id), patch, { realApi: true });
    return data;
  },

  async listApplications(): Promise<VenueApplication[]> {
    const { data } = await api.get<VenueApplication[]>(endpoints.venues.applications, { realApi: true });
    return data ?? [];
  },
};
