import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchCurrentUser,
  loginRequest,
  refreshRequest,
  type AuthUser,
} from '../api/auth';
import { configureApiClient } from '../api/client';
import { readAccessTokenExpiry } from '../lib/jwt';
import {
  clearStoredTokens,
  readStoredTokens,
  writeStoredTokens,
} from './storage';

type AuthContextValue = {
  user: AuthUser | null;
  isReady: boolean;
  isRefreshing: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const REFRESH_SKEW_MS = 15_000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const accessTokenRef = useRef<string | null>(null);
  const refreshTokenRef = useRef<string | null>(null);
  const refreshTimerRef = useRef<number | null>(null);
  const lostPlaceRef = useRef<string | null>(null);

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current !== null) {
      window.clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  const logout = useCallback(() => {
    clearRefreshTimer();
    accessTokenRef.current = null;
    refreshTokenRef.current = null;
    clearStoredTokens();
    setUser(null);
  }, [clearRefreshTimer]);

  const applyTokens = useCallback(
    (accessToken: string, refreshToken: string) => {
      accessTokenRef.current = accessToken;
      refreshTokenRef.current = refreshToken;
      writeStoredTokens(accessToken, refreshToken);
    },
    [],
  );

  const refreshSession = useCallback(async (): Promise<boolean> => {
    const refreshToken = refreshTokenRef.current;
    if (!refreshToken) {
      return false;
    }
    setIsRefreshing(true);
    try {
      const tokens = await refreshRequest(refreshToken);
      applyTokens(tokens.accessToken, tokens.refreshToken);
      return true;
    } catch {
      return false;
    } finally {
      setIsRefreshing(false);
    }
  }, [applyTokens]);

  const onSessionLost = useCallback(() => {
    const place = `${window.location.pathname}${window.location.search}`;
    lostPlaceRef.current = place === '/login' ? '/items' : place;
    logout();
    navigate('/login', {
      replace: true,
      state: {
        from: lostPlaceRef.current,
        reason: 'expired',
      },
    });
  }, [logout, navigate]);

  const scheduleRefresh = useCallback(
    (accessToken: string) => {
      clearRefreshTimer();
      const expiry = readAccessTokenExpiry(accessToken);
      if (!expiry) {
        return;
      }
      const wait = Math.max(expiry - Date.now() - REFRESH_SKEW_MS, 0);
      refreshTimerRef.current = window.setTimeout(() => {
        void (async () => {
          const ok = await refreshSession();
          if (!ok) {
            onSessionLost();
            return;
          }
          if (accessTokenRef.current) {
            scheduleRefresh(accessTokenRef.current);
          }
        })();
      }, wait);
    },
    [clearRefreshTimer, onSessionLost, refreshSession],
  );

  useEffect(() => {
    configureApiClient({
      getAccessToken: () => accessTokenRef.current,
      refreshSession,
      onSessionLost,
    });
  }, [onSessionLost, refreshSession]);

  useEffect(() => {
    const { accessToken, refreshToken } = readStoredTokens();
    accessTokenRef.current = accessToken;
    refreshTokenRef.current = refreshToken;

    void (async () => {
      if (!accessToken) {
        setIsReady(true);
        return;
      }
      try {
        const me = await fetchCurrentUser();
        setUser(me);
        scheduleRefresh(accessToken);
      } catch {
        const ok = await refreshSession();
        if (ok) {
          try {
            const me = await fetchCurrentUser();
            setUser(me);
            if (accessTokenRef.current) {
              scheduleRefresh(accessTokenRef.current);
            }
          } catch {
            logout();
          }
        } else {
          logout();
        }
      } finally {
        setIsReady(true);
      }
    })();

    return () => {
      clearRefreshTimer();
    };
  }, [clearRefreshTimer, logout, refreshSession, scheduleRefresh]);

  const login = useCallback(
    async (username: string, password: string) => {
      const result = await loginRequest(username, password);
      applyTokens(result.accessToken, result.refreshToken);
      setUser({
        id: result.id,
        username: result.username,
        firstName: result.firstName,
        lastName: result.lastName,
        email: result.email,
        image: result.image,
      });
      scheduleRefresh(result.accessToken);
    },
    [applyTokens, scheduleRefresh],
  );

  const value = useMemo(
    () => ({ user, isReady, isRefreshing, login, logout }),
    [isReady, isRefreshing, login, logout, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- hook is paired with the provider in this file
export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return value;
}
