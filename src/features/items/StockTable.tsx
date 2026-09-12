import { Link } from 'react-router-dom';
import type { Product } from '../../api/products';
import { StockBadge } from './StockBadge';

export function StockTable({ products }: { products: Product[] }) {
  return (
    <div className="hidden overflow-x-auto rounded-lg border border-slate-200 bg-white md:block">
      <table className="w-full border-collapse text-left text-base">
        <caption className="sr-only">Stock items</caption>
        <thead className="bg-slate-50 text-sm">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">
              Item
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              SKU
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Category
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Stock
            </th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} className="border-t border-slate-200">
              <td className="px-4 py-3">
                <Link
                  to={`/items/${product.id}`}
                  className="flex items-center gap-3 text-brand-dark underline-offset-2 hover:underline"
                >
                  <img
                    src={product.thumbnail}
                    alt=""
                    className="h-12 w-12 rounded object-cover"
                  />
                  <span>
                    <span className="block font-medium">{product.title}</span>
                    {product.brand ? (
                      <span className="block text-sm text-slate-600">
                        {product.brand}
                      </span>
                    ) : null}
                  </span>
                </Link>
              </td>
              <td className="px-4 py-3 text-sm">{product.sku}</td>
              <td className="px-4 py-3">{product.category}</td>
              <td className="px-4 py-3">
                <StockBadge stock={product.stock} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
