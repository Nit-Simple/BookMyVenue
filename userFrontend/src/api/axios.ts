import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import { dispatch, MockHttpError } from './mockServer';

// Allow any request to opt out of the mock and hit the real backend by passing
// `{ realApi: true }` in its axios config. See `mockAdapter` below.
declare module 'axios' {
  export interface AxiosRequestConfig {
    realApi?: boolean;
  }
}

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

// The real network adapter, captured before we swap in the mock. Requests
// flagged with `realApi: true` are delegated here so they hit BASE_URL.
const realAdapter = axios.getAdapter(['xhr', 'http']);

const ACCESS_TOKEN_KEY = 'bmv_access_token';
const REFRESH_TOKEN_KEY = 'bmv_refresh_token';

export const tokenStorage = {
  getAccess: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  set: (access: string, refresh: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Custom axios adapter that serves responses from the in-browser mock server
 * with realistic latency. To go live against the Go/Gin backend, delete this
 * adapter assignment — every service call already uses real axios semantics.
 */
async function mockAdapter(config: InternalAxiosRequestConfig) {
  // Per-request escape hatch: anything flagged `realApi: true` bypasses the
  // mock entirely and goes to the real backend at BASE_URL.
  if (config.realApi) {
    return realAdapter(config);
  }

  const method = (config.method ?? 'get').toUpperCase();
  const url = (config.url ?? '').replace(config.baseURL ?? '', '');
  const latency = 250 + Math.random() * 450;
  await sleep(latency);

  let body: unknown = config.data;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      /* leave as-is */
    }
  }

  try {
    const { status, data } = dispatch(
      method,
      url,
      body,
      (config.headers ?? {}) as Record<string, string>,
    );
    return {
      data,
      status,
      statusText: 'OK',
      headers: {},
      config,
      request: {},
    };
  } catch (err) {
    if (err instanceof MockHttpError) {
      return Promise.reject(
        axios.AxiosError.from(
          new Error(err.message),
          String(err.status),
          config,
          {},
          {
            data: { message: err.message },
            status: err.status,
            statusText: 'Error',
            headers: {},
            config,
            request: {},
          },
        ),
      );
    }
    throw err;
  }
}

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

if (USE_MOCK) {
  api.defaults.adapter = mockAdapter as never;
}

// Attach the access token to every request.
api.interceptors.request.use((config) => {
  const token = tokenStorage.getAccess();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Refresh-token flow: on a 401, try once to refresh, then replay the request.
let refreshing: Promise<string | null> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;

    if (status === 401 && original && !original._retry && tokenStorage.getRefresh()) {
      original._retry = true;
      refreshing ??= (async () => {
        try {
          // Refresh runs against the real backend, which uses snake_case.
          const res = await api.post(
            '/auth/refresh',
            { refresh_token: tokenStorage.getRefresh() },
            { realApi: true },
          );
          const { access_token, refresh_token } = res.data as {
            access_token: string;
            refresh_token: string;
          };
          tokenStorage.set(access_token, refresh_token);
          return access_token;
        } catch {
          tokenStorage.clear();
          return null;
        } finally {
          refreshing = null;
        }
      })();

      const newToken = await refreshing;
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
    }

    return Promise.reject(error);
  },
);

/** Normalize an axios error into a user-facing message. */
export function getErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    return data?.message ?? error.message ?? fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
