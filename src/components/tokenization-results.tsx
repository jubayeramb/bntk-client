"use client";

import { Card, CardContent } from "@bntk/components/ui/card";
import { Badge } from "@bntk/components/ui/badge";
import { SplitSquareVertical } from "lucide-react";

interface TokenizationResultsProps {
  results: {
    tokens: string[];
  };
}

export default function TokenizationResults({
  results,
}: TokenizationResultsProps) {
  return (
    <Card className="mt-6 overflow-hidden">
      <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 flex items-center">
        <SplitSquareVertical className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
        <h3 className="font-medium text-blue-700 dark:text-blue-400">
          Tokenization Results ({results.tokens.length} tokens)
        </h3>
      </div>
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-2 p-3 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">
          {results.tokens.map((token, index) => (
            <Badge
              key={index}
              variant="outline"
              className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200"
            >
              {token}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
