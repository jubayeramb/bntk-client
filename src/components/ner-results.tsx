"use client";

import { Card, CardContent } from "@bntk/components/ui/card";
import { Badge } from "@bntk/components/ui/badge";
import { User } from "lucide-react";

interface NerResultsProps {
  results: {
    entities: Array<{
      text: string;
      type: string;
      start: number;
    }>;
  };
  text: string;
}

export default function NerResults({ results, text }: NerResultsProps) {
  if (!results.entities.length) {
    return (
      <Card className="mt-6 bg-slate-50 dark:bg-slate-900/50 overflow-hidden">
        <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 flex items-center">
          <User className="h-5 w-5 text-slate-600 dark:text-slate-400 mr-2" />
          <h3 className="font-medium text-slate-700 dark:text-slate-300">
            Named Entity Recognition
          </h3>
        </div>
        <CardContent className="p-4 text-center text-slate-700 dark:text-slate-400">
          No named entities found in the text.
        </CardContent>
      </Card>
    );
  }

  // Function to highlight entities in text
  const highlightText = () => {
    let lastIndex = 0;
    const segments = [];

    // Sort entities by start position
    const sortedEntities = [...results.entities].sort(
      (a, b) => a.start - b.start
    );

    for (const entity of sortedEntities) {
      if (entity.start > lastIndex) {
        // Add text before the entity
        segments.push(
          <span key={`text-${lastIndex}`}>
            {text.substring(lastIndex, entity.start)}
          </span>
        );
      }

      // Add highlighted entity
      const entityText = entity.text;
      const entityColor = getEntityColor(entity.type);

      segments.push(
        <span
          key={`entity-${entity.start}`}
          className={`${entityColor} px-1 py-0.5 rounded relative group cursor-help`}
        >
          {entityText}
          <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
            {entity.type}
          </span>
        </span>
      );
      lastIndex = entity.start + entityText.length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      segments.push(
        <span key={`text-${lastIndex}`}>{text.substring(lastIndex)}</span>
      );
    }

    return segments;
  };

  // Get entity color based on type
  const getEntityColor = (type: string) => {
    switch (type) {
      case "PERSON":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300";
      case "LOCATION":
        return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300";
      case "ORGANIZATION":
        return "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300";
      case "DATE":
        return "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300";
    }
  };

  // Get badge color based on entity type
  const getBadgeColor = (type: string) => {
    switch (type) {
      case "PERSON":
        return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300";
      case "LOCATION":
        return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300";
      case "ORGANIZATION":
        return "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300";
      case "DATE":
        return "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300";
      default:
        return "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300";
    }
  };

  // Group entities by type
  const entityTypes = [...new Set(results.entities.map((e) => e.type))];

  return (
    <div className="mt-6 space-y-4">
      <Card className="overflow-hidden">
        <div className="bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 flex items-center">
          <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mr-2" />
          <h3 className="font-medium text-indigo-700 dark:text-indigo-400">
            Named Entity Recognition Results
          </h3>
        </div>
        <CardContent className="p-4">
          <div className="p-4 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 whitespace-pre-wrap leading-relaxed">
            {highlightText()}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="font-medium text-slate-700 dark:text-slate-300 px-1">
          Entities Found:
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          {entityTypes.map((type) => (
            <Card key={type} className="overflow-hidden">
              <div
                className={`px-4 py-2 ${
                  type === "PERSON"
                    ? "bg-blue-50 dark:bg-blue-900/20"
                    : type === "LOCATION"
                    ? "bg-green-50 dark:bg-green-900/20"
                    : type === "ORGANIZATION"
                    ? "bg-purple-50 dark:bg-purple-900/20"
                    : "bg-amber-50 dark:bg-amber-900/20"
                }`}
              >
                <h4
                  className={`font-medium ${
                    type === "PERSON"
                      ? "text-blue-700 dark:text-blue-300"
                      : type === "LOCATION"
                      ? "text-green-700 dark:text-green-300"
                      : type === "ORGANIZATION"
                      ? "text-purple-700 dark:text-purple-300"
                      : "text-amber-700 dark:text-amber-300"
                  }`}
                >
                  {type}
                </h4>
              </div>
              <CardContent className="p-3">
                <div className="flex flex-wrap gap-2">
                  {results.entities
                    .filter((e) => e.type === type)
                    .map((entity, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className={`px-2.5 py-1 ${getBadgeColor(type)}`}
                      >
                        {entity.text}
                      </Badge>
                    ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
