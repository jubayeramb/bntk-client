"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

interface WordPairSuggestion {
  nextWord: string;
  occurance: number;
}

interface GrammarCheckResult {
  prevWord: string;
  currentWord: string;
  position: number;
  isCorrect: boolean;
  currentOccurance: number;
  suggestions: WordPairSuggestion[];
}

interface GrammarCheckResponse {
  success: boolean;
  results: GrammarCheckResult[];
  totalWords: number;
  totalPairs: number;
  issuesFound: number;
}

function formatOccurance(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return String(count);
}

export function GrammarCheckerClient() {
  const [text, setText] = useState("");
  const [results, setResults] = useState<GrammarCheckResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<GrammarCheckResult | null>(
    null
  );
  const [stats, setStats] = useState({ total: 0, pairs: 0, issues: 0 });
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const checkGrammar = useCallback(async (inputText: string) => {
    if (!inputText.trim()) {
      setResults([]);
      setStats({ total: 0, pairs: 0, issues: 0 });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/grammar-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
      });

      const data: GrammarCheckResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.success === false ? "API error" : "Unknown error");
      }

      setResults(data.results);
      setStats({
        total: data.totalWords,
        pairs: data.totalPairs,
        issues: data.issuesFound,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check grammar");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      checkGrammar(newText);
    }, 500);
  };

  const applySuggestion = (original: string, replacement: string) => {
    const newText = text.replace(new RegExp(original, "g"), replacement);
    setText(newText);
    setSelectedIssue(null);
    checkGrammar(newText);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen fixed inset-0 font-[family-name:var(--font-sans)] bg-[var(--bg-primary)]">
      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col bg-[var(--bg-secondary)] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-3 bg-[var(--overlay-color)] border-b border-[var(--border-color)] shrink-0 gap-4">
          <div className="flex items-center gap-3">
            <Logo width={40} height={40} />
            <div className="flex flex-col md:flex-row md:gap-2 md:items-center">
              <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent leading-tight">
                ব্যাকরণ
              </span>
              <span className="text-[10px] font-medium text-amber-500 uppercase tracking-wide md:bg-amber-500/10 md:px-2 md:py-1 md:rounded-full">
                Grammar Checker
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {stats.total > 0 && (
              <div className="flex items-center gap-3 max-sm:hidden">
                <span className="text-sm text-[var(--text-secondary)] flex items-center gap-1">
                  <span className="font-semibold text-[var(--text-primary)] tabular-nums">
                    {stats.total}
                  </span>{" "}
                  শব্দ
                </span>
                <span className="text-sm text-[var(--text-secondary)] flex items-center gap-1">
                  <span className="font-semibold text-[var(--text-primary)] tabular-nums">
                    {stats.pairs}
                  </span>{" "}
                  জোড়া
                </span>
                {stats.issues > 0 && (
                  <span className="text-sm text-amber-400 flex items-center gap-1">
                    <span className="font-semibold tabular-nums">
                      {stats.issues}
                    </span>{" "}
                    সংশোধন
                  </span>
                )}
                {stats.issues === 0 && (
                  <span className="text-sm text-emerald-400 flex items-center gap-1">
                    <span className="font-bold">✓</span> সঠিক
                  </span>
                )}
              </div>
            )}
            {isLoading && (
              <span className="text-sm text-blue-400 animate-pulse max-sm:hidden">
                পরীক্ষা...
              </span>
            )}
            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-full transition-colors"
            >
              <span className="max-sm:hidden">Spelling</span>
              <span>✏️</span>
            </Link>
            <ThemeToggle />
          </div>
        </div>

        {/* Editor Body */}
        <div className="relative flex-1 flex flex-col overflow-hidden">
          <textarea
            value={text}
            onChange={handleTextChange}
            placeholder="এখানে বাংলায় লিখুন..."
            className="w-full flex-1 p-6 bg-transparent border-none outline-none resize-none text-2xl leading-loose text-[var(--text-primary)] font-[family-name:var(--font-sans)] caret-blue-400 overflow-y-auto placeholder:text-[var(--text-muted)] max-md:p-4 max-md:text-xl"
            spellCheck={false}
          />

          {/* Highlighted overlay */}
          <div
            className="absolute inset-0 p-6 pointer-events-none text-2xl leading-loose font-[family-name:var(--font-sans)] text-transparent whitespace-pre-wrap break-words overflow-y-auto max-md:p-4 max-md:text-xl"
            aria-hidden="true"
          >
            {text.split(/(\s+)/).map((segment, idx) => {
              const cleanedSegment = segment
                .replace(/[।,;:'"?!()[\]{}॥]+/g, "")
                .trim();
              const result = results.find(
                (r) => r.currentWord === cleanedSegment
              );
              if (result) {
                return (
                  <span
                    key={idx}
                    className="bg-[linear-gradient(to_bottom,transparent_92%,rgba(251,191,36,0.6)_92%)] rounded-xs pointer-events-auto cursor-pointer hover:bg-amber-400/20 transition-colors"
                    onClick={() => setSelectedIssue(result)}
                  >
                    {segment}
                  </span>
                );
              }
              return <span key={idx}>{segment}</span>;
            })}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-red-900 to-red-800 rounded-xl text-red-200 text-sm">
          <span className="text-xl">⚠️</span>
          {error}
        </div>
      )}

      {/* Suggestions Panel */}
      {results.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 max-h-[40vh] bg-[var(--bg-secondary)] border-t border-[var(--border-color)] overflow-y-auto shadow-[0_-10px_40px_rgba(0,0,0,0.2)] z-40 animate-slide-up">
          <div className="flex items-center gap-3 px-6 py-4 bg-[var(--overlay-color)] border-b border-[var(--border-color)] text-base font-semibold text-[var(--text-primary)]">
            <span className="text-xl">📝</span>
            <span>ব্যাকরণ সংশোধন প্রস্তাব</span>
            <span className="text-xs font-medium text-amber-400 ml-auto uppercase tracking-wide">
              Grammar Suggestions
            </span>
          </div>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4 p-6">
            {results.map((result, idx) => (
              <div
                key={idx}
                className={`bg-[var(--overlay-color)] rounded-xl p-4 border border-[var(--border-color)] transition-all cursor-pointer hover:bg-amber-500/5 hover:border-amber-500/30 hover:-translate-y-0.5 ${
                  selectedIssue?.position === result.position
                    ? "bg-amber-500/5 border-amber-500/30"
                    : ""
                }`}
                onClick={() => setSelectedIssue(result)}
              >
                <div className="flex items-baseline gap-2 mb-3 pb-3 border-b border-[var(--border-color)]">
                  <span className="text-base text-[var(--text-secondary)]">
                    {result.prevWord}
                  </span>
                  <span className="text-xl font-semibold text-amber-400">
                    {result.currentWord}
                  </span>
                  {result.currentOccurance > 0 && (
                    <span className="text-xs font-semibold text-[var(--text-muted)] bg-[var(--bg-primary)] px-1.5 py-0.5 rounded-full ml-auto tabular-nums">
                      {formatOccurance(result.currentOccurance)}
                    </span>
                  )}
                </div>

                {result.suggestions.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {result.suggestions.slice(0, 3).map((suggestion, sIdx) => (
                      <button
                        key={sIdx}
                        className="flex items-center gap-3 w-full px-3 py-2.5 bg-amber-500/5 border border-amber-500/10 rounded-lg cursor-pointer transition-all text-left hover:bg-amber-500/12 hover:border-amber-500/25 hover:translate-x-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          applySuggestion(
                            result.currentWord,
                            suggestion.nextWord
                          );
                        }}
                      >
                        <span className="text-base text-[var(--text-secondary)]">
                          {result.prevWord}
                        </span>
                        <span className="text-base font-medium text-amber-400">
                          {suggestion.nextWord}
                        </span>
                        <span className="ml-auto text-xs font-semibold text-violet-400 bg-violet-400/10 px-2 py-0.5 rounded-full tabular-nums">
                          {formatOccurance(suggestion.occurance)}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-[var(--text-muted)] text-center py-4">
                    কোনো প্রস্তাব পাওয়া যায়নি
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Issue Detail Modal */}
      {selectedIssue && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
          onClick={() => setSelectedIssue(null)}
        >
          <div
            className="bg-[var(--bg-secondary)] rounded-2xl w-[90%] max-w-md max-h-[80vh] overflow-y-auto shadow-2xl border border-[var(--border-color)] animate-slide-up relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-[var(--overlay-color)] border-none rounded-full text-[var(--text-muted)] cursor-pointer transition-all hover:bg-amber-500/10 hover:text-[var(--text-primary)]"
              onClick={() => setSelectedIssue(null)}
            >
              ✕
            </button>
            <div className="p-6 border-b border-[var(--border-color)]">
              <div className="flex items-baseline gap-3">
                <span className="text-xl text-[var(--text-secondary)]">
                  {selectedIssue.prevWord}
                </span>
                <span className="text-3xl font-bold text-amber-400">
                  {selectedIssue.currentWord}
                </span>
              </div>
              <div className="mt-2 text-sm text-[var(--text-muted)]">
                বর্তমান জোড়া ব্যবহার:{" "}
                <span className="font-semibold text-[var(--text-secondary)] tabular-nums">
                  {formatOccurance(selectedIssue.currentOccurance)}
                </span>
              </div>
            </div>

            <div className="p-6">
              <h4 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-4">
                সম্ভাব্য সংশোধন
              </h4>
              {selectedIssue.suggestions.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {selectedIssue.suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      className="flex items-center justify-between p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl cursor-pointer transition-all hover:bg-amber-500/12 hover:border-amber-500/25"
                      onClick={() =>
                        applySuggestion(
                          selectedIssue.currentWord,
                          suggestion.nextWord
                        )
                      }
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-base text-[var(--text-secondary)]">
                            {selectedIssue.prevWord}
                          </span>
                          <span className="text-xl font-semibold text-amber-400">
                            {suggestion.nextWord}
                          </span>
                        </div>
                        <span className="text-xs text-[var(--text-muted)]">
                          ব্যবহার:{" "}
                          <span className="font-semibold text-violet-400 tabular-nums">
                            {formatOccurance(suggestion.occurance)}
                          </span>
                        </span>
                      </div>
                      <div className="w-12 h-12 relative flex items-center justify-center">
                        <span className="text-2xl">→</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-8 text-[var(--text-muted)]">
                  <span className="text-3xl">📭</span>
                  <span>কোনো প্রস্তাব পাওয়া যায়নি</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
