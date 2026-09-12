import { Link } from 'react-router-dom';
import type { Product } from '../../api/products';
import { StockBadge } from './StockBadge';

export function StockCards({ products }: { products: Product[] }) {
  return (
    <ul className="grid gap-3 md:hidden">
      {products.map((product) => (
        <li key={product.id}>
          <Link
            to={`/items/${product.id}`}
            className="flex gap-3 rounded-lg border border-slate-200 bg-white p-4"
          >
            <img
              src={product.thumbnail}
              alt=""
              className="h-16 w-16 rounded object-cover"
            />
            <span className="min-w-0">
              <span className="block text-base font-medium">
                {product.title}
              </span>
              <span className="mt-1 block text-sm text-slate-600">
                SKU {product.sku}
              </span>
              <span className="mt-1 block text-sm">{product.category}</span>
              <span className="mt-2 block">
                <StockBadge stock={product.stock} />
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
