import { Card } from "@bntk/components/ui/card";

interface TransliterationResultsProps {
  results: {
    transliterated: string;
  };
}

export default function TransliterationResults({ results }: TransliterationResultsProps) {
  return (
    <Card className="p-4 mt-4">
      <h3 className="text-lg font-medium mb-2">Transliterated Text</h3>
      <p className="text-lg">{results.transliterated}</p>
    </Card>
  );
} 