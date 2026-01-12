"use client";

import { useState, useCallback, useRef, useEffect } from "react";

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

export default function SpellChecker() {
  const [text, setText] = useState("");
  const [results, setResults] = useState<SpellCheckResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedWord, setSelectedWord] = useState<SpellCheckResult | null>(null);
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

    // Debounce the spell check
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

  // Clean up debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const incorrectResults = results.filter((r) => !r.isCorrect);

  return (
    <div className="spell-checker">
      {/* Main Editor Area */}
      <div className="editor-container">
        <div className="editor-header">
          <div className="editor-title">
            <span className="logo-icon">ব্যা</span>
            <span className="app-name">ব্যাকরণ</span>
            <span className="title-badge">Spell Checker</span>
          </div>
          <div className="editor-stats">
            {stats.total > 0 && (
              <>
                <span className="stat-item">
                  <span className="stat-number">{stats.total}</span> শব্দ
                </span>
                {stats.incorrect > 0 && (
                  <span className="stat-item error">
                    <span className="stat-number">{stats.incorrect}</span> ভুল
                  </span>
                )}
                {stats.incorrect === 0 && stats.total > 0 && (
                  <span className="stat-item success">
                    <span className="checkmark">✓</span> সঠিক
                  </span>
                )}
              </>
            )}
            {isLoading && <span className="loading-indicator">পরীক্ষা করা হচ্ছে...</span>}
          </div>
        </div>

        <div className="editor-body">
          <textarea
            value={text}
            onChange={handleTextChange}
            placeholder="এখানে বাংলায় লিখুন..."
            className="main-textarea"
            spellCheck={false}
          />

          {/* Highlighted overlay */}
          <div className="text-overlay" aria-hidden="true">
            {text.split(/(\s+)/).map((segment, idx) => {
              // Strip punctuation to match tokenized words from API
              const cleanedSegment = segment.replace(/[।,;:'"?!()[\]{}॥]+/g, "").trim();
              const result = results.find((r) => r.word === cleanedSegment);
              if (result && !result.isCorrect) {
                return (
                  <span
                    key={idx}
                    className="error-word"
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
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* Suggestions Panel */}
      {incorrectResults.length > 0 && (
        <div className="suggestions-panel">
          <div className="panel-header">
            <span className="panel-icon">🔍</span>
            <span>বানান সংশোধন প্রস্তাব</span>
            <span className="panel-subtitle">Spelling Suggestions</span>
          </div>

          <div className="suggestions-grid">
            {incorrectResults.map((result, idx) => (
              <div
                key={idx}
                className={`suggestion-card ${selectedWord?.word === result.word ? "selected" : ""}`}
                onClick={() => setSelectedWord(result)}
              >
                <div className="card-header">
                  <span className="incorrect-word">{result.word}</span>
                  <span className="romanized-label">{result.romanized}</span>
                  {result.isRareWord && (
                    <span className="rare-badge" title="Rarely used word">বিরল</span>
                  )}
                </div>

                {result.suggestions.length > 0 ? (
                  <div className="suggestions-list">
                    {result.suggestions.slice(0, 5).map((suggestion, sIdx) => (
                      <button
                        key={sIdx}
                        className="suggestion-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          applySuggestion(result.word, suggestion.value);
                        }}
                      >
                        <span className="suggestion-word">{suggestion.value}</span>
                        <span className="suggestion-romanized">{suggestion.romanized}</span>
                        {suggestion.frequency && (
                          <span className="frequency-badge" title="Usage frequency">
                            {formatFrequency(suggestion.frequency)}
                          </span>
                        )}
                        <span className="similarity-badge">
                          {Math.round(suggestion.similarity * 100)}%
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="no-suggestions">কোনো প্রস্তাব পাওয়া যায়নি</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Word Detail Modal */}
      {selectedWord && (
        <div className="modal-overlay" onClick={() => setSelectedWord(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedWord(null)}>
              ✕
            </button>
            <div className="modal-header">
              <span className="modal-word">{selectedWord.word}</span>
              <span className="modal-romanized">{selectedWord.romanized}</span>
            </div>

            <div className="modal-body">
              <h4>সম্ভাব্য সংশোধন</h4>
              {selectedWord.suggestions.length > 0 ? (
                <div className="modal-suggestions">
                  {selectedWord.suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      className="modal-suggestion-btn"
                      onClick={() => applySuggestion(selectedWord.word, suggestion.value)}
                    >
                      <div className="suggestion-main">
                        <span className="suggestion-bangla">{suggestion.value}</span>
                        <div className="suggestion-meta">
                          <span className="suggestion-roman">{suggestion.romanized}</span>
                          {suggestion.frequency && (
                            <span className="modal-frequency-badge">
                              {formatFrequency(suggestion.frequency)} ব্যবহার
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="similarity-ring">
                        <svg viewBox="0 0 36 36">
                          <path
                            d="M18 2.0845
                              a 15.9155 15.9155 0 0 1 0 31.831
                              a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeDasharray={`${suggestion.similarity * 100}, 100`}
                          />
                        </svg>
                        <span>{Math.round(suggestion.similarity * 100)}%</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="no-suggestions-modal">
                  <span className="empty-icon">📭</span>
                  <span>কোনো প্রস্তাব পাওয়া যায়নি</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .spell-checker {
          display: flex;
          flex-direction: column;
          height: 100vh;
          width: 100vw;
          position: fixed;
          top: 0;
          left: 0;
          font-family: var(--font-sans);
          background: linear-gradient(135deg, #0a0a14 0%, #0d1117 100%);
        }

        .editor-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          overflow: hidden;
        }

        .editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 2rem;
          background: rgba(0, 0, 0, 0.3);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          flex-shrink: 0;
        }

        .editor-title {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1.125rem;
          font-weight: 600;
          color: #e0e0e0;
        }

        .logo-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2.5rem;
          height: 2.5rem;
          background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);
          border-radius: 0.5rem;
          font-size: 1rem;
          font-weight: 700;
          color: white;
          font-family: "Hind Siliguri", "Noto Sans Bengali", sans-serif;
        }

        .app-name {
          font-size: 1.5rem;
          font-weight: 700;
          background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-family: "Hind Siliguri", "Noto Sans Bengali", sans-serif;
        }

        .title-badge {
          font-size: 0.75rem;
          font-weight: 500;
          color: #4ade80;
          background: rgba(74, 222, 128, 0.1);
          padding: 0.25rem 0.5rem;
          border-radius: 9999px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .editor-stats {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .stat-item {
          font-size: 0.875rem;
          color: #a0a0a0;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .stat-number {
          font-weight: 600;
          color: #e0e0e0;
          font-variant-numeric: tabular-nums;
        }

        .stat-item.error {
          color: #f87171;
        }

        .stat-item.error .stat-number {
          color: #f87171;
        }

        .stat-item.success {
          color: #4ade80;
        }

        .checkmark {
          font-weight: bold;
        }

        .loading-indicator {
          font-size: 0.875rem;
          color: #60a5fa;
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .editor-body {
          position: relative;
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .main-textarea {
          width: 100%;
          flex: 1;
          padding: 1.5rem 2rem;
          background: transparent;
          border: none;
          outline: none;
          resize: none;
          font-size: 1.5rem;
          line-height: 2;
          color: #f0f0f0;
          font-family: "Hind Siliguri", "Noto Sans Bengali", sans-serif;
          caret-color: #60a5fa;
          overflow-y: auto;
        }

        .main-textarea::placeholder {
          color: #4a4a6a;
        }

        .text-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          padding: 1.5rem 2rem;
          pointer-events: none;
          font-size: 1.5rem;
          line-height: 2;
          font-family: "Hind Siliguri", "Noto Sans Bengali", sans-serif;
          color: transparent;
          white-space: pre-wrap;
          word-wrap: break-word;
          overflow-y: auto;
        }

        .error-word {
          background: linear-gradient(to bottom, transparent 85%, rgba(248, 113, 113, 0.6) 85%);
          border-radius: 2px;
          pointer-events: auto;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .error-word:hover {
          background: rgba(248, 113, 113, 0.2);
        }

        .error-banner {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          background: linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%);
          border-radius: 0.75rem;
          color: #fecaca;
          font-size: 0.875rem;
        }

        .error-icon {
          font-size: 1.25rem;
        }

        .suggestions-panel {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          max-height: 40vh;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          overflow-y: auto;
          box-shadow: 
            0 -10px 40px rgba(0, 0, 0, 0.4),
            0 0 0 1px rgba(255, 255, 255, 0.05);
          z-index: 40;
          animation: slideUp 0.3s ease;
        }

        .panel-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          background: rgba(0, 0, 0, 0.2);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          font-size: 1rem;
          font-weight: 600;
          color: #e0e0e0;
        }

        .panel-icon {
          font-size: 1.25rem;
        }

        .panel-subtitle {
          font-size: 0.75rem;
          font-weight: 500;
          color: #60a5fa;
          margin-left: auto;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .suggestions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1rem;
          padding: 1.5rem;
        }

        .suggestion-card {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 0.75rem;
          padding: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.05);
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .suggestion-card:hover,
        .suggestion-card.selected {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(96, 165, 250, 0.3);
          transform: translateY(-2px);
        }

        .card-header {
          display: flex;
          align-items: baseline;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .incorrect-word {
          font-size: 1.25rem;
          font-weight: 600;
          color: #f87171;
          font-family: "Hind Siliguri", "Noto Sans Bengali", sans-serif;
        }

        .romanized-label {
          font-size: 0.75rem;
          color: #6b7280;
          font-family: var(--font-mono);
        }

        .suggestions-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .suggestion-btn {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          padding: 0.625rem 0.75rem;
          background: rgba(74, 222, 128, 0.05);
          border: 1px solid rgba(74, 222, 128, 0.1);
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: left;
        }

        .suggestion-btn:hover {
          background: rgba(74, 222, 128, 0.12);
          border-color: rgba(74, 222, 128, 0.25);
          transform: translateX(4px);
        }

        .suggestion-word {
          font-size: 1rem;
          font-weight: 500;
          color: #4ade80;
          font-family: "Hind Siliguri", "Noto Sans Bengali", sans-serif;
        }

        .suggestion-romanized {
          font-size: 0.75rem;
          color: #6b7280;
          font-family: var(--font-mono);
        }

        .frequency-badge {
          font-size: 0.65rem;
          font-weight: 600;
          color: #a78bfa;
          background: rgba(167, 139, 250, 0.1);
          padding: 0.125rem 0.375rem;
          border-radius: 9999px;
          font-variant-numeric: tabular-nums;
        }

        .similarity-badge {
          margin-left: auto;
          font-size: 0.75rem;
          font-weight: 600;
          color: #60a5fa;
          background: rgba(96, 165, 250, 0.1);
          padding: 0.125rem 0.5rem;
          border-radius: 9999px;
          font-variant-numeric: tabular-nums;
        }

        .rare-badge {
          font-size: 0.625rem;
          font-weight: 600;
          color: #fbbf24;
          background: rgba(251, 191, 36, 0.15);
          padding: 0.125rem 0.375rem;
          border-radius: 9999px;
          margin-left: auto;
        }

        .no-suggestions {
          font-size: 0.875rem;
          color: #6b7280;
          text-align: center;
          padding: 1rem;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 50;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal-content {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          border-radius: 1rem;
          width: 90%;
          max-width: 480px;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 
            0 25px 50px -12px rgba(0, 0, 0, 0.5),
            0 0 0 1px rgba(255, 255, 255, 0.1);
          animation: slideUp 0.3s ease;
          position: relative;
        }

        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .modal-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          width: 2rem;
          height: 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.05);
          border: none;
          border-radius: 50%;
          color: #9ca3af;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .modal-close:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #f0f0f0;
        }

        .modal-header {
          padding: 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: baseline;
          gap: 1rem;
        }

        .modal-word {
          font-size: 1.75rem;
          font-weight: 700;
          color: #f87171;
          font-family: "Hind Siliguri", "Noto Sans Bengali", sans-serif;
        }

        .modal-romanized {
          font-size: 1rem;
          color: #6b7280;
          font-family: var(--font-mono);
        }

        .modal-body {
          padding: 1.5rem;
        }

        .modal-body h4 {
          font-size: 0.875rem;
          font-weight: 600;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 1rem;
        }

        .modal-suggestions {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .modal-suggestion-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          background: rgba(74, 222, 128, 0.05);
          border: 1px solid rgba(74, 222, 128, 0.1);
          border-radius: 0.75rem;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .modal-suggestion-btn:hover {
          background: rgba(74, 222, 128, 0.12);
          border-color: rgba(74, 222, 128, 0.25);
        }

        .suggestion-main {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .suggestion-bangla {
          font-size: 1.25rem;
          font-weight: 600;
          color: #4ade80;
          font-family: "Hind Siliguri", "Noto Sans Bengali", sans-serif;
        }

        .suggestion-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .suggestion-roman {
          font-size: 0.75rem;
          color: #6b7280;
          font-family: var(--font-mono);
        }

        .modal-frequency-badge {
          font-size: 0.65rem;
          color: #a78bfa;
          background: rgba(167, 139, 250, 0.1);
          padding: 0.125rem 0.375rem;
          border-radius: 9999px;
        }

        .similarity-ring {
          width: 48px;
          height: 48px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .similarity-ring svg {
          position: absolute;
          width: 100%;
          height: 100%;
          transform: rotate(-90deg);
        }

        .similarity-ring svg path {
          stroke: #4ade80;
          stroke-linecap: round;
        }

        .similarity-ring span {
          font-size: 0.75rem;
          font-weight: 700;
          color: #4ade80;
        }

        .no-suggestions-modal {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 2rem;
          color: #6b7280;
        }

        .empty-icon {
          font-size: 2rem;
        }
      `}</style>
    </div>
  );
}
