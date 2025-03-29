import { IdbFs, PGlite } from "@electric-sql/pglite";
import { live, PGliteWithLive } from "@electric-sql/pglite/live";
import schemaContent from "./schema.sql";

let dbClientInstance: PGliteWithLive;

export async function getDbClient() {
  if (!dbClientInstance) {
    dbClientInstance = await PGlite.create({
      fs: new IdbFs("bntk-client"),
      extensions: { live },
    });
  }
  return dbClientInstance;
}

export async function initDb() {
  const client = await getDbClient();
  await client
    .exec(schemaContent)
    .then((result) => {
      console.log("Database schema applied successfully:", result);
    })
    .catch((error) => {
      console.error("Database schema application error:", error);
    });
}
