/**
 * Lets `matchMedia` match only the given queries, for code that reads a media query when it
 * is created. Returns the function that puts the old `matchMedia` back.
 */
export function matchOnly(...queries: string[]): () => void {
  const original = window.matchMedia;
  window.matchMedia = ((query: string) => ({
    matches: queries.includes(query),
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  })) as unknown as typeof window.matchMedia;
  return () => (window.matchMedia = original);
}
