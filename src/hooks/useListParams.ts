import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  nextListParams,
  parseListParams,
  toSearchParams,
  type ListParams,
} from '../lib/listParams';

export function useListParams(): {
  params: ListParams;
  searchParams: URLSearchParams;
  patchParams: (change: Partial<ListParams>) => void;
} {
  const [searchParams, setSearchParams] = useSearchParams();

  const params = useMemo(() => parseListParams(searchParams), [searchParams]);

  const patchParams = useCallback(
    (change: Partial<ListParams>) => {
      const next = nextListParams(params, change);
      setSearchParams(toSearchParams(next, searchParams), { replace: true });
    },
    [params, searchParams, setSearchParams],
  );

  return { params, searchParams, patchParams };
}
