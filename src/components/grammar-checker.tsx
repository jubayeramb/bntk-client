"use client";

import GrammarResults from "@bntk/components/grammar-results";
import SpellCheckResults from "@bntk/components/spell-check-results";
import TextInput from "@bntk/components/text-input";
import { Badge } from "@bntk/components/ui/badge";
import { Button } from "@bntk/components/ui/button";
import { Card, CardContent } from "@bntk/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@bntk/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@bntk/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@bntk/components/ui/tooltip";
import { SampleTexts } from "@bntk/consts/sample-text";
import {
  Check,
  Copy,
  HelpCircle,
  RefreshCw,
  Sparkles,
  Wand2,
} from "lucide-react";
import { useState } from "react";

interface SpellingComponentProps {
  misspellings: Array<{
    word: string;
    suggestions: string[];
    index: number;
  }>;
}

interface GrammarComponentProps {
  corrections: Array<{
    index: number;
    suggestion: string;
    type: string;
  }>;
}

type CheckResults = SpellingComponentProps | GrammarComponentProps;

const AVAILABLE_TABS = ["spelling", "grammar"];

export default function GrammarChecker() {
  const [text, setText] = useState("");
  const [activeTab, setActiveTab] = useState("spelling");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [results, setResults] = useState<CheckResults | null>(null);
  const [wordCount, setWordCount] = useState({ words: 0, chars: 0 });

  const handleTextChange = (value: string) => {
    setText(value);
    setWordCount({
      words: value.trim() ? value.trim().split(/\s+/).length : 0,
      chars: value.length,
    });
    setResults(null);
  };

  const loadSampleText = () => {
    setText(SampleTexts[activeTab as keyof typeof SampleTexts] || "");
    const sampleText = SampleTexts[activeTab as keyof typeof SampleTexts] || "";
    setWordCount({
      words: sampleText.trim() ? sampleText.trim().split(/\s+/).length : 0,
      chars: sampleText.length,
    });
    setResults(null);
  };

  const analyzeText = async () => {
    if (!text.trim()) return;

    try {
      setIsAnalyzing(true);
      setAnalyzeProgress(0);
      let mockResults: CheckResults = {
        misspellings: [],
      };
      switch (activeTab) {
        case "spelling": {
          const response = await fetch("/api/similar-words", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ text }),
          });

          if (!response.ok) {
            throw new Error("Failed to fetch similar words");
          }

          const { results: suggestions } = await response.json();

          // Transform suggestions into the format expected by SpellCheckResults
          const misspellings = suggestions.reduce(
            (
              acc: Array<{
                word: string;
                suggestions: string[];
                index: number;
              }>,
              suggestion: {
                original: string;
                suggestion: string;
                matchType: string;
                score: number;
                rank: number;
              }
            ) => {
              const existingWord = acc.find(
                (m) => m.word === suggestion.original
              );
              if (existingWord) {
                existingWord.suggestions.push(suggestion.suggestion);
              } else {
                acc.push({
                  word: suggestion.original,
                  suggestions: [suggestion.suggestion],
                  index: text.indexOf(suggestion.original),
                });
              }
              return acc;
            },
            []
          );

          mockResults = { misspellings };
          break;
        }
        case "grammar":
          mockResults = {
            corrections: [
              {
                index: text.indexOf("i am"),
                suggestion: "I am",
                type: "capitalization",
              },
              {
                index: text.indexOf("dont"),
                suggestion: "don't",
                type: "apostrophe",
              },
              {
                index: text.indexOf("its"),
                suggestion: "it's",
                type: "apostrophe",
              },
            ],
          };
          break;
      }

      setResults(mockResults);
    } catch (error) {
      console.error("Error analyzing text: ", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setResults(null);
  };
  const renderResults = () => {
    if (!results) return null;

    switch (activeTab) {
      case "grammar":
        return (
          <GrammarResults
            results={results as GrammarComponentProps}
            text={text}
          />
        );
      case "spelling":
        return (
          <SpellCheckResults
            results={results as SpellingComponentProps}
            text={text}
          />
        );
      default:
        return null;
    }
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case "grammar":
        return <Check className="h-4 w-4 mr-1" />;
      case "spelling":
        return <Wand2 className="h-4 w-4 mr-1" />;
      default:
        return null;
    }
  };

  const getTabDescription = (tab: string) => {
    switch (tab) {
      case "grammar":
        return "Checks for grammatical errors and suggests corrections.";
      case "spelling":
        return "Identifies misspelled words and provides correct spellings.";
      default:
        return "";
    }
  };

  const copyToClipboard = () => {
    if (!text) return;

    navigator.clipboard
      .writeText(text)
      .then(() => {
        console.log("Text copied to clipboard");
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  };

  return (
    <TooltipProvider>
      <Card className="w-full max-w-4xl mx-auto p-0 shadow-xl border-slate-200 dark:border-slate-700 overflow-hidden">
        <CardContent className="p-0">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 text-white">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Grammar & Spell Check</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                  >
                    <HelpCircle className="h-5 w-5" />
                    <span className="sr-only">Help</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Grammar & Spell Check</DialogTitle>
                    <DialogDescription>
                      Use these tools to check your text for grammar and
                      spelling errors.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <h3 className="font-medium">Available Tools:</h3>
                      <ul className="space-y-2">
                        {AVAILABLE_TABS.map((tab) => (
                          <li key={tab} className="flex items-start gap-2">
                            <div className="mt-0.5">{getTabIcon(tab)}</div>
                            <div>
                              <span className="font-medium capitalize">
                                {tab}
                              </span>
                              <p className="text-sm text-muted-foreground">
                                {getTabDescription(tab)}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Tabs
            defaultValue="spelling"
            value={activeTab}
            onValueChange={handleTabChange}
            className="p-6"
          >
            <TabsList className="grid grid-cols-2 mb-6 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              {AVAILABLE_TABS.map((tab) => (
                <Tooltip key={tab}>
                  <TooltipTrigger asChild>
                    <TabsTrigger
                      value={tab}
                      className="flex items-center justify-center transition-all duration-200 data-[state=active]:!bg-white dark:data-[state=active]:!bg-slate-700 data-[state=active]:shadow-md data-[state=active]:font-medium data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 data-[state=active]:border-b-2 data-[state=active]:border-indigo-500"
                    >
                      {getTabIcon(tab)}
                      <span className="capitalize">{tab}</span>
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{getTabDescription(tab)}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </TabsList>

            {AVAILABLE_TABS.map((tab) => (
              <TabsContent key={tab} value={tab} className="mt-0 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium capitalize flex items-center">
                    {getTabIcon(tab)}
                    <span>{tab} Check</span>
                  </h3>
                  <div className="flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={loadSampleText}
                          className="text-xs h-8"
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Sample Text
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Load a sample text</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                <TextInput
                  value={text}
                  onChange={handleTextChange}
                  placeholder={`Enter text to check ${tab}...`}
                />

                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                    <Badge variant="outline" className="mr-2">
                      {wordCount.words}{" "}
                      {wordCount.words === 1 ? "word" : "words"}
                    </Badge>
                    <span>{wordCount.chars} characters</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={copyToClipboard}
                          disabled={!text.trim()}
                          className="h-9 w-9"
                        >
                          <Copy className="h-4 w-4" />
                          <span className="sr-only">Copy text</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Copy text to clipboard</p>
                      </TooltipContent>
                    </Tooltip>

                    <Button
                      onClick={analyzeText}
                      disabled={!text.trim() || isAnalyzing}
                      className="px-4 bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 text-white"
                    >
                      <Sparkles className="mr-2 h-4 w-4" />{" "}
                      {isAnalyzing ? (
                        <span className="flex items-center">
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Analyzing... {analyzeProgress}%
                        </span>
                      ) : (
                        `Check ${tab}`
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            ))}

            {renderResults()}
          </Tabs>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
