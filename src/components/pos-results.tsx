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
import { Badge } from "@bntk/components/ui/badge";
import { AlignJustify } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@bntk/components/ui/tooltip";

interface PosResultsProps {
  results: {
    tags: Array<{
      word: string;
      tag: string;
    }>;
  };
}

export default function PosResults({ results }: PosResultsProps) {
  // Map POS tags to descriptions
  const tagDescriptions: Record<string, string> = {
    NN: "Noun, singular",
    NNS: "Noun, plural",
    NNP: "Proper noun, singular",
    NNPS: "Proper noun, plural",
    VB: "Verb, base form",
    VBD: "Verb, past tense",
    VBG: "Verb, gerund",
    VBN: "Verb, past participle",
    VBP: "Verb, non-3rd person singular present",
    VBZ: "Verb, 3rd person singular present",
    JJ: "Adjective",
    JJR: "Adjective, comparative",
    JJS: "Adjective, superlative",
    RB: "Adverb",
    RBR: "Adverb, comparative",
    RBS: "Adverb, superlative",
    DT: "Determiner",
    IN: "Preposition or subordinating conjunction",
  };

  // Get tag color based on part of speech
  const getTagColor = (tag: string) => {
    if (tag.startsWith("NN"))
      return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300";
    if (tag.startsWith("VB"))
      return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300";
    if (tag.startsWith("JJ"))
      return "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300";
    if (tag.startsWith("RB"))
      return "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300";
    if (tag === "DT")
      return "bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800 text-pink-700 dark:text-pink-300";
    if (tag === "IN")
      return "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300";
    return "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300";
  };

  return (
    <TooltipProvider>
      <Card className="mt-6 overflow-hidden">
        <div className="bg-teal-50 dark:bg-teal-900/20 px-4 py-2 flex items-center">
          <AlignJustify className="h-5 w-5 text-teal-600 dark:text-teal-400 mr-2" />
          <h3 className="font-medium text-teal-700 dark:text-teal-400">
            Part-of-Speech Tagging Results
          </h3>
        </div>
        <CardContent className="p-4">
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-800">
                <TableRow>
                  <TableHead className="font-semibold">Word</TableHead>
                  <TableHead className="font-semibold">POS Tag</TableHead>
                  <TableHead className="hidden md:table-cell font-semibold">
                    Description
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.tags.map((item, index) => (
                  <TableRow
                    key={index}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-200"
                  >
                    <TableCell className="font-medium">{item.word}</TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge
                            variant="outline"
                            className={`${getTagColor(item.tag)}`}
                          >
                            {item.tag}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{tagDescriptions[item.tag] || "Unknown"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-slate-600 dark:text-slate-400">
                      {tagDescriptions[item.tag] || "Unknown"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
