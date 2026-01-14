"use client";

import { RefObject } from "react";

interface TextEditorProps {
  text: string;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  highlightedContent?: React.ReactNode;
  placeholder?: string;
}

export function TextEditor({
  text,
  textareaRef,
  onChange,
  onKeyDown,
  highlightedContent,
  placeholder = "এখানে লিখুন...",
}: TextEditorProps) {
  return (
    <div className="relative flex-1 flex flex-col overflow-hidden">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className="w-full flex-1 p-6 bg-transparent border-none outline-none resize-none text-2xl leading-loose text-[var(--text-primary)] font-[family-name:var(--font-sans)] caret-blue-400 overflow-y-auto placeholder:text-[var(--text-muted)] max-md:p-4 max-md:text-xl"
        spellCheck={false}
      />

      {/* Highlighted overlay */}
      <div
        className="absolute inset-0 p-6 pointer-events-none text-2xl leading-loose font-[family-name:var(--font-sans)] text-transparent whitespace-pre-wrap break-words overflow-y-auto max-md:p-4 max-md:text-xl"
        aria-hidden="true"
      >
        {highlightedContent}
      </div>
    </div>
  );
}
