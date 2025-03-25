"use client";

import { Textarea } from "@bntk/components/ui/textarea";

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function TextInput({
  value,
  onChange,
  placeholder,
}: TextInputProps) {
  return (
    <div className="relative">
      <Textarea
        placeholder={placeholder || "Enter your text here..."}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[200px] text-base resize-y p-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
      />
      <div className="absolute inset-0 pointer-events-none border border-indigo-500 opacity-0 rounded-md transition-opacity duration-200 textarea-focus-ring"></div>
    </div>
  );
}
