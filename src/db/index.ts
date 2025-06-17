import { Pool } from "pg";
import { schema } from "./schema";

let dbPool: Pool | null = null;

const DATABASE_URL = process.env.DATABASE_URL;

export async function getDbClient() {
  try {
    if (!dbPool) {
      dbPool = new Pool({
        connectionString: DATABASE_URL,
        ssl: false,
      });
    }
    return dbPool;
  } catch (error) {
    console.error("Error creating database client:", error);
    throw error;
  }
}

export async function populateSchema(dbClient: Pool) {
  try {
    // Enable extensions
    await dbClient.query(`
      CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;
      CREATE EXTENSION IF NOT EXISTS pg_trgm;
    `);

    const result = await dbClient.query(schema);
    console.log("Database schema applied successfully:", result);
  } catch (error) {
    if ((error as Error).message?.includes("already exists")) {
      console.warn("Schema already exists, skipping.");
    } else {
      console.error("Database schema application error:", error);
    }
  }
}
