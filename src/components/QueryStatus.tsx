import { useEffect, useRef, type ReactNode } from 'react';

type QueryStatusProps = {
  isLoading: boolean;
  isError: boolean;
  errorMessage: string;
  isEmpty: boolean;
  emptyMessage: string;
  onRetry: () => void;
  loadingMessage: string;
  children: ReactNode;
};

export function QueryStatus({
  isLoading,
  isError,
  errorMessage,
  isEmpty,
  emptyMessage,
  onRetry,
  loadingMessage,
  children,
}: QueryStatusProps) {
  const errorHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (isError) {
      errorHeadingRef.current?.focus();
    }
  }, [isError]);

  if (isLoading) {
    return (
      <p
        className="rounded-lg border border-slate-200 bg-white p-6 text-base"
        role="status"
      >
        {loadingMessage}
      </p>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <h2
          ref={errorHeadingRef}
          tabIndex={-1}
          className="text-lg font-semibold text-red-800"
        >
          Something went wrong
        </h2>
        <p className="mt-2 text-base text-red-900">{errorMessage}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 min-h-11 rounded-md bg-brand px-4 text-base text-white hover:bg-brand-dark"
        >
          Try again
        </button>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <p className="rounded-lg border border-slate-200 bg-white p-6 text-base">
        {emptyMessage}
      </p>
    );
  }

  return children;
}
