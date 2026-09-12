import { PAGE_SIZE, paginateItems, type ListParams } from '../lib/listParams';
import { apiFetch } from './client';

export type Product = {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  tags: string[];
  brand?: string;
  sku: string;
  availabilityStatus: string;
  thumbnail: string;
  images: string[];
};

export type ProductCategory = {
  slug: string;
  name: string;
};

export type ProductListResponse = {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
};

const LIST_SELECT =
  'id,title,sku,category,stock,availabilityStatus,thumbnail,brand';

function listQuery(params: ListParams): Record<string, string | number> {
  return {
    limit: PAGE_SIZE,
    skip: (params.page - 1) * PAGE_SIZE,
    sortBy: params.sortBy,
    order: params.order,
    select: LIST_SELECT,
  };
}

export async function fetchCategories(
  signal?: AbortSignal,
): Promise<ProductCategory[]> {
  return apiFetch<ProductCategory[]>('/products/categories', {
    signal,
    allowFault: true,
  });
}

export async function fetchProductList(
  params: ListParams,
  signal?: AbortSignal,
): Promise<ProductListResponse> {
  const query = listQuery(params);

  if (params.q && params.category) {
    const all = await apiFetch<ProductListResponse>('/products/search', {
      signal,
      allowFault: true,
      query: {
        q: params.q,
        limit: 0,
        sortBy: params.sortBy,
        order: params.order,
        select: LIST_SELECT,
      },
    });
    const filtered = all.products.filter(
      (product) => product.category === params.category,
    );
    const page = paginateItems(filtered, params.page);
    return {
      products: page.items,
      total: page.total,
      skip: (page.page - 1) * PAGE_SIZE,
      limit: PAGE_SIZE,
    };
  }

  if (params.q) {
    return apiFetch<ProductListResponse>('/products/search', {
      signal,
      allowFault: true,
      query: { q: params.q, ...query },
    });
  }

  if (params.category) {
    return apiFetch<ProductListResponse>(
      `/products/category/${encodeURIComponent(params.category)}`,
      { signal, allowFault: true, query },
    );
  }

  return apiFetch<ProductListResponse>('/products', {
    signal,
    allowFault: true,
    query,
  });
}

export async function fetchProduct(
  id: string,
  signal?: AbortSignal,
): Promise<Product> {
  return apiFetch<Product>(`/products/${encodeURIComponent(id)}`, {
    signal,
    allowFault: true,
  });
}

export async function updateProductStock(
  id: number,
  stock: number,
): Promise<Product> {
  return apiFetch<Product>(`/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stock }),
    allowFault: true,
  });
}
