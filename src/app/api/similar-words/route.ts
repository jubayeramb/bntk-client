import { NextRequest, NextResponse } from "next/server";
import { getDbClient } from "@bntk/db";
import { findSimilarWords } from "@bntk/lib/text-analysis/find-simmilar-words";

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const db = await getDbClient();
    const results = await findSimilarWords(db, text);

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Error in similar-words API:", error);
    return NextResponse.json(
      { error: "Failed to find similar words" },
      { status: 500 }
    );
  }
}
