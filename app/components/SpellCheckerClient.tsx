"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

interface WordSuggestion {
  id: number;
  value: string;
  romanized: string;
  similarity: number;
  frequency?: number;
}

interface SpellCheckResult {
  word: string;
  isCorrect: boolean;
  suggestions: WordSuggestion[];
  romanized: string;
  isRareWord?: boolean;
}

interface SpellCheckResponse {
  success: boolean;
  results: SpellCheckResult[];
  totalWords: number;
  incorrectWords: number;
  rareWords?: number;
}

function formatFrequency(freq: number | undefined): string {
  if (!freq) return "";
  if (freq >= 1000000) return `${(freq / 1000000).toFixed(1)}M`;
  if (freq >= 1000) return `${(freq / 1000).toFixed(1)}K`;
  return String(freq);
}

export function SpellCheckerClient() {
  const [text, setText] = useState("");
  const [results, setResults] = useState<SpellCheckResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedWord, setSelectedWord] = useState<SpellCheckResult | null>(
    null
  );
  const [stats, setStats] = useState({ total: 0, incorrect: 0 });
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const checkSpelling = useCallback(async (inputText: string) => {
    if (!inputText.trim()) {
      setResults([]);
      setStats({ total: 0, incorrect: 0 });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/spell-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
      });

      const data: SpellCheckResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.success === false ? "API error" : "Unknown error");
      }

      setResults(data.results);
      setStats({ total: data.totalWords, incorrect: data.incorrectWords });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check spelling");
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
      checkSpelling(newText);
    }, 500);
  };

  const applySuggestion = (original: string, replacement: string) => {
    const newText = text.replace(new RegExp(original, "g"), replacement);
    setText(newText);
    setSelectedWord(null);
    checkSpelling(newText);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const incorrectResults = results.filter((r) => !r.isCorrect);

  return (
    <div className="flex flex-col h-screen w-screen fixed inset-0 font-[family-name:var(--font-sans)] bg-[var(--bg-primary)]">
      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col bg-[var(--bg-secondary)] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-8 py-4 bg-[var(--overlay-color)] border-b border-[var(--border-color)] shrink-0 max-md:flex-col max-md:items-start max-md:gap-4 max-md:px-4">
          <div className="flex items-center gap-3 text-lg font-semibold text-[var(--text-primary)]">
            <Logo width={48} height={48} />
            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">
              ব্যাকরণ
            </span>
            <span className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full uppercase tracking-wide">
              Spell Checker
            </span>
          </div>
          <div className="flex items-center gap-6 max-md:w-full max-md:justify-between">
            <div className="flex items-center gap-4">
              {stats.total > 0 && (
                <>
                  <span className="text-sm text-[var(--text-secondary)] flex items-center gap-1">
                    <span className="font-semibold text-[var(--text-primary)] tabular-nums">
                      {stats.total}
                    </span>{" "}
                    শব্দ
                  </span>
                  {stats.incorrect > 0 && (
                    <span className="text-sm text-red-400 flex items-center gap-1">
                      <span className="font-semibold tabular-nums">
                        {stats.incorrect}
                      </span>{" "}
                      ভুল
                    </span>
                  )}
                  {stats.incorrect === 0 && stats.total > 0 && (
                    <span className="text-sm text-emerald-400 flex items-center gap-1">
                      <span className="font-bold">✓</span> সঠিক
                    </span>
                  )}
                </>
              )}
              {isLoading && (
                <span className="text-sm text-blue-400 animate-pulse">
                  পরীক্ষা করা হচ্ছে...
                </span>
              )}
            </div>
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
              const result = results.find((r) => r.word === cleanedSegment);
              if (result && !result.isCorrect) {
                return (
                  <span
                    key={idx}
                    className="bg-[linear-gradient(to_bottom,transparent_92%,rgba(248,113,113,0.6)_92%)] rounded-xs pointer-events-auto cursor-pointer hover:bg-red-400/20 transition-colors"
                    onClick={() => setSelectedWord(result)}
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
      {incorrectResults.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 max-h-[40vh] bg-[var(--bg-secondary)] border-t border-[var(--border-color)] overflow-y-auto shadow-[0_-10px_40px_rgba(0,0,0,0.2)] z-40 animate-slide-up">
          <div className="flex items-center gap-3 px-6 py-4 bg-[var(--overlay-color)] border-b border-[var(--border-color)] text-base font-semibold text-[var(--text-primary)]">
            <span className="text-xl">🔍</span>
            <span>বানান সংশোধন প্রস্তাব</span>
            <span className="text-xs font-medium text-blue-400 ml-auto uppercase tracking-wide">
              Spelling Suggestions
            </span>
          </div>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4 p-6">
            {incorrectResults.map((result, idx) => (
              <div
                key={idx}
                className={`bg-[var(--overlay-color)] rounded-xl p-4 border border-[var(--border-color)] transition-all cursor-pointer hover:bg-emerald-500/5 hover:border-emerald-500/30 hover:-translate-y-0.5 ${
                  selectedWord?.word === result.word
                    ? "bg-emerald-500/5 border-emerald-500/30"
                    : ""
                }`}
                onClick={() => setSelectedWord(result)}
              >
                <div className="flex items-baseline gap-3 mb-3 pb-3 border-b border-[var(--border-color)]">
                  <span className="text-xl font-semibold text-red-400">
                    {result.word}
                  </span>
                  <span className="text-xs text-[var(--text-muted)] font-mono">
                    {result.romanized}
                  </span>
                  {result.isRareWord && (
                    <span className="text-xs font-semibold text-amber-400 bg-amber-400/15 px-1.5 py-0.5 rounded-full ml-auto">
                      বিরল
                    </span>
                  )}
                </div>

                {result.suggestions.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {result.suggestions.slice(0, 5).map((suggestion, sIdx) => (
                      <button
                        key={sIdx}
                        className="flex items-center gap-3 w-full px-3 py-2.5 bg-emerald-500/5 border border-emerald-500/10 rounded-lg cursor-pointer transition-all text-left hover:bg-emerald-500/12 hover:border-emerald-500/25 hover:translate-x-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          applySuggestion(result.word, suggestion.value);
                        }}
                      >
                        <span className="text-base font-medium text-emerald-400">
                          {suggestion.value}
                        </span>
                        <span className="text-xs text-[var(--text-muted)] font-mono">
                          {suggestion.romanized}
                        </span>
                        {suggestion.frequency && (
                          <span className="text-[10px] font-semibold text-violet-400 bg-violet-400/10 px-1.5 py-0.5 rounded-full tabular-nums">
                            {formatFrequency(suggestion.frequency)}
                          </span>
                        )}
                        <span className="ml-auto text-xs font-semibold text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full tabular-nums">
                          {Math.round(suggestion.similarity * 100)}%
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

      {/* Selected Word Detail Modal */}
      {selectedWord && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
          onClick={() => setSelectedWord(null)}
        >
          <div
            className="bg-[var(--bg-secondary)] rounded-2xl w-[90%] max-w-md max-h-[80vh] overflow-y-auto shadow-2xl border border-[var(--border-color)] animate-slide-up relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-[var(--overlay-color)] border-none rounded-full text-[var(--text-muted)] cursor-pointer transition-all hover:bg-emerald-500/10 hover:text-[var(--text-primary)]"
              onClick={() => setSelectedWord(null)}
            >
              ✕
            </button>
            <div className="p-6 border-b border-[var(--border-color)] flex items-baseline gap-4">
              <span className="text-3xl font-bold text-red-400">
                {selectedWord.word}
              </span>
              <span className="text-base text-[var(--text-muted)] font-mono">
                {selectedWord.romanized}
              </span>
            </div>

            <div className="p-6">
              <h4 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-4">
                সম্ভাব্য সংশোধন
              </h4>
              {selectedWord.suggestions.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {selectedWord.suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      className="flex items-center justify-between p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl cursor-pointer transition-all hover:bg-emerald-500/12 hover:border-emerald-500/25"
                      onClick={() =>
                        applySuggestion(selectedWord.word, suggestion.value)
                      }
                    >
                      <div className="flex flex-col gap-1">
                        <span className="text-xl font-semibold text-emerald-400">
                          {suggestion.value}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[var(--text-muted)] font-mono">
                            {suggestion.romanized}
                          </span>
                          {suggestion.frequency && (
                            <span className="text-[10px] text-violet-400 bg-violet-400/10 px-1.5 py-0.5 rounded-full">
                              {formatFrequency(suggestion.frequency)} ব্যবহার
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="w-12 h-12 relative flex items-center justify-center">
                        <svg
                          viewBox="0 0 36 36"
                          className="absolute w-full h-full -rotate-90"
                        >
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeDasharray={`${
                              suggestion.similarity * 100
                            }, 100`}
                            className="text-emerald-400"
                          />
                        </svg>
                        <span className="text-xs font-bold text-emerald-400">
                          {Math.round(suggestion.similarity * 100)}%
                        </span>
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
