export function parseStockInput(
  value: string,
): { ok: true; stock: number } | { ok: false; message: string } {
  const trimmed = value.trim();
  if (trimmed === '') {
    return { ok: false, message: 'Enter a stock count.' };
  }
  if (!/^\d+$/.test(trimmed)) {
    return { ok: false, message: 'Stock must be a whole number of 0 or more.' };
  }
  const stock = Number(trimmed);
  if (stock > 1_000_000) {
    return { ok: false, message: 'Stock is too large to save.' };
  }
  return { ok: true, stock };
}
