"use client";

import { getDbClient, initDb } from "@bntk/db";
import { seedDatabase } from "@bntk/db/seed";
import { PGliteProvider } from "@electric-sql/pglite-react";
import { useEffect, useState } from "react";
import { PGliteWithLive } from "@electric-sql/pglite/live";

export const PGLiteContextProvider = (props: { children: React.ReactNode }) => {
  const [db, setDb] = useState<PGliteWithLive>();

  useEffect(() => {
    const initialize = async () => {
      const client = await getDbClient();
      await initDb();
      await seedDatabase();
      setDb(client);
    };
    initialize();
  }, []);

  return <PGliteProvider db={db}>{props.children}</PGliteProvider>;
};
