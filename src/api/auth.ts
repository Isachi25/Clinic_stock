import { apiFetch } from './client';

export type AuthUser = {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  image: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type LoginResponse = AuthUser & AuthTokens;

const LOGIN_TTL_MINS = 1;

export async function loginRequest(
  username: string,
  password: string,
): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    retryOn401: false,
    body: JSON.stringify({
      username,
      password,
      expiresInMins: LOGIN_TTL_MINS,
    }),
  });
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  return apiFetch<AuthUser>('/auth/me', { auth: true });
}

export async function refreshRequest(
  refreshToken: string,
): Promise<AuthTokens> {
  return apiFetch<AuthTokens>('/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    retryOn401: false,
    body: JSON.stringify({
      refreshToken,
      expiresInMins: LOGIN_TTL_MINS,
    }),
  });
}
