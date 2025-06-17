import type { Pool } from "pg";

export const checkWord = async (db: Pool, word: string) => {
  const result = await db.query(
    `
    SELECT EXISTS (
      SELECT 1 
      FROM words 
      WHERE value = $1
    )
  `,
    [word.toLowerCase()]
  );
  return result.rows[0].exists;
};
