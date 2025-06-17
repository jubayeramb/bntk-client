"use client";

import { getDbClient, populateSchema } from "@bntk/db";
import { seedDatabase } from "@bntk/db/seed";
import { useEffect, useState, createContext, useContext } from "react";
import { type Pool } from "pg";
import { Progress } from "@bntk/components/ui/progress";
import { delay } from "@bntk/lib/utils";
import { getBasePath } from "@bntk/helpers/basePath";
import Image from "next/image";

interface PostgresContextType {
  db: Pool | null;
}

const PostgresContext = createContext<PostgresContextType>({ db: null });

export const usePostgres = () => {
  const context = useContext(PostgresContext);
  if (!context) {
    throw new Error(
      "usePostgres must be used within a PostgresContextProvider"
    );
  }
  return context.db;
};

export const PostgresContextProvider = (props: {
  children: React.ReactNode;
}) => {
  const [db, setDb] = useState<Pool | null>(null);
  const [progress, setProgress] = useState(0);

  const updateProgress = () => {
    setProgress((prev) => Math.min(prev + 5, 95));
  };

  useEffect(() => {
    setProgress(10);
    const initialize = async () => {
      try {
        console.time("initialize");
        setProgress(25);
        const client = await getDbClient();
        setProgress(40);
        await populateSchema(client);
        setProgress(60);
        await seedDatabase(client, updateProgress);
        setProgress(100);
        await delay(100);
        setDb(client);
        console.timeEnd("initialize");
      } catch (error) {
        console.error("Error initializing database:", error);
      }
    };
    initialize();
  }, []);

  if (!db) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50/75 text-gray-500 dark:bg-gray-900 dark:text-gray-400">
        <div className="flex flex-col gap-4 items-center justify-center">
          <div className="flex items-end gap-3">
            <div>
              <Image
                className="block dark:hidden"
                src={getBasePath() + "/logo-dark.svg"}
                alt="Bangla Toolkit Logo"
                width={50}
                height={50}
              />
              <Image
                className="hidden dark:block"
                src={getBasePath() + "logo-light.svg"}
                alt="Bangla Toolkit Logo"
                width={50}
                height={50}
              />
            </div>
            <h1 className="text-2xl md:text-5xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              Bangla Toolkit
            </h1>
          </div>
          <Progress value={progress} />
          <span className="text-xl font-medium animate-pulse">
            Loading The App...
          </span>
        </div>
      </div>
    );
  }

  return (
    <PostgresContext.Provider value={{ db }}>
      {props.children}
    </PostgresContext.Provider>
  );
};
