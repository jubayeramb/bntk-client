import { query } from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";

import { tokenizeToWords } from "@bntk/tokenization";
import { transliterate } from "@bntk/transliteration";

interface WordSuggestion {
  id: number;
  value: string;
  romanized: string;
  similarity: number;
  frequency?: number;
}

interface SpellCheckResult {
  word: string;
  isCorrect: boolean;
  suggestions: WordSuggestion[];
  romanized: string;
  isRareWord?: boolean;
}

interface WordCheckResult {
  word: string;
  exists: boolean;
  frequency: number;
  isRare: boolean;
}

// Minimum frequency threshold - words below this are considered "rare"
const MIN_WORD_FREQUENCY = 80;

/**
 * Ensure required PostgreSQL extensions are enabled
 */
async function ensureExtensions() {
  try {
    await query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
    await query(`CREATE EXTENSION IF NOT EXISTS fuzzystrmatch`);
  } catch (error) {
    console.warn("Could not create extensions (may already exist):", error);
  }
}

/**
 * Bulk check if words exist in the database and get their frequencies
 * Uses word_lookup_mv materialized view for fast lookups
 * Returns a map of word -> { exists, frequency, isRare }
 */
async function checkWordsBulk(
  words: string[],
): Promise<Map<string, WordCheckResult>> {
  if (words.length === 0) return new Map();

  const result = await query<{ value: string; frequency: string }>(
    `
    SELECT 
      value,
      frequency::text
    FROM word_lookup_mv
    WHERE value = ANY($1::text[])
    `,
    [words],
  );

  const resultMap = new Map<string, WordCheckResult>();

  // Initialize all words as not found
  for (const word of words) {
    resultMap.set(word, { word, exists: false, frequency: 0, isRare: false });
  }

  // Update with found words
  for (const row of result) {
    const frequency = parseInt(row.frequency || "0");
    resultMap.set(row.value, {
      word: row.value,
      exists: true,
      frequency,
      isRare: frequency < MIN_WORD_FREQUENCY,
    });
  }

  return resultMap;
}

interface BulkSuggestionInput {
  banglaWord: string;
  romanizedWord: string;
}

/**
 * Get spelling suggestions for multiple words in a single query
 * Uses word_lookup_mv with pre-computed soundex, frequency, and romanized values
 */
async function getPhoneticSuggestionsBulk(
  inputs: BulkSuggestionInput[],
  limit: number = 10,
): Promise<Map<string, WordSuggestion[]>> {
  if (inputs.length === 0) return new Map();

  const banglaWords = inputs.map((i) => i.banglaWord);
  const romanizedWords = inputs.map((i) => i.romanizedWord.toLowerCase());

  const result = await query<{
    input_word: string;
    id: number;
    value: string;
    romanized: string;
    frequency: string;
    similarity: number;
  }>(
    `
    WITH input_words AS (
      SELECT 
        bangla_word,
        romanized_word,
        soundex(romanized_word) as input_soundex
      FROM UNNEST($1::text[], $2::text[]) AS t(bangla_word, romanized_word)
    ),
    -- Use materialized view with pre-computed values
    candidate_words AS (
      SELECT DISTINCT
        iw.bangla_word,
        iw.romanized_word,
        iw.input_soundex,
        wl.id,
        wl.value,
        wl.romanized,
        wl.romanized_soundex,
        wl.frequency
      FROM input_words iw
      CROSS JOIN LATERAL (
        -- Use index-backed lookups on materialized view
        -- Lower the similarity threshold to catch more candidates like ব→ভ swaps
        SELECT id, value, romanized, romanized_soundex, frequency
        FROM word_lookup_mv wl
        WHERE wl.value != iw.bangla_word
          AND wl.frequency >= $3
          AND (
            similarity(wl.value, iw.bangla_word) > 0.15  -- lower threshold for Bangla
            OR similarity(wl.romanized, iw.romanized_word) > 0.15  -- lower threshold for romanized
            OR wl.romanized_soundex = iw.input_soundex  -- pre-computed soundex comparison
          )
        ORDER BY 
          similarity(wl.romanized, iw.romanized_word) DESC,
          wl.frequency DESC
        LIMIT 200
      ) wl
    ),
    scored_words AS (
      SELECT 
        bangla_word as input_word,
        id,
        value,
        romanized,
        frequency,
        LEAST((
          COALESCE(similarity(romanized, romanized_word), 0) * 0.5 + 
          COALESCE(similarity(value, bangla_word), 0) * 0.3 + 
          CASE WHEN romanized_soundex = input_soundex THEN 0.3 ELSE 0 END
        ), 1.0) as similarity,
        CASE WHEN LEAST((
          COALESCE(similarity(romanized, romanized_word), 0) * 0.5 + 
          COALESCE(similarity(value, bangla_word), 0) * 0.3 + 
          CASE WHEN romanized_soundex = input_soundex THEN 0.3 ELSE 0 END
        ), 1.0) >= 0.5 THEN 1 ELSE 0 END as is_high_match
      FROM candidate_words
    ),
    ranked_words AS (
      SELECT 
        input_word,
        id,
        value,
        romanized,
        frequency,
        similarity,
        ROW_NUMBER() OVER (
          PARTITION BY input_word 
          ORDER BY 
            is_high_match DESC,
            CASE WHEN is_high_match = 1 THEN frequency ELSE 0 END DESC,
            similarity DESC
        ) as rank
      FROM scored_words
    )
    SELECT 
      input_word,
      id,
      value,
      romanized,
      frequency::text,
      similarity
    FROM ranked_words
    WHERE rank <= $4
    ORDER BY input_word, rank
    `,
    [banglaWords, romanizedWords, MIN_WORD_FREQUENCY, limit],
  );

  // Group results by input word
  const resultMap = new Map<string, WordSuggestion[]>();

  // Initialize empty arrays for all input words
  for (const input of inputs) {
    resultMap.set(input.banglaWord, []);
  }

  // Populate with results
  for (const row of result) {
    const suggestions = resultMap.get(row.input_word) || [];
    suggestions.push({
      id: row.id,
      value: row.value,
      romanized: row.romanized,
      similarity: row.similarity,
      frequency: parseInt(row.frequency || "0"),
    });
    resultMap.set(row.input_word, suggestions);
  }

  // Re-sort suggestions on server side:
  // - >= 80% similarity: top priority, sorted by similarity descending
  // - >= 50% similarity: sorted by frequency descending
  // - < 50% similarity: sorted by similarity descending
  for (const [word, suggestions] of resultMap) {
    suggestions.sort((a, b) => {
      const aIsVeryHigh = a.similarity >= 0.8;
      const bIsVeryHigh = b.similarity >= 0.8;
      const aIsHigh = a.similarity >= 0.5;
      const bIsHigh = b.similarity >= 0.5;

      // Very high matches (>=80%) come first, sorted by similarity
      if (aIsVeryHigh && !bIsVeryHigh) return -1;
      if (!aIsVeryHigh && bIsVeryHigh) return 1;
      if (aIsVeryHigh && bIsVeryHigh) return b.similarity - a.similarity;

      // High matches (>=50%) come next, sorted by frequency
      if (aIsHigh && !bIsHigh) return -1;
      if (!aIsHigh && bIsHigh) return 1;
      if (aIsHigh && bIsHigh) return (b.frequency || 0) - (a.frequency || 0);

      // Low matches sorted by similarity
      return b.similarity - a.similarity;
    });
    resultMap.set(word, suggestions);
  }

  return resultMap;
}

/**
 * POST /api/spell-check
 * Check spelling and get suggestions for Bangla text
 * Uses bulk queries with materialized views for maximum performance
 */
export async function POST(request: NextRequest) {
  try {
    await ensureExtensions();

    const body = await request.json();
    const { text } = body as { text: string };

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Tokenize text into words using BNTK tokenization
    const allWords = tokenizeToWords(text);

    // All tokenized words are Bangla (tokenizeToWords filters non-Bangla)
    const wordInfo = allWords.map((word) => ({
      word,
      isBangla: true,
      romanized: transliterate(word, { mode: "orva" }),
    }));

    const banglaWords = allWords;

    // Bulk check all Bangla words
    const wordCheckResults = await checkWordsBulk(banglaWords);

    // Find words that need suggestions (don't exist or are rare)
    const wordsNeedingSuggestions: BulkSuggestionInput[] = [];
    for (const info of wordInfo) {
      const checkResult = wordCheckResults.get(info.word);
      if (!checkResult?.exists || checkResult.isRare) {
        wordsNeedingSuggestions.push({
          banglaWord: info.word,
          romanizedWord: info.romanized,
        });
      }
    }

    // Bulk get suggestions for all words that need them
    const suggestionsMap = await getPhoneticSuggestionsBulk(
      wordsNeedingSuggestions,
    );

    // Build final results
    const results: SpellCheckResult[] = wordInfo.map((info) => {
      const checkResult = wordCheckResults.get(info.word);
      const exists = checkResult?.exists ?? false;
      const isRare = checkResult?.isRare ?? false;

      if (exists && !isRare) {
        return {
          word: info.word,
          isCorrect: true,
          suggestions: [],
          romanized: info.romanized,
        };
      }

      return {
        word: info.word,
        isCorrect: false,
        suggestions: suggestionsMap.get(info.word) || [],
        romanized: info.romanized,
        isRareWord: exists && isRare,
      };
    });

    return NextResponse.json({
      success: true,
      results,
      totalWords: allWords.length,
      incorrectWords: results.filter((r) => !r.isCorrect).length,
      rareWords: results.filter((r) => r.isRareWord).length,
    });
  } catch (error) {
    console.error("Spell check error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 },
    );
  }
}

/**
 * GET /api/spell-check
 * Health check endpoint
 */
export async function GET() {
  try {
    await ensureExtensions();

    // Test database connection and materialized view
    const result = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM word_lookup_mv`,
    );

    return NextResponse.json({
      status: "healthy",
      wordCount: parseInt(result[0]?.count || "0"),
      extensions: ["pg_trgm", "fuzzystrmatch"],
      materializedView: "word_lookup_mv",
    });
  } catch (error) {
    return NextResponse.json(
      { status: "error", error: String(error) },
      { status: 500 },
    );
  }
}
