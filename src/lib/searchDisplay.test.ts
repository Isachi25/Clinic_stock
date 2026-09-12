import { describe, expect, it } from 'vitest';
import { shouldShowStaleResults } from './searchDisplay';

describe('shouldShowStaleResults', () => {
  it('hides results while the typed query differs from the request in flight', () => {
    expect(shouldShowStaleResults('phone', 'ph', false)).toBe(false);
  });

  it('hides previous results while the matching request is still loading', () => {
    expect(shouldShowStaleResults('phone', 'phone', true)).toBe(false);
  });

  it('shows results only when the box matches a completed request', () => {
    expect(shouldShowStaleResults('phone', 'phone', false)).toBe(true);
  });
});
