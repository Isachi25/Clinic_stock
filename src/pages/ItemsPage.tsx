import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { ApiError } from '../api/client';
import { fetchCategories, fetchProductList } from '../api/products';
import { QueryStatus } from '../components/QueryStatus';
import { Pagination } from '../features/items/Pagination';
import { StockCards } from '../features/items/StockCards';
import { StockFilters } from '../features/items/StockFilters';
import { StockTable } from '../features/items/StockTable';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useListParams } from '../hooks/useListParams';
import { clampPage, parseSortValue } from '../lib/listParams';
import { shouldShowStaleResults } from '../lib/searchDisplay';

const LIST_URL_KEY = 'clinic-stock.listUrl';

export function ItemsPage() {
  const { params, searchParams, patchParams } = useListParams();
  const [searchInput, setSearchInput] = useState(params.q);
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  useDocumentTitle('Stock list — Clinic stock');

  useEffect(() => {
    setSearchInput(params.q);
  }, [params.q]);

  useEffect(() => {
    if (debouncedSearch.trim() !== params.q) {
      patchParams({ q: debouncedSearch.trim() });
    }
  }, [debouncedSearch, params.q, patchParams]);

  useEffect(() => {
    sessionStorage.setItem(
      LIST_URL_KEY,
      `/items${searchParams.toString() ? `?${searchParams.toString()}` : ''}`,
    );
  }, [searchParams]);

  const categoriesQuery = useQuery({
    queryKey: [
      'categories',
      searchParams.get('fault'),
      searchParams.get('delay'),
    ],
    queryFn: ({ signal }) => fetchCategories(signal),
    staleTime: 5 * 60 * 1000,
  });

  const productsQuery = useQuery({
    queryKey: [
      'products',
      params,
      searchParams.get('fault'),
      searchParams.get('delay'),
    ],
    queryFn: ({ signal }) => fetchProductList(params, signal),
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (!productsQuery.data) {
      return;
    }
    const nextPage = clampPage(params.page, productsQuery.data.total);
    if (nextPage !== params.page) {
      patchParams({ page: nextPage });
    }
  }, [params.page, patchParams, productsQuery.data]);

  const showResults = shouldShowStaleResults(
    searchInput,
    params.q,
    productsQuery.isFetching,
  );

  return (
    <section>
      <h1 className="text-lg font-semibold">Stock list</h1>
      <p className="mt-1 text-base text-slate-600">
        Search, filter and open an item to correct its count.
      </p>

      <div className="mt-6">
        {categoriesQuery.isError ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-base text-red-900">
              Categories could not be loaded.
            </p>
            <button
              type="button"
              className="mt-2 min-h-11 rounded-md bg-brand px-4 text-white"
              onClick={() => {
                void categoriesQuery.refetch();
              }}
            >
              Try again
            </button>
          </div>
        ) : null}
        <StockFilters
          params={params}
          searchInput={searchInput}
          categories={categoriesQuery.data ?? []}
          onSearchInput={setSearchInput}
          onCategory={(category) => {
            patchParams({ category });
          }}
          onSort={(value) => {
            patchParams(parseSortValue(value));
          }}
        />
      </div>

      <div className="mt-6">
        <QueryStatus
          isLoading={!showResults || productsQuery.isPending}
          isError={productsQuery.isError}
          errorMessage={
            productsQuery.error instanceof ApiError
              ? productsQuery.error.message
              : 'The stock list could not be loaded.'
          }
          isEmpty={(productsQuery.data?.products.length ?? 0) === 0}
          emptyMessage="No items match this search, category and sort."
          loadingMessage="Loading stock…"
          onRetry={() => {
            void productsQuery.refetch();
          }}
        >
          <StockTable products={productsQuery.data?.products ?? []} />
          <StockCards products={productsQuery.data?.products ?? []} />
          <Pagination
            page={params.page}
            total={productsQuery.data?.total ?? 0}
            onPage={(page) => {
              patchParams({ page });
            }}
          />
        </QueryStatus>
      </div>
    </section>
  );
}
