"use client";

import { useState, useCallback, useEffect } from "react";
import { Header } from "./Header";
import { TextEditor } from "./TextEditor";
import { useAvroTransliteration } from "../hooks/useAvroTransliteration";
import { formatCount, cleanWord } from "../lib/utils";

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

export function GrammarCheckerClient() {
  const [text, setText] = useState("");
  const [results, setResults] = useState<GrammarCheckResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<GrammarCheckResult | null>(
    null
  );
  const [stats, setStats] = useState({ total: 0, pairs: 0, issues: 0 });

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

  const { textareaRef, handleKeyDown, handleChange } = useAvroTransliteration({
    text,
    setText,
    onTextChange: checkGrammar,
  });

  const applySuggestion = (original: string, replacement: string) => {
    const newText = text.replace(new RegExp(original, "g"), replacement);
    setText(newText);
    setSelectedIssue(null);
    checkGrammar(newText);
  };

  useEffect(() => {
    return () => {
      // Cleanup handled by hook
    };
  }, []);

  // Render highlighted content for the text editor
  const highlightedContent = text.split(/(\s+)/).map((segment, idx) => {
    const cleaned = cleanWord(segment);
    const result = results.find((r) => r.currentWord === cleaned);
    if (result) {
      return (
        <span
          key={idx}
          className="bg-[linear-gradient(to_bottom,transparent_92%,rgba(251,191,36,0.6)_92%)] rounded-xs pointer-events-auto cursor-pointer hover:bg-amber-600/20 transition-colors"
          onClick={() => setSelectedIssue(result)}
        >
          {segment}
        </span>
      );
    }
    return <span key={idx}>{segment}</span>;
  });

  // Render stats for header
  const statsContent = stats.total > 0 && (
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
        <span className="text-sm text-amber-600 flex items-center gap-1">
          <span className="font-semibold tabular-nums">{stats.issues}</span>{" "}
          সংশোধন
        </span>
      )}
      {stats.issues === 0 && (
        <span className="text-sm text-emerald-600 flex items-center gap-1">
          <span className="font-bold">✓</span> সঠিক
        </span>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-screen w-screen fixed inset-0 font-[family-name:var(--font-sans)] bg-[var(--bg-primary)]">
      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col bg-[var(--bg-secondary)] overflow-hidden">
        <Header type="grammar" stats={statsContent} isLoading={isLoading} />

        <TextEditor
          text={text}
          textareaRef={textareaRef}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          highlightedContent={highlightedContent}
        />
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
          <div className="flex items-center gap-2 px-4 py-2 bg-[var(--overlay-color)] border-b border-[var(--border-color)] text-sm font-semibold text-[var(--text-primary)]">
            <span className="text-base">📝</span>
            <span>ব্যাকরণ সংশোধন</span>
            <span className="text-[10px] font-medium text-amber-600 ml-auto uppercase tracking-wide">
              Suggestions
            </span>
          </div>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3 p-3">
            {results.map((result, idx) => (
              <div
                key={idx}
                className={`bg-[var(--overlay-color)] rounded-lg p-3 border border-[var(--border-color)] transition-all cursor-pointer hover:bg-amber-500/5 hover:border-amber-500/30 ${
                  selectedIssue?.position === result.position
                    ? "bg-amber-500/5 border-amber-500/30"
                    : ""
                }`}
                onClick={() => setSelectedIssue(result)}
              >
                <div className="flex items-baseline gap-1.5 mb-2 pb-2 border-b border-[var(--border-color)]">
                  <span className="text-sm text-[var(--text-secondary)]">
                    {result.prevWord}
                  </span>
                  <span className="text-base font-semibold text-amber-600">
                    {result.currentWord}
                  </span>
                  {result.currentOccurance > 0 && (
                    <span className="text-[10px] font-semibold text-[var(--text-muted)] bg-[var(--bg-primary)] px-1.5 py-0.5 rounded-full ml-auto tabular-nums">
                      {formatCount(result.currentOccurance)}
                    </span>
                  )}
                </div>

                {result.suggestions.length > 0 ? (
                  <div className="flex flex-col gap-1.5">
                    {result.suggestions.slice(0, 2).map((suggestion, sIdx) => (
                      <button
                        key={sIdx}
                        className={`flex items-center gap-2 w-full px-2.5 py-1.5 rounded-md cursor-pointer transition-all text-left hover:translate-x-0.5 ${
                          sIdx === 0
                            ? "bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-500/40"
                            : "bg-amber-500/5 border border-amber-500/10 hover:bg-amber-500/12 hover:border-amber-500/25"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          applySuggestion(
                            result.currentWord,
                            suggestion.nextWord
                          );
                        }}
                      >
                        <span className="text-sm text-[var(--text-secondary)]">
                          {result.prevWord}
                        </span>
                        <span className={`text-sm font-medium ${sIdx === 0 ? "text-emerald-500" : "text-amber-600"}`}>
                          {suggestion.nextWord}
                        </span>
                        <span className={`ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full tabular-nums ${
                          sIdx === 0
                            ? "text-emerald-400 bg-emerald-400/15"
                            : "text-violet-400 bg-violet-400/10"
                        }`}>
                          {formatCount(suggestion.occurance)}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-[var(--text-muted)] text-center py-2">
                    কোনো প্রস্তাব নেই
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
                <span className="text-3xl font-bold text-amber-600">
                  {selectedIssue.currentWord}
                </span>
              </div>
              <div className="mt-2 text-sm text-[var(--text-muted)]">
                বর্তমান জোড়া ব্যবহার:{" "}
                <span className="font-semibold text-[var(--text-secondary)] tabular-nums">
                  {formatCount(selectedIssue.currentOccurance)}
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
                          <span className="text-xl font-semibold text-amber-600">
                            {suggestion.nextWord}
                          </span>
                        </div>
                        <span className="text-xs text-[var(--text-muted)]">
                          ব্যবহার:{" "}
                          <span className="font-semibold text-violet-400 tabular-nums">
                            {formatCount(suggestion.occurance)}
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
