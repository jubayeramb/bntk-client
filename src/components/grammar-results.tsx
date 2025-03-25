"use client";

import { Card, CardContent } from "@bntk/components/ui/card";
import { Badge } from "@bntk/components/ui/badge";
import { AlertCircle, Check, Copy } from "lucide-react";
import { Button } from "@bntk/components/ui/button";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@bntk/components/ui/tooltip";

interface GrammarResultsProps {
  results: {
    corrections: Array<{
      index: number;
      suggestion: string;
      type: string;
    }>;
  };
  text: string;
}

export default function GrammarResults({ results, text }: GrammarResultsProps) {
  const [correctedText, setCorrectedText] = useState<string | null>(null);

  const applyCorrections = () => {
    if (!results.corrections.length) return text;

    let result = text;
    // Apply corrections from end to start to avoid index shifting
    const sortedCorrections = [...results.corrections].sort(
      (a, b) => b.index - a.index
    );

    for (const correction of sortedCorrections) {
      // Find the word at the correction index
      const wordMatch = text.substring(correction.index).match(/\S+/);
      if (wordMatch) {
        const word = wordMatch[0];
        result =
          result.substring(0, correction.index) +
          correction.suggestion +
          result.substring(correction.index + word.length);
      }
    }

    setCorrectedText(result);
    return result;
  };

  const copyToClipboard = (textToCopy: string) => {
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        // Could add a toast notification here
        console.log("Text copied to clipboard");
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  };

  if (!results.corrections.length) {
    return (
      <Card className="mt-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 overflow-hidden">
        <div className="bg-green-100 dark:bg-green-800/30 px-4 py-2 flex items-center">
          <Check className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
          <h3 className="font-medium text-green-700 dark:text-green-400">
            Perfect Grammar
          </h3>
        </div>
        <CardContent className="p-4 text-center text-green-700 dark:text-green-400">
          No grammar issues found. Your text looks great!
        </CardContent>
      </Card>
    );
  }

  // Function to highlight issues in text
  const highlightText = () => {
    let lastIndex = 0;
    const segments = [];

    // Sort corrections by index
    const sortedCorrections = [...results.corrections].sort(
      (a, b) => a.index - b.index
    );

    for (const correction of sortedCorrections) {
      if (correction.index > lastIndex) {
        // Add text before the correction
        segments.push(
          <span key={`text-${lastIndex}`}>
            {text.substring(lastIndex, correction.index)}
          </span>
        );
      }

      // Find the word at the correction index
      const wordMatch = text.substring(correction.index).match(/\S+/);
      if (wordMatch) {
        const word = wordMatch[0];
        segments.push(
          <span
            key={`correction-${correction.index}`}
            className="bg-yellow-200 dark:bg-yellow-900/50 px-0.5 rounded relative group cursor-help"
          >
            {word}
            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              Suggestion: {correction.suggestion}
            </span>
          </span>
        );
        lastIndex = correction.index + word.length;
      }
    }

    // Add remaining text
    if (lastIndex < text.length) {
      segments.push(
        <span key={`text-${lastIndex}`}>{text.substring(lastIndex)}</span>
      );
    }

    return segments;
  };

  return (
    <TooltipProvider>
      <div className="mt-6 space-y-4">
        <Card className="border-amber-200 dark:border-amber-800 overflow-hidden">
          <div className="bg-amber-50 dark:bg-amber-900/20 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
              <h3 className="font-medium text-amber-700 dark:text-amber-400">
                Grammar Check Results
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => applyCorrections()}
                    className="h-8 text-xs bg-white dark:bg-slate-800"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Apply All
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Apply all suggested corrections</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
          <CardContent className="p-4">
            <div className="p-3 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 whitespace-pre-wrap">
              {highlightText()}
            </div>
          </CardContent>
        </Card>

        {correctedText && (
          <Card className="border-green-200 dark:border-green-800 overflow-hidden">
            <div className="bg-green-50 dark:bg-green-900/20 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center">
                <Check className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                <h3 className="font-medium text-green-700 dark:text-green-400">
                  Corrected Text
                </h3>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(correctedText)}
                    className="h-8 text-xs bg-white dark:bg-slate-800"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copy corrected text</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <CardContent className="p-4">
              <div className="p-3 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 whitespace-pre-wrap">
                {correctedText}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          <h3 className="font-medium text-slate-700 dark:text-slate-300">
            Suggested Corrections:
          </h3>
          <ul className="space-y-2">
            {results.corrections.map((correction, index) => {
              const wordMatch = text.substring(correction.index).match(/\S+/);
              const word: string = wordMatch ? wordMatch[0] : "";

              return (
                <li
                  key={index}
                  className="flex items-start gap-2 p-3 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:shadow-sm transition-shadow duration-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="line-through text-red-500">{word}</span>
                      <span className="text-sm">→</span>
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        {correction.suggestion}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      {correction.type === "capitalization"
                        ? "Capitalize this word"
                        : correction.type === "apostrophe"
                        ? "Missing apostrophe"
                        : "Grammar issue"}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-slate-100 dark:bg-slate-800"
                  >
                    {correction.type}
                  </Badge>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </TooltipProvider>
  );
}
