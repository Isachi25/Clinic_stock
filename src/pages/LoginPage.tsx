import { type FormEvent, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/AuthProvider';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

type LoginLocationState = {
  from?: string;
  reason?: string;
};

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LoginLocationState | null;
  const from = state?.from && state.from !== '/login' ? state.from : '/items';

  const [username, setUsername] = useState('emilys');
  const [password, setPassword] = useState('emilyspass');
  const [error, setError] = useState<string | null>(
    state?.reason === 'expired'
      ? 'Your session ended. Sign in again to return to the same page.'
      : null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useDocumentTitle('Sign in — Clinic stock');

  if (user) {
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(username.trim(), password);
      void navigate(from, { replace: true });
    } catch (caught) {
      const message =
        caught instanceof ApiError
          ? caught.message
          : 'Could not sign in. Check your username and password.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-md">
      <h1 className="text-lg font-semibold">Sign in</h1>
      <p className="mt-2 text-base text-slate-600">
        Use any DummyJSON user. The demo account is pre-filled.
      </p>
      <form
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
        className="mt-6 space-y-4 rounded-lg border border-slate-200 bg-white p-4"
      >
        <div>
          <label htmlFor="username" className="mb-1 block text-sm font-medium">
            Username
          </label>
          <input
            id="username"
            name="username"
            autoComplete="username"
            value={username}
            onChange={(event) => {
              setUsername(event.target.value);
            }}
            className="min-h-11 w-full rounded-md border border-slate-300 px-3 text-base"
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
            }}
            className="min-h-11 w-full rounded-md border border-slate-300 px-3 text-base"
            required
          />
        </div>
        {error ? (
          <p className="text-sm text-stock-out" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={isSubmitting}
          className="min-h-11 w-full rounded-md bg-brand px-4 text-base text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </section>
  );
}
