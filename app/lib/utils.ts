/**
 * Format large numbers with K/M suffixes
 */
export function formatCount(count: number | undefined): string {
  if (!count) return "";
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return String(count);
}

/**
 * Clean punctuation from a word segment for matching
 */
export function cleanWord(segment: string): string {
  return segment.replace(/[।,;:'"?!()[\]{}॥]+/g, "").trim();
}
