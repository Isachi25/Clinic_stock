export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export const API_BASE = 'https://dummyjson.com';

export function readDemoFlags(search: string = window.location.search): {
  delay: number;
  fault: boolean;
} {
  const params = new URLSearchParams(search);
  const delayRaw = Number(params.get('delay') ?? '0');
  const delay = Number.isFinite(delayRaw)
    ? Math.min(5000, Math.max(0, delayRaw))
    : 0;
  return { delay, fault: params.get('fault') === '500' };
}

type TokenReader = () => string | null;

let readAccessToken: TokenReader = () => null;
let refreshSession: () => Promise<boolean> = () => Promise.resolve(false);
let onSessionLost: () => void = () => undefined;
let refreshInFlight: Promise<boolean> | null = null;

export function configureApiClient(options: {
  getAccessToken: TokenReader;
  refreshSession: () => Promise<boolean>;
  onSessionLost: () => void;
}): void {
  readAccessToken = options.getAccessToken;
  refreshSession = options.refreshSession;
  onSessionLost = options.onSessionLost;
}

function resolveUrl(
  path: string,
  query: Record<string, string | number | undefined>,
  delay: number,
): string {
  const url = new URL(path, API_BASE);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }
  if (delay > 0) {
    url.searchParams.set('delay', String(delay));
  }
  return url.toString();
}

async function parseError(response: Response): Promise<ApiError> {
  let message = `Request failed (${response.status})`;
  try {
    const body = (await response.json()) as { message?: string };
    if (body.message) {
      message = body.message;
    }
  } catch {
    // DummyJSON /http/{code} may not include a JSON message.
  }
  return new ApiError(response.status, message);
}

async function rawFetch(
  url: string,
  init: RequestInit,
  withAuth: boolean,
): Promise<Response> {
  const headers = new Headers(init.headers);
  if (withAuth) {
    const token = readAccessToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }
  return fetch(url, { ...init, headers });
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit & {
    auth?: boolean;
    allowFault?: boolean;
    retryOn401?: boolean;
    query?: Record<string, string | number | undefined>;
  } = {},
): Promise<T> {
  const {
    auth = false,
    allowFault = false,
    retryOn401 = true,
    query = {},
    ...requestInit
  } = init;
  const { delay, fault } = readDemoFlags();
  const url =
    allowFault && fault
      ? resolveUrl('/http/500', {}, delay)
      : resolveUrl(path, query, delay);

  const response = await rawFetch(url, requestInit, auth);

  if (response.status === 401 && auth && retryOn401) {
    refreshInFlight ??= refreshSession().finally(() => {
      refreshInFlight = null;
    });
    const ok = await refreshInFlight;
    if (!ok) {
      onSessionLost();
      throw new ApiError(401, 'Session expired. Please sign in again.');
    }
    const retry = await rawFetch(url, requestInit, true);
    if (!retry.ok) {
      throw await parseError(retry);
    }
    return (await retry.json()) as T;
  }

  if (!response.ok) {
    throw await parseError(response);
  }

  return (await response.json()) as T;
}
