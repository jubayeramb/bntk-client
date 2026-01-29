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
  const previousTextRef = useRef<string>(text);
  const isProcessingRef = useRef<boolean>(false);

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

  const performTransliteration = useCallback(
    (currentText: string, cursorPos: number): { newText: string; newCursorPos: number } | null => {
      const textBeforeCursor = currentText.slice(0, cursorPos);
      
      // Find the last word before cursor
      const words = textBeforeCursor.split(/\s+/);
      const lastWord = words[words.length - 1];

      // Only transliterate if the last word is Latin characters
      if (lastWord && isLatinText(lastWord)) {
        const transliterated = transliterate(lastWord, { mode: "avro" });
        const textAfterCursor = currentText.slice(cursorPos);
        const textBeforeLastWord = textBeforeCursor.slice(
          0,
          textBeforeCursor.length - lastWord.length
        );

        const newText = textBeforeLastWord + transliterated + textAfterCursor;
        const newCursorPos = textBeforeLastWord.length + transliterated.length;
        
        return { newText, newCursorPos };
      }
      
      return null;
    },
    []
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newText = e.target.value;
      const textarea = textareaRef.current;
      
      if (!textarea || isProcessingRef.current) {
        setText(newText);
        triggerCallback(newText);
        return;
      }

      const cursorPos = textarea.selectionStart;
      const previousText = previousTextRef.current;
      
      // Check if a space or newline was just added
      const addedChar = newText[cursorPos - 1];
      const isSpaceOrNewline = addedChar === " " || addedChar === "\n";
      
      if (isSpaceOrNewline && newText.length > previousText.length) {
        isProcessingRef.current = true;
        
        // Try to transliterate the word before the space/newline
        const result = performTransliteration(newText, cursorPos - 1);
        
        if (result) {
          const { newText: transliteratedText, newCursorPos } = result;
          const finalText = 
            transliteratedText.slice(0, newCursorPos) + 
            addedChar + 
            transliteratedText.slice(newCursorPos);
          const finalCursorPos = newCursorPos + 1;
          
          setText(finalText);
          previousTextRef.current = finalText;
          
          // Set cursor position after the transliterated word + separator
          setTimeout(() => {
            textarea.setSelectionRange(finalCursorPos, finalCursorPos);
            isProcessingRef.current = false;
          }, 0);
          
          triggerCallback(finalText);
          return;
        }
        
        isProcessingRef.current = false;
      }
      
      setText(newText);
      previousTextRef.current = newText;
      triggerCallback(newText);
    },
    [setText, triggerCallback, performTransliteration]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Desktop keyboard shortcut for immediate transliteration
      if (e.key === " " || e.key === "Enter") {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const cursorPos = textarea.selectionStart;
        
        const result = performTransliteration(text, cursorPos);
        
        if (result) {
          e.preventDefault();
          isProcessingRef.current = true;
          
          const { newText, newCursorPos } = result;
          const separator = e.key === "Enter" ? "\n" : " ";
          const finalText = 
            newText.slice(0, newCursorPos) + 
            separator + 
            newText.slice(newCursorPos);
          const finalCursorPos = newCursorPos + 1;

          setText(finalText);
          previousTextRef.current = finalText;

          // Set cursor position after the transliterated word + separator
          setTimeout(() => {
            textarea.setSelectionRange(finalCursorPos, finalCursorPos);
            isProcessingRef.current = false;
          }, 0);

          triggerCallback(finalText);
        }
      }
    },
    [text, setText, triggerCallback, performTransliteration]
  );

  return {
    textareaRef,
    handleKeyDown,
    handleChange,
  };
}
