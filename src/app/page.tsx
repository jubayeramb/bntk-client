import GrammarChecker from "@bntk/components/grammar-checker";
import { ThemeToggle } from "@bntk/components/theme-toggle";
import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 transition-colors duration-300">
      <div className="container mx-auto px-4 py-8">
        <header className="flex flex-col items-center justify-center mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Image
                src="/bangla-toolkit-logo.svg"
                alt="Bangla Toolkit"
                width={40}
                height={40}
              />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              Bangla Toolkit
            </h1>
          </div>
          <p className="text-center text-slate-600 dark:text-slate-300 max-w-md text-lg">
            A collection of tools for the Bangla language
          </p>
          <div className="absolute top-4 right-4">
            <ThemeToggle />
          </div>
        </header>
        <GrammarChecker />
      </div>
    </main>
  );
}
