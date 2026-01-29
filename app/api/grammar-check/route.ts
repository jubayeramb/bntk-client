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

// Minimum ratio threshold - only suggest if alternative is N times more common
const MIN_RATIO = 2.0;

interface GrammarCheckRequestBody {
  text: string;
  minOccurance?: number;
  minRatio?: number;
}

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
  wordPairs: Array<{ prev: string; next: string; position: number }>,
  minOccurance: number,
  minRatio: number
): Promise<
  Map<number, { currentOccurance: number; suggestions: WordPairSuggestion[] }>
> {
  if (wordPairs.length === 0) return new Map();

  const allWords = new Set<string>();
  for (const pair of wordPairs) {
    allWords.add(pair.prev);
    allWords.add(pair.next);
  }

  const wordIdMap = await getWordIds([...allWords]);

  const prevIds: number[] = [];
  const prevIdToWord = new Map<number, string>();
  for (const pair of wordPairs) {
    const id = wordIdMap.get(pair.prev);
    if (id !== undefined && !prevIdToWord.has(id)) {
      prevIds.push(id);
      prevIdToWord.set(id, pair.prev);
    }
  }

  if (prevIds.length === 0) return new Map();

  interface WordPairInfoWithId extends WordPairInfo {
    prev_id: number;
  }

  const pairData = await query<WordPairInfoWithId>(
    `
    SELECT 
      wp.prev_id,
      w_prev.value as prev_value,
      w_next.value as next_value,
      wp.occurance
    FROM word_pairs wp
    JOIN words w_prev ON wp.prev_id = w_prev.id
    JOIN words w_next ON wp.next_id = w_next.id
    WHERE wp.prev_id = ANY($1::int[])
      AND wp.occurance >= $2
    ORDER BY wp.prev_id, wp.occurance DESC
    `,
    [prevIds, minOccurance]
  );

  const pairsByPrev = new Map<string, WordPairInfo[]>();
  for (const row of pairData) {
    const list = pairsByPrev.get(row.prev_value) || [];
    list.push(row);
    pairsByPrev.set(row.prev_value, list);
  }

  const resultMap = new Map<
    number,
    { currentOccurance: number; suggestions: WordPairSuggestion[] }
  >();

  for (const pair of wordPairs) {
    const pairsForPrev = pairsByPrev.get(pair.prev) || [];

    const currentPair = pairsForPrev.find((p) => p.next_value === pair.next);
    const currentOccurance = currentPair?.occurance || 0;

    const suggestions: WordPairSuggestion[] = [];
    for (const p of pairsForPrev) {
      if (p.next_value === pair.next) continue;

      const ratio =
        currentOccurance > 0 ? p.occurance / currentOccurance : Infinity;

      if (ratio >= minRatio) {
        suggestions.push({
          nextWord: p.next_value,
          occurance: p.occurance,
        });
      }

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
    const body = (await request.json()) as GrammarCheckRequestBody;
    const { text, minOccurance = MIN_PAIR_OCCURANCE, minRatio = MIN_RATIO } =
      body;

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

    const pairResults = await checkWordPairs(wordPairs, minOccurance, minRatio);

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
