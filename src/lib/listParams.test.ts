import { describe, expect, it } from 'vitest';
import {
  clampPage,
  nextListParams,
  parseListParams,
  toSearchParams,
  type ListParams,
} from './listParams';

const base: ListParams = {
  q: '',
  category: '',
  sortBy: 'title',
  order: 'asc',
  page: 8,
};

describe('nextListParams', () => {
  it('resets to page 1 when category or sort changes', () => {
    expect(nextListParams(base, { category: 'beauty' }).page).toBe(1);
    expect(nextListParams(base, { sortBy: 'stock', order: 'desc' }).page).toBe(
      1,
    );
  });

  it('keeps the current page when only the page number changes', () => {
    expect(nextListParams(base, { page: 2 }).page).toBe(2);
  });
});

describe('clampPage', () => {
  it('pulls an out-of-range page back onto the last page that has items', () => {
    expect(clampPage(20, 16, 10)).toBe(2);
    expect(clampPage(2, 0, 10)).toBe(1);
  });
});

describe('URL list params', () => {
  it('round-trips search, filter, sort and page so a copied URL restores the view', () => {
    const params: ListParams = {
      q: 'phone',
      category: 'smartphones',
      sortBy: 'stock',
      order: 'desc',
      page: 3,
    };
    const search = toSearchParams(params);
    expect(search.toString()).toBe(
      'q=phone&category=smartphones&sort=stock-desc&page=3',
    );
    expect(parseListParams(search)).toEqual(params);
  });
});
