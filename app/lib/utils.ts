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

/**
 * Normalize Bengali text by converting decomposed nukta sequences to precomposed forms.
 * Mobile keyboards often produce decomposed forms (base consonant + nukta),
 * while Avro transliteration produces precomposed forms.
 * 
 * Note: JavaScript's normalize('NFC') does NOT handle these Bengali-specific sequences,
 * so we use manual string replacement.
 * 
 * Handles:
 * - ড + ় (U+09A1 + U+09BC) → ড় (U+09DC)
 * - ঢ + ় (U+09A2 + U+09BC) → ঢ় (U+09DD)
 * - য + ় (U+09AF + U+09BC) → য় (U+09DF)
 */
export function normalizeBengali(text: string): string {
  if (!text) return text;
  return text
    .replace(/\u09A1\u09BC/g, "\u09DC")  // DDA + NUKTA → RRA (ড়)
    .replace(/\u09A2\u09BC/g, "\u09DD")  // DDHA + NUKTA → RHA (ঢ়)
    .replace(/\u09AF\u09BC/g, "\u09DF"); // YA + NUKTA → YYA (য়)
}
