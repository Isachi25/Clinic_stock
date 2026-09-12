/** Decode the JWT `exp` claim without verifying the signature. DummyJSON tokens are opaque to us. */
export function readAccessTokenExpiry(token: string): number | null {
  const parts = token.split('.');
  if (parts.length < 2) {
    return null;
  }
  try {
    const payload = JSON.parse(atob(parts[1])) as { exp?: unknown };
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}
