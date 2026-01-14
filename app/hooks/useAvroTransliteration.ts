"use client";

import { useRef, useCallback } from "react";
import { transliterate } from "@bntk/transliteration";

// Check if a string contains only Latin characters (for Avro transliteration)
const isLatinText = (text: string): boolean => {
  return /^[a-zA-Z]+$/.test(text);
};

interface UseAvroTransliterationOptions {
  text: string;
  setText: (text: string) => void;
  onTextChange?: (text: string) => void;
  debounceMs?: number;
}

interface UseAvroTransliterationReturn {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  handleChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

/**
 * Hook to handle Avro phonetic transliteration
 * Converts English text to Bengali when space or enter is pressed
 */
export function useAvroTransliteration({
  text,
  setText,
  onTextChange,
  debounceMs = 500,
}: UseAvroTransliterationOptions): UseAvroTransliterationReturn {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const triggerCallback = useCallback(
    (newText: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        onTextChange?.(newText);
      }, debounceMs);
    },
    [onTextChange, debounceMs]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newText = e.target.value;
      setText(newText);
      triggerCallback(newText);
    },
    [setText, triggerCallback]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === " " || e.key === "Enter") {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const cursorPos = textarea.selectionStart;
        const textBeforeCursor = text.slice(0, cursorPos);

        // Find the last word before cursor
        const words = textBeforeCursor.split(/\s+/);
        const lastWord = words[words.length - 1];

        // Only transliterate if the last word is Latin characters
        if (lastWord && isLatinText(lastWord)) {
          e.preventDefault();

          const transliterated = transliterate(lastWord, { mode: "avro" });
          const textAfterCursor = text.slice(cursorPos);
          const textBeforeLastWord = textBeforeCursor.slice(
            0,
            textBeforeCursor.length - lastWord.length
          );

          const separator = e.key === "Enter" ? "\n" : " ";
          const newText =
            textBeforeLastWord + transliterated + separator + textAfterCursor;

          setText(newText);

          // Set cursor position after the transliterated word + separator
          const newCursorPos =
            textBeforeLastWord.length + transliterated.length + 1;
          setTimeout(() => {
            textarea.setSelectionRange(newCursorPos, newCursorPos);
          }, 0);

          triggerCallback(newText);
        }
      }
    },
    [text, setText, triggerCallback]
  );

  return {
    textareaRef,
    handleKeyDown,
    handleChange,
  };
}
