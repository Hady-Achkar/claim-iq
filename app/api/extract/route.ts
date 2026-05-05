import { NextRequest, NextResponse } from "next/server";
import { getClient, MODEL } from "@/lib/claude";
import { buildExtractionPrompt } from "@/lib/prompts";
import { parseClaudeJson } from "@/lib/parse-json";
import type { ExtractionResponse } from "@/lib/types";

export async function POST(req: NextRequest) {
  const { note } = await req.json();

  if (!note || typeof note !== "string" || note.trim().length === 0) {
    return NextResponse.json({ error: "note is required" }, { status: 400 });
  }

  const message = await getClient().messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [{ role: "user", content: buildExtractionPrompt(note) }],
  });

  const text = message.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");

  let parsed: ExtractionResponse;
  try {
    parsed = parseClaudeJson<ExtractionResponse>(text);
  } catch {
    return NextResponse.json(
      { error: "Claude returned invalid JSON", raw: text },
      { status: 500 }
    );
  }

  return NextResponse.json(parsed);
}
