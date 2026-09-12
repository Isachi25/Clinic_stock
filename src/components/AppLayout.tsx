import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { SkipLink } from './SkipLink';
import { TestTools } from './TestTools';

export function AppLayout() {
  const { user, logout, isRefreshing } = useAuth();

  return (
    <div className="min-h-screen">
      <SkipLink />
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link to="/items" className="text-lg font-semibold text-brand-dark">
              Clinic stock
            </Link>
            {user ? (
              <p className="text-sm text-slate-600">
                Signed in as {user.firstName} {user.lastName}
              </p>
            ) : null}
          </div>
          {user ? (
            <button
              type="button"
              onClick={logout}
              className="min-h-11 self-start rounded-md border border-slate-300 px-4 text-base hover:bg-slate-50"
            >
              Sign out
            </button>
          ) : null}
        </div>
      </header>
      {isRefreshing ? (
        <p className="bg-teal-50 px-4 py-2 text-sm text-teal-900" role="status">
          Restoring your session. You can keep working on this page.
        </p>
      ) : null}
      <main id="main-content" className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
      <footer className="mx-auto max-w-6xl px-4 pb-8">
        <TestTools />
      </footer>
    </div>
  );
}
