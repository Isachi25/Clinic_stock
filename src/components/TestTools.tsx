import { useSearchParams } from 'react-router-dom';

export function TestTools() {
  const [searchParams, setSearchParams] = useSearchParams();
  const delay = searchParams.get('delay') === '2000';
  const fault = searchParams.get('fault') === '500';

  function toggle(key: 'delay' | 'fault', value: string, enabled: boolean) {
    const next = new URLSearchParams(searchParams);
    if (enabled) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    setSearchParams(next, { replace: true });
  }

  return (
    <details className="text-sm">
      <summary className="cursor-pointer text-slate-600">
        Assessment test tools
      </summary>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:gap-4">
        <label className="flex min-h-11 items-center gap-2">
          <input
            type="checkbox"
            checked={delay}
            onChange={(event) => {
              toggle('delay', '2000', event.target.checked);
            }}
          />
          Slow requests (delay=2000)
        </label>
        <label className="flex min-h-11 items-center gap-2">
          <input
            type="checkbox"
            checked={fault}
            onChange={(event) => {
              toggle('fault', '500', event.target.checked);
            }}
          />
          Force error (/http/500)
        </label>
      </div>
    </details>
  );
}
