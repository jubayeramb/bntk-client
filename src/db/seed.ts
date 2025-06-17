import { getBasePath } from "@bntk/helpers/basePath";
import { Pool } from "pg";

export async function seedDatabase(dbClient: Pool, cb?: () => void) {
  try {
    // Check if data exists
    const wordsResult = await dbClient.query("SELECT COUNT(*) FROM words");
    const wordsCount = parseInt(wordsResult.rows[0].count);

    const romanized_wordsResult = await dbClient.query(
      "SELECT COUNT(*) FROM romanized_words"
    );
    const romanized_wordsCount = parseInt(romanized_wordsResult.rows[0].count);

    cb?.();

    console.log("Seeding database...");

    // Since we're using a hosted PostgreSQL, we'll need to insert data via SQL queries
    // instead of using the COPY command with blob files
    if (wordsCount === 0) {
      const response = await fetch(getBasePath() + "/words.csv");
      const csvText = await response.text();
      const lines = csvText.split("\n").slice(1); // Skip header

      cb?.();

      // Insert words in batches
      const batchSize = 1000;
      for (let i = 0; i < lines.length; i += batchSize) {
        const batch = lines
          .slice(i, i + batchSize)
          .filter((line) => line.trim());
        if (batch.length > 0) {
          const values = batch
            .map((line, index) => `($${index + 1})`)
            .join(",");
          const params = batch.map(
            (line) => line.split(",")[1]?.replace(/"/g, "") || line.trim()
          );

          await dbClient.query(
            `INSERT INTO words (value) VALUES ${values}`,
            params
          );
        }
      }
      console.log("Words table seeded successfully");
      cb?.();
    }

    if (romanized_wordsCount === 0) {
      const response = await fetch(getBasePath() + "/romanized_words.csv");
      const csvText = await response.text();
      const lines = csvText.split("\n").slice(1); // Skip header

      cb?.();

      // Insert romanized words in batches
      const batchSize = 1000;
      for (let i = 0; i < lines.length; i += batchSize) {
        const batch = lines
          .slice(i, i + batchSize)
          .filter((line) => line.trim());
        if (batch.length > 0) {
          const values = batch
            .map((_, index) => `($${index * 2 + 1}, $${index * 2 + 2})`)
            .join(",");
          const params = batch.flatMap((line) => {
            const parts = line.split(",");
            return [parseInt(parts[0]) || 0, parts[1]?.replace(/"/g, "") || ""];
          });

          await dbClient.query(
            `INSERT INTO romanized_words (word_id, value) VALUES ${values}`,
            params
          );
        }
      }
      console.log("Romanized words table seeded successfully");
      cb?.();
    }
    console.log("Database seeded successfully");
    cb?.();
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}
