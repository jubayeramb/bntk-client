"use client";

import { Card, CardContent } from "@bntk/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@bntk/components/ui/table";
import { GitBranchPlus } from "lucide-react";

interface StemmingResultsProps {
  results: {
    stems: Array<{
      original: string;
      stem: string;
    }>;
  };
}

export default function StemmingResults({ results }: StemmingResultsProps) {
  return (
    <Card className="mt-6 overflow-hidden">
      <div className="bg-purple-50 dark:bg-purple-900/20 px-4 py-2 flex items-center">
        <GitBranchPlus className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-2" />
        <h3 className="font-medium text-purple-700 dark:text-purple-400">
          Stemming Results
        </h3>
      </div>
      <CardContent className="p-4">
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-800">
              <TableRow>
                <TableHead className="font-semibold">Original Word</TableHead>
                <TableHead className="font-semibold">Stem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.stems.map((item, index) => (
                <TableRow
                  key={index}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-200"
                >
                  <TableCell className="font-medium">{item.original}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded">
                      {item.stem}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
