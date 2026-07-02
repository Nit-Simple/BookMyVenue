import axiosClient from "./axiosClient";

function unwrapError(err) {
  const message = err.response?.data?.error || err.response?.data?.message || "Something went wrong";
  throw new Error(message);
}

// Response: domain.UserDB (created user record) — NOT tokens. Caller must
// follow up with login() using the same credentials to actually sign in.
export async function register({ email, password, phone, role }) {
  try {
    const res = await axiosClient.post("/auth/register", { email, password, phone, role });
    return res.data;
  } catch (err) {
    unwrapError(err);
  }
}

// Response: { access_token, refresh_token, expires_in } — no user object.
// Ignore refresh_token here; the server already set it as an httpOnly cookie
// (withCredentials handles sending/receiving it), which is what actually
// protects it. Only access_token should be kept by the frontend, in memory.
export async function login({ email, password }) {
  try {
    const res = await axiosClient.post("/auth/login", { email, password });
    return res.data;
  } catch (err) {
    unwrapError(err);
  }
}

// No body needed — the httpOnly refresh_token cookie is sent automatically
// because axiosClient has withCredentials: true.
export async function refresh() {
  try {
    const res = await axiosClient.post("/auth/refresh");
    return res.data;
  } catch (err) {
    unwrapError(err);
  }
}

export async function logout() {
  try {
    const res = await axiosClient.post("/auth/logout");
    return res.data;
  } catch (err) {
    unwrapError(err);
  }
}

// Decodes the JWT payload WITHOUT verifying the signature — this is the only
// way to read role/sub client-side since login/refresh don't return a user
// object. Fine for display/routing; the Go server still verifies the
// signature on every protected request, so this is not a security boundary.
export function decodeToken(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}