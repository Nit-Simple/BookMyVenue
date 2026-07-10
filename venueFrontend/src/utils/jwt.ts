/**
 * The backend exposes NO `/me` endpoint — the current user is derived entirely
 * from the JWT access-token claims (`sub`, `role`, `exp`). This decodes the
 * payload without verifying the signature (verification is the server's job;
 * the client only needs the claims for UI/routing decisions).
 */
export interface JwtClaims {
  sub: string;
  role: string;
  exp: number;
  iat?: number;
}

function base64UrlDecode(segment: string): string {
  const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  const binary = atob(padded);
  // Decode UTF-8 safely.
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function decodeJwt(token: string): JwtClaims | null {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const claims = JSON.parse(base64UrlDecode(payload)) as JwtClaims;
    if (!claims.sub) return null;
    return claims;
  } catch {
    return null;
  }
}

/** True when the token is missing or past its `exp` (seconds since epoch). */
export function isTokenExpired(token: string, skewSeconds = 30): boolean {
  const claims = decodeJwt(token);
  if (!claims?.exp) return true;
  return Date.now() / 1000 >= claims.exp - skewSeconds;
}
