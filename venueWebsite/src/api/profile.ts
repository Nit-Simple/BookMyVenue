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
    const { data } = await api.get<VenueListItem[]>(endpoints.venues.list);
    return data ?? [];
  },

  async getVenue(id: string): Promise<VenueDetail> {
    const { data } = await api.get<VenueDetail>(endpoints.venues.detail(id));
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
    // Let axios/the browser set `multipart/form-data; boundary=...` from the
    // FormData. Setting Content-Type manually omits the boundary, which makes
    // the backend fail to parse the multipart body. `undefined` overrides the
    // axios instance default of `application/json` so the boundary is generated.
    // Uploading several images that the backend forwards to Cloudinary can take
    // well over the default 15s axios timeout — a timeout aborts the request
    // (Firefox: NS_BINDING_ABORTED). Give uploads a generous 2-minute window.
    const { data } = await api.post<VenueDetail>(endpoints.venues.create, form, {
      headers: { 'Content-Type': undefined },
      timeout: 120000,
    });
    return data;
  },

  async updateVenue(id: string, patch: Partial<CreateVenueRequest>): Promise<VenueDetail> {
    const { data } = await api.patch<VenueDetail>(endpoints.venues.update(id), patch);
    return data;
  },

  async listApplications(): Promise<VenueApplication[]> {
    const { data } = await api.get<VenueApplication[]>(endpoints.venues.applications);
    return data ?? [];
  },
};
