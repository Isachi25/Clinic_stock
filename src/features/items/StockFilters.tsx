import { SORT_OPTIONS, sortValue, type ListParams } from '../../lib/listParams';

import type { ProductCategory } from '../../api/products';

type StockFiltersProps = {
  params: ListParams;
  searchInput: string;
  categories: ProductCategory[];
  onSearchInput: (value: string) => void;
  onCategory: (value: string) => void;
  onSort: (value: string) => void;
};

export function StockFilters({
  params,
  searchInput,
  categories,
  onSearchInput,
  onCategory,
  onSort,
}: StockFiltersProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div>
        <label
          htmlFor="stock-search"
          className="mb-1 block text-sm font-medium"
        >
          Search
        </label>
        <input
          id="stock-search"
          type="search"
          value={searchInput}
          onChange={(event) => {
            onSearchInput(event.target.value);
          }}
          className="min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-base"
          autoComplete="off"
        />
      </div>
      <div>
        <label
          htmlFor="stock-category"
          className="mb-1 block text-sm font-medium"
        >
          Category
        </label>
        <select
          id="stock-category"
          value={params.category}
          onChange={(event) => {
            onCategory(event.target.value);
          }}
          className="min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-base"
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="stock-sort" className="mb-1 block text-sm font-medium">
          Sort
        </label>
        <select
          id="stock-sort"
          value={sortValue(params)}
          onChange={(event) => {
            onSort(event.target.value);
          }}
          className="min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-base"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
