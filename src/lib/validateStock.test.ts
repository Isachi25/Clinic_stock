import { describe, expect, it } from 'vitest';
import { parseStockInput } from './validateStock';

describe('parseStockInput', () => {
  it('accepts a whole number including zero', () => {
    expect(parseStockInput('0')).toEqual({ ok: true, stock: 0 });
    expect(parseStockInput('42')).toEqual({ ok: true, stock: 42 });
  });

  it('rejects blanks, decimals and negative values', () => {
    expect(parseStockInput('').ok).toBe(false);
    expect(parseStockInput('1.5').ok).toBe(false);
    expect(parseStockInput('-1').ok).toBe(false);
  });
});
