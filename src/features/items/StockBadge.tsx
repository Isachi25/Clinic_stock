import { stockLevel, stockLevelLabel } from '../../lib/stockStatus';

export function StockBadge({ stock }: { stock: number }) {
  const level = stockLevel(stock);
  const colour =
    level === 'out'
      ? 'text-stock-out'
      : level === 'low'
        ? 'text-stock-low'
        : 'text-stock-ok';

  return (
    <span>
      <span className="font-medium">{stock}</span>
      <span className={`ml-2 text-sm ${colour}`}>{stockLevelLabel(stock)}</span>
    </span>
  );
}
