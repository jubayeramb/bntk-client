import type { Pool } from "pg";
import { tokenizeToWords } from "@bntk/tokenization";
import { transliterate } from "@bntk/transliteration";

interface WordWithRomanized {
  bangla: string;
  romanized: string;
}

export const findSimilarWords = async (db: Pool, text: string) => {
  // Step 1: Tokenize the input text into words
  const words = tokenizeToWords(text);

  console.log("🚀 ~ findSimilarWords ~ tokenized words:", words);

  // Step 2: Generate romanized version for each word
  const wordsWithRomanized: WordWithRomanized[] = words.map((word) => ({
    bangla: word,
    romanized: transliterate(word, { mode: "orva" }),
  }));

  console.log(
    "🚀 ~ constwordsWithRomanized ~ wordsWithRomanized:",
    wordsWithRomanized
  );

  try {
    // Create values string for the input CTE
    const valuesStr = wordsWithRomanized
      .map((w, i) => `($${i * 2 + 1}, $${i * 2 + 2})`)
      .join(", ");

    // Create params array
    const params = wordsWithRomanized.flatMap((w) => [w.bangla, w.romanized]);

    console.log(
      "🚀 ~ findSimilarWords ~ words with romanized flat params:",
      params
    );
    console.time("findSimilarWords Query Execution");

    const candidates = await db.query(
      `
      WITH input_words (bangla_word, romanized_word) AS (
        VALUES ${valuesStr}
      ),
      -- 1. Exact Match on Bangla Word
      exact_bangla_match AS (
        SELECT
          iw.bangla_word as original_word,
          w.value as suggestion,
          'exact_bangla' as match_type,
          1 as match_priority,
          1.0 as score
        FROM input_words iw
        JOIN words w ON iw.bangla_word = w.value
      ),
      -- 2. Exact Match on Romanized Word
      exact_romanized_match AS (
        SELECT
          iw.bangla_word as original_word,
          w.value as suggestion,
          'exact_romanized' as match_type,
          2 as match_priority,
          1.0 as score
        FROM input_words iw
        JOIN romanized_words rw ON lower(iw.romanized_word) = lower(rw.value)
        JOIN words w ON rw.word_id = w.id
        WHERE NOT EXISTS (
          SELECT 1 FROM exact_bangla_match ebm
          WHERE ebm.original_word = iw.bangla_word AND ebm.suggestion = w.value
        )
      ),
      -- 3. Trigram Similarity Match on Romanized Word
      trigram_romanized_match AS (
        SELECT
          iw.bangla_word as original_word,
          w.value as suggestion,
          'trigram_romanized' as match_type,
          3 as match_priority,
          similarity(iw.romanized_word, rw.value) as score
        FROM input_words iw
        CROSS JOIN LATERAL (
          SELECT rw_inner.word_id, rw_inner.value
          FROM romanized_words rw_inner
          WHERE lower(iw.romanized_word) % lower(rw_inner.value)
          ORDER BY lower(iw.romanized_word) <-> lower(rw_inner.value)
          LIMIT 15
        ) as rw
        JOIN words w ON rw.word_id = w.id
        WHERE
          similarity(iw.romanized_word, rw.value) > 0.3
          AND w.value != iw.bangla_word
          AND NOT EXISTS (
            SELECT 1 FROM exact_bangla_match ebm
            WHERE ebm.original_word = iw.bangla_word AND ebm.suggestion = w.value
          )
          AND NOT EXISTS (
            SELECT 1 FROM exact_romanized_match erm
            WHERE erm.original_word = iw.bangla_word AND erm.suggestion = w.value
          )
      ),
      -- Combine all matches
      all_matches AS (
        SELECT * FROM exact_bangla_match
        UNION ALL
        SELECT * FROM exact_romanized_match
        UNION ALL
        SELECT * FROM trigram_romanized_match
      ),
      -- Rank matches
      ranked_matches AS (
        SELECT
          *,
          ROW_NUMBER() OVER (
            PARTITION BY original_word
            ORDER BY
              match_priority ASC,
              score DESC,
              suggestion ASC
          ) as suggestion_rank
        FROM all_matches
      )
      -- Final output with top 5 suggestions per word
      SELECT *
      FROM ranked_matches
      WHERE suggestion_rank <= 5
      ORDER BY original_word, suggestion_rank;
    `,
      params
    );

    console.timeEnd("findSimilarWords Query Execution");
    console.log("🚀 ~ findSimilarWords ~ candidates:", candidates); // Return array of suggestions
    return candidates.rows.map(
      (row: {
        original_word: string;
        suggestion: string;
        match_type: string;
        score: number;
        suggestion_rank: number;
      }) => ({
        original: row.original_word,
        suggestion: row.suggestion,
        matchType: row.match_type,
        score: row.score,
        rank: row.suggestion_rank,
      })
    );
  } catch (error) {
    console.log("Error finding similar words:", error);
    return [];
  }
};
