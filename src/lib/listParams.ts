export const PAGE_SIZE = 10;

export const SORT_OPTIONS = [
  { value: 'title-asc', label: 'Name A–Z', sortBy: 'title', order: 'asc' },
  { value: 'title-desc', label: 'Name Z–A', sortBy: 'title', order: 'desc' },
  {
    value: 'stock-asc',
    label: 'Stock: low to high',
    sortBy: 'stock',
    order: 'asc',
  },
  {
    value: 'stock-desc',
    label: 'Stock: high to low',
    sortBy: 'stock',
    order: 'desc',
  },
] as const;

export type SortBy = (typeof SORT_OPTIONS)[number]['sortBy'];
export type SortOrder = (typeof SORT_OPTIONS)[number]['order'];
export type SortValue = (typeof SORT_OPTIONS)[number]['value'];

export type ListParams = {
  q: string;
  category: string;
  sortBy: SortBy;
  order: SortOrder;
  page: number;
};

export function sortValue({
  sortBy,
  order,
}: Pick<ListParams, 'sortBy' | 'order'>): SortValue {
  const match = SORT_OPTIONS.find(
    (option) => option.sortBy === sortBy && option.order === order,
  );
  return match?.value ?? 'title-asc';
}

export function parseSortValue(
  value: string,
): Pick<ListParams, 'sortBy' | 'order'> {
  const match = SORT_OPTIONS.find((option) => option.value === value);
  return match
    ? { sortBy: match.sortBy, order: match.order }
    : { sortBy: 'title', order: 'asc' };
}

export function parseListParams(searchParams: URLSearchParams): ListParams {
  const sort = parseSortValue(searchParams.get('sort') ?? '');
  const pageRaw = Number(searchParams.get('page') ?? '1');
  const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  return {
    q: (searchParams.get('q') ?? '').trim(),
    category: searchParams.get('category') ?? '',
    sortBy: sort.sortBy,
    order: sort.order,
    page,
  };
}

export function toSearchParams(
  params: ListParams,
  extras?: URLSearchParams,
): URLSearchParams {
  const next = new URLSearchParams();
  if (params.q) {
    next.set('q', params.q);
  }
  if (params.category) {
    next.set('category', params.category);
  }
  next.set('sort', sortValue(params));
  if (params.page > 1) {
    next.set('page', String(params.page));
  }

  const delay = extras?.get('delay');
  const fault = extras?.get('fault');
  if (delay) {
    next.set('delay', delay);
  }
  if (fault) {
    next.set('fault', fault);
  }

  return next;
}

/**
 * Filter and sort changes reset to page 1 so a previous deep page
 * cannot land on an empty result set.
 */
export function nextListParams(
  current: ListParams,
  change: Partial<ListParams>,
): ListParams {
  const filterChanged =
    (change.q !== undefined && change.q !== current.q) ||
    (change.category !== undefined && change.category !== current.category) ||
    (change.sortBy !== undefined && change.sortBy !== current.sortBy) ||
    (change.order !== undefined && change.order !== current.order);

  return {
    ...current,
    ...change,
    page: change.page ?? (filterChanged ? 1 : current.page),
  };
}

export function clampPage(
  page: number,
  totalItems: number,
  pageSize: number = PAGE_SIZE,
): number {
  if (totalItems <= 0) {
    return 1;
  }
  const lastPage = Math.ceil(totalItems / pageSize);
  return Math.min(Math.max(1, page), lastPage);
}

export function paginateItems<T>(
  items: T[],
  page: number,
  pageSize: number = PAGE_SIZE,
): { items: T[]; total: number; page: number } {
  const safePage = clampPage(page, items.length, pageSize);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    page: safePage,
  };
}
