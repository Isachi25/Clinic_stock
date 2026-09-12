export function shouldShowStaleResults(
  typedQuery: string,
  requestedQuery: string,
  isFetching: boolean,
): boolean {
  if (typedQuery.trim() !== requestedQuery.trim()) {
    return false;
  }
  if (isFetching) {
    return false;
  }
  return true;
}
