import { query } from "@/app/lib/db";
import { normalizeBengali } from "@/app/lib/utils";
import { NextRequest, NextResponse } from "next/server";

import { tokenizeToWords } from "@bntk/tokenization";

interface WordPairSuggestion {
  nextWord: string;
  occurance: number;
}

interface GrammarCheckResult {
  prevWord: string;
  currentWord: string;
  position: number;
  isCorrect: boolean;
  currentOccurance: number;
  suggestions: WordPairSuggestion[];
}

interface WordPairInfo {
  prev_value: string;
  next_value: string;
  occurance: number;
}

// Minimum occurrence threshold - pairs below this are considered uncommon
const MIN_PAIR_OCCURANCE = 5;

/**
 * Get word IDs for a list of words from word_lookup_mv
 */
async function getWordIds(words: string[]): Promise<Map<string, number>> {
  if (words.length === 0) return new Map();

  const result = await query<{ id: number; value: string }>(
    `
    SELECT id, value
    FROM word_lookup_mv
    WHERE value = ANY($1::text[])
    `,
    [words]
  );

  const wordIdMap = new Map<string, number>();
  for (const row of result) {
    wordIdMap.set(row.value, row.id);
  }
  return wordIdMap;
}

/**
 * Check word pairs and get suggestions for potentially incorrect pairs
 * Returns the current pair's occurrence and better alternatives
 */
async function checkWordPairs(
  wordPairs: Array<{ prev: string; next: string; position: number }>
): Promise<
  Map<number, { currentOccurance: number; suggestions: WordPairSuggestion[] }>
> {
  if (wordPairs.length === 0) return new Map();

  // Get all unique words
  const allWords = new Set<string>();
  for (const pair of wordPairs) {
    allWords.add(pair.prev);
    allWords.add(pair.next);
  }

  // Get word IDs
  const wordIdMap = await getWordIds([...allWords]);

  // Build prev_ids array for the query
  const prevWords = wordPairs.map((p) => p.prev);
  const prevIds = prevWords
    .map((w) => wordIdMap.get(w))
    .filter((id): id is number => id !== undefined);

  if (prevIds.length === 0) return new Map();

  // Get all word pairs data for the given previous words
  // This query finds the current pair occurrence and top alternatives
  const pairData = await query<WordPairInfo>(
    `
    WITH input_prev_words AS (
      SELECT DISTINCT value, id as prev_id
      FROM word_lookup_mv
      WHERE value = ANY($1::text[])
    )
    SELECT 
      ipw.value as prev_value,
      w_next.value as next_value,
      wp.occurance
    FROM input_prev_words ipw
    JOIN word_pairs wp ON wp.prev_id = ipw.prev_id
    JOIN words w_next ON wp.next_id = w_next.id
    WHERE wp.occurance >= $2
    ORDER BY ipw.value, wp.occurance DESC
    `,
    [prevWords, MIN_PAIR_OCCURANCE]
  );

  // Build a map of prev_word -> list of (next_word, occurrence)
  const pairsByPrev = new Map<string, WordPairInfo[]>();
  for (const row of pairData) {
    const list = pairsByPrev.get(row.prev_value) || [];
    list.push(row);
    pairsByPrev.set(row.prev_value, list);
  }

  // For each input word pair, check if current next word exists and find better alternatives
  const resultMap = new Map<
    number,
    { currentOccurance: number; suggestions: WordPairSuggestion[] }
  >();

  for (const pair of wordPairs) {
    const pairsForPrev = pairsByPrev.get(pair.prev) || [];

    // Find current pair occurrence
    const currentPair = pairsForPrev.find((p) => p.next_value === pair.next);
    const currentOccurance = currentPair?.occurance || 0;

    // Get suggestions: words with higher occurrence than current
    const suggestions: WordPairSuggestion[] = [];
    for (const p of pairsForPrev) {
      // Skip the current word itself
      if (p.next_value === pair.next) continue;

      // Only suggest if occurrence is higher than current
      if (p.occurance > currentOccurance) {
        suggestions.push({
          nextWord: p.next_value,
          occurance: p.occurance,
        });
      }

      // Limit to top 5 suggestions
      if (suggestions.length >= 5) break;
    }

    resultMap.set(pair.position, {
      currentOccurance,
      suggestions,
    });
  }

  return resultMap;
}

/**
 * POST /api/grammar-check
 * Check grammar by analyzing word pair occurrences in Bangla text
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body as { text: string };

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Tokenize text into words using BNTK tokenization
    const rawWords = tokenizeToWords(text);

    // Normalize words to handle decomposed Unicode (mobile keyboards use decomposed nukta)
    const words = rawWords.map((word) => normalizeBengali(word));

    if (words.length < 2) {
      return NextResponse.json({
        success: true,
        results: [],
        totalWords: words.length,
        totalPairs: 0,
        issuesFound: 0,
      });
    }

    // Create word pairs (consecutive words)
    const wordPairs: Array<{ prev: string; next: string; position: number }> =
      [];
    for (let i = 0; i < words.length - 1; i++) {
      wordPairs.push({
        prev: words[i],
        next: words[i + 1],
        position: i + 1, // Position of the "next" word (potential issue)
      });
    }

    // Check all word pairs
    const pairResults = await checkWordPairs(wordPairs);

    // Build final results - only include pairs with potential issues
    const results: GrammarCheckResult[] = [];

    for (const pair of wordPairs) {
      const pairInfo = pairResults.get(pair.position);

      if (pairInfo && pairInfo.suggestions.length > 0) {
        results.push({
          prevWord: pair.prev,
          currentWord: pair.next,
          position: pair.position,
          isCorrect: false,
          currentOccurance: pairInfo.currentOccurance,
          suggestions: pairInfo.suggestions,
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      totalWords: words.length,
      totalPairs: wordPairs.length,
      issuesFound: results.length,
    });
  } catch (error) {
    console.error("Grammar check error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/grammar-check
 * Health check endpoint
 */
export async function GET() {
  try {
    // Test database connection and word_pairs table
    const result = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM word_pairs`
    );

    const wordResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM words`
    );

    return NextResponse.json({
      status: "healthy",
      wordPairsCount: parseInt(result[0]?.count || "0"),
      wordsCount: parseInt(wordResult[0]?.count || "0"),
    });
  } catch (error) {
    return NextResponse.json(
      { status: "error", error: String(error) },
      { status: 500 }
    );
  }
}
