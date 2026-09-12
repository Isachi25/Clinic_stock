import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ApiError } from '../api/client';
import {
  fetchProduct,
  updateProductStock,
  type Product,
  type ProductListResponse,
} from '../api/products';
import { QueryStatus } from '../components/QueryStatus';
import { StockBadge } from '../features/items/StockBadge';
import { StockCorrectionForm } from '../features/items/StockCorrectionForm';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const LIST_URL_KEY = 'clinic-stock.listUrl';

export function ItemDetailPage() {
  const { id = '' } = useParams();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const lastAttemptRef = useRef<number | null>(null);
  const listHref = sessionStorage.getItem(LIST_URL_KEY) ?? '/items';
  const demoKey = `${searchParams.get('fault') ?? ''}:${searchParams.get('delay') ?? ''}`;

  const productQuery = useQuery({
    queryKey: ['product', id, demoKey],
    queryFn: ({ signal }) => fetchProduct(id, signal),
    enabled: id !== '',
  });

  const product = productQuery.data;
  useDocumentTitle(
    product ? `${product.title} — Clinic stock` : 'Item — Clinic stock',
  );

  const saveMutation = useMutation({
    mutationFn: (stock: number) => {
      lastAttemptRef.current = stock;
      return updateProductStock(Number(id), stock);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['product', id, demoKey], updated);
      queryClient.setQueriesData<ProductListResponse>(
        { queryKey: ['products'] },
        (current) => {
          if (!current) {
            return current;
          }
          return {
            ...current,
            products: current.products.map((item) =>
              item.id === updated.id ? { ...item, stock: updated.stock } : item,
            ),
          };
        },
      );
    },
  });

  function retrySave() {
    const stock = lastAttemptRef.current;
    if (stock !== null) {
      saveMutation.mutate(stock);
    }
  }

  return (
    <section>
      <p className="text-sm">
        <Link to={listHref} className="text-brand-dark underline">
          Back to stock list
        </Link>
      </p>
      <QueryStatus
        isLoading={productQuery.isPending}
        isError={productQuery.isError || id === ''}
        errorMessage={
          productQuery.error instanceof ApiError
            ? productQuery.error.message
            : 'This item could not be loaded.'
        }
        isEmpty={!product}
        emptyMessage="This item was not found."
        loadingMessage="Loading item…"
        onRetry={() => {
          void productQuery.refetch();
        }}
      >
        {product ? <ItemBody product={product} /> : null}
        {product ? (
          <div className="mt-6">
            <StockCorrectionForm
              currentStock={product.stock}
              isSaving={saveMutation.isPending}
              saveError={
                saveMutation.isError
                  ? saveMutation.error instanceof ApiError
                    ? saveMutation.error.message
                    : 'The stock update failed.'
                  : null
              }
              onSave={(stock) => {
                saveMutation.mutate(stock);
              }}
              onRetry={retrySave}
            />
          </div>
        ) : null}
      </QueryStatus>
    </section>
  );
}

function ItemBody({ product }: { product: Product }) {
  const gallery =
    product.images && product.images.length > 0
      ? product.images
      : [product.thumbnail];

  return (
    <article className="mt-4">
      <h1 className="text-lg font-semibold">{product.title}</h1>
      <p className="mt-1 text-sm text-slate-600">
        SKU {product.sku}
        {product.brand ? ` · ${product.brand}` : ''}
        {` · ${product.category}`}
      </p>
      <div className="mt-4">
        <StockBadge stock={product.stock} />
      </div>
      <div className="mt-4 flex gap-2 overflow-x-auto">
        {gallery.map((src) => (
          <img
            key={src}
            src={src}
            alt=""
            className="h-32 w-32 shrink-0 rounded object-cover"
          />
        ))}
      </div>
      <p className="mt-4 max-w-prose text-base">{product.description}</p>
      {product.tags && product.tags.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {product.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full bg-slate-100 px-3 py-1 text-sm"
            >
              {tag}
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
