// Which suggestion values match the text currently typed into a filter
// input — case-insensitive substring match, deduped, capped at `limit`.
// Order follows `values`' own order (callers pass already-loaded trades, so
// this stays a pure client-side derivation with no extra API call).
export function filterSuggestions(values: string[], query: string, limit = 8): string[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];

  const seen = new Set<string>();
  const matches: string[] = [];
  for (const value of values) {
    if (matches.length >= limit) break;
    const trimmed = value.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    if (!key.includes(needle)) continue;
    seen.add(key);
    matches.push(trimmed);
  }
  return matches;
}
