"use client";

import { useState } from "react";
import { tokenizeToWords } from "@bntk/tokenization";
import { transliterate } from "@bntk/transliteration";
import { stemWord, stemWords } from "@bntk/stemming";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@bntk/components/ui/tabs";
import { Button } from "@bntk/components/ui/button";
import { Card, CardContent } from "@bntk/components/ui/card";
import TextInput from "@bntk/components/text-input";
import GrammarResults from "@bntk/components/grammar-results";
import SpellCheckResults from "@bntk/components/spell-check-results";
import TokenizationResults from "@bntk/components/tokenization-results";
import StemmingResults from "@bntk/components/stemming-results";
import NerResults from "@bntk/components/ner-results";
import PosResults from "@bntk/components/pos-results";
import TransliterationResults from "@bntk/components/transliteration-results";
import {
  Sparkles,
  Wand2,
  Check,
  SplitSquareVertical,
  GitBranchPlus,
  User,
  AlignJustify,
  Copy,
  RefreshCw,
  HelpCircle,
  Languages,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@bntk/components/ui/tooltip";
import { Badge } from "@bntk/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@bntk/components/ui/dialog";

// Sample texts for each tab
const sampleTexts = {
  grammar:
    "ami ajke bazar jabo ebong ki kinbo jani na. eta ekta lomba din hobe.",
  spelling:
    "Ami tomader bashay jabo. Kintu ami janina kothay tomar basha. Tumi ki amake thikana dite parbe?",
  tokenization:
    "আমি বাংলাদেশে থাকি। আমার দেশের নাম বাংলাদেশ। এটি একটি সুন্দর দেশ।",
  stemming: "খেলছি পড়েছি লিখেছি হাঁটছি দেখছি শুনছি বলছি",
  ner: "শেখ হাসিনা ঢাকা বিশ্ববিদ্যালয়ে একটি বক্তৃতা দিয়েছেন। তিনি বাংলাদেশ সরকারের প্রধানমন্ত্রী।",
  pos: "সুন্দর লাল গোলাপটি বাগানে ফুটে আছে।",
  transliteration: "amar sOnar bangla ami tOmay bhalObasi.",
};

export default function GrammarChecker() {
  const [text, setText] = useState("");
  const [activeTab, setActiveTab] = useState("grammar");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [wordCount, setWordCount] = useState({ words: 0, chars: 0 });

  const handleTextChange = (value: string) => {
    setText(value);
    // Update word count
    setWordCount({
      words: value.trim() ? value.trim().split(/\s+/).length : 0,
      chars: value.length,
    });
    // Clear results when text changes
    setResults(null);
  };

  const loadSampleText = () => {
    setText(sampleTexts[activeTab as keyof typeof sampleTexts] || "");
    // Update word count
    const sampleText = sampleTexts[activeTab as keyof typeof sampleTexts] || "";
    setWordCount({
      words: sampleText.trim() ? sampleText.trim().split(/\s+/).length : 0,
      chars: sampleText.length,
    });
    setResults(null);
  };

  const analyzeText = () => {
    if (!text.trim()) return;

    setIsAnalyzing(true);

    // Simulate API call with timeout
    setTimeout(() => {
      // Mock results based on active tab
      let mockResults;

      switch (activeTab) {
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
        case "spelling":
          mockResults = {
            misspellings: [
              {
                word: "recieved",
                suggestions: ["received"],
                index: text.indexOf("recieved"),
              },
              {
                word: "mesage",
                suggestions: ["message"],
                index: text.indexOf("mesage"),
              },
              {
                word: "accomodation",
                suggestions: ["accommodation"],
                index: text.indexOf("accomodation"),
              },
              {
                word: "definately",
                suggestions: ["definitely"],
                index: text.indexOf("definately"),
              },
              {
                word: "tommorow",
                suggestions: ["tomorrow"],
                index: text.indexOf("tommorow"),
              },
            ],
          };
          break;
        case "tokenization":
          mockResults = {
            tokens: tokenizeToWords(text),
          };
          break;
        case "stemming":
          mockResults = {
            stems: text
              .split(/\s+/)
              .filter((t) => t.length > 0)
              .map((word) => ({
                original: word,
                stem: stemWord(word),
              })),
          };
          break;
        case "ner":
          mockResults = {
            entities: [
              {
                text: "John Smith",
                type: "PERSON",
                start: text.indexOf("John Smith"),
              },
              {
                text: "Apple Inc.",
                type: "ORGANIZATION",
                start: text.indexOf("Apple Inc."),
              },
              {
                text: "New York City",
                type: "LOCATION",
                start: text.indexOf("New York City"),
              },
              { text: "Paris", type: "LOCATION", start: text.indexOf("Paris") },
            ],
          };
          break;
        case "pos":
          mockResults = {
            tags: text
              .split(/\s+/)
              .filter((t) => t.length > 0)
              .map((word) => {
                // Simple rule-based POS tagging for demo
                if (word.match(/^[A-Z]/)) return { word, tag: "NNP" }; // Proper noun
                if (word.match(/ing$/)) return { word, tag: "VBG" }; // Gerund
                if (word.match(/s$/)) return { word, tag: "NNS" }; // Plural noun
                if (word.match(/ed$/)) return { word, tag: "VBD" }; // Past tense
                if (word.match(/ly$/)) return { word, tag: "RB" }; // Adverb
                if (["the", "a", "an"].includes(word.toLowerCase()))
                  return { word, tag: "DT" }; // Determiner
                if (
                  ["over", "under", "in", "on", "at"].includes(
                    word.toLowerCase()
                  )
                )
                  return { word, tag: "IN" }; // Preposition

                // Default to common tags
                return {
                  word,
                  tag: ["NN", "VB", "JJ"][Math.floor(Math.random() * 3)],
                };
              }),
          };
          break;
        case "transliteration":
          mockResults = {
            transliterated: transliterate(text),
          };
          break;
      }

      setResults(mockResults);
      setIsAnalyzing(false);
    }, 1000);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setResults(null);
  };

  const renderResults = () => {
    if (!results) return null;

    switch (activeTab) {
      case "grammar":
        return <GrammarResults results={results} text={text} />;
      case "spelling":
        return <SpellCheckResults results={results} text={text} />;
      case "tokenization":
        return <TokenizationResults results={results} />;
      case "stemming":
        return <StemmingResults results={results} />;
      case "ner":
        return <NerResults results={results} text={text} />;
      case "pos":
        return <PosResults results={results} />;
      case "transliteration":
        return <TransliterationResults results={results} />;
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
      case "tokenization":
        return <SplitSquareVertical className="h-4 w-4 mr-1" />;
      case "stemming":
        return <GitBranchPlus className="h-4 w-4 mr-1" />;
      case "ner":
        return <User className="h-4 w-4 mr-1" />;
      case "pos":
        return <AlignJustify className="h-4 w-4 mr-1" />;
      case "transliteration":
        return <Languages className="h-4 w-4 mr-1" />;
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
      case "tokenization":
        return "Breaks text into individual words or tokens.";
      case "stemming":
        return "Reduces words to their root or base form.";
      case "ner":
        return "Identifies and classifies named entities like people, organizations, and locations.";
      case "pos":
        return "Tags words with their part of speech (noun, verb, adjective, etc.).";
      case "transliteration":
        return "Converts English text to Bangla script.";
      default:
        return "";
    }
  };

  const copyToClipboard = () => {
    if (!text) return;

    navigator.clipboard
      .writeText(text)
      .then(() => {
        // Could add a toast notification here
        console.log("Text copied to clipboard");
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  };

  return (
    <TooltipProvider>
      <Card className="w-full max-w-4xl mx-auto mt-20 p-0 shadow-xl border-slate-200 dark:border-slate-700 overflow-hidden">
        <CardContent className="p-0">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 text-white">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Text Analysis Tool</h2>
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
                    <DialogTitle>How to use TextPerfect</DialogTitle>
                    <DialogDescription>
                      TextPerfect helps you analyze and improve your text in
                      various ways.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <h3 className="font-medium">Available Tools:</h3>
                      <ul className="space-y-2">
                        {Object.keys(sampleTexts).map((tab) => (
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
                    <div>
                      <h3 className="font-medium">Getting Started:</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        1. Select a tool from the tabs
                        <br />
                        2. Enter your text or use the sample text button
                        <br />
                        3. Click &quot;Analyze&quot; to see the results
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Tabs
            defaultValue="grammar"
            value={activeTab}
            onValueChange={handleTabChange}
            className="p-6"
          >
            <TabsList className="grid grid-cols-3 md:grid-cols-6 mb-6 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              {Object.keys(sampleTexts).map((tab) => (
                <Tooltip key={tab}>
                  <TooltipTrigger asChild>
                    <TabsTrigger
                      value={tab}
                      className={`
                        flex items-center justify-center transition-all duration-200
                        data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 
                        data-[state=active]:shadow-md data-[state=active]:font-medium
                        data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400
                        data-[state=active]:border-b-2 data-[state=active]:border-indigo-500
                      `}
                    >
                      {getTabIcon(tab)}
                      <span className="hidden sm:inline capitalize">{tab}</span>
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>{getTabDescription(tab)}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </TabsList>

            {Object.keys(sampleTexts).map((tab) => (
              <TabsContent key={tab} value={tab} className="mt-0 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium capitalize flex items-center">
                    {getTabIcon(tab)}
                    <span>{tab} Analysis</span>
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
                        <p>Load a sample text for this tool</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                <TextInput
                  value={text}
                  onChange={handleTextChange}
                  placeholder={`Enter text to ${
                    tab === "grammar"
                      ? "check grammar"
                      : tab === "spelling"
                      ? "check spelling"
                      : tab === "tokenization"
                      ? "tokenize"
                      : tab === "stemming"
                      ? "find word stems"
                      : tab === "ner"
                      ? "identify named entities"
                      : tab === "transliteration"
                      ? "transliterate"
                      : "analyze parts of speech"
                  }...`}
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
                      className="px-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all duration-300"
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
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
                          Analyzing...
                        </span>
                      ) : (
                        `Analyze ${
                          activeTab === "grammar"
                            ? "Grammar"
                            : activeTab === "spelling"
                            ? "Spelling"
                            : activeTab === "tokenization"
                            ? "Tokens"
                            : activeTab === "stemming"
                            ? "Word Stems"
                            : activeTab === "ner"
                            ? "Named Entities"
                            : activeTab === "transliteration"
                            ? "Transliteration"
                            : "Parts of Speech"
                        }`
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
