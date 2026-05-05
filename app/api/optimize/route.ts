import { NextRequest, NextResponse } from "next/server";
import { getClient, MODEL } from "@/lib/claude";
import { buildOptimizationPrompt } from "@/lib/prompts";
import { parseClaudeJson } from "@/lib/parse-json";
import { POLICIES, DEFAULT_POLICY_ID } from "@/lib/policies";
import type { ExtractedTreatment, OptimizeResponse } from "@/lib/types";

export async function POST(req: NextRequest) {
  const { treatments, policyId } = await req.json() as {
    treatments: ExtractedTreatment[];
    policyId?: string;
  };

  if (!Array.isArray(treatments) || treatments.length === 0) {
    return NextResponse.json({ error: "treatments array is required" }, { status: 400 });
  }

  const policy = POLICIES[policyId ?? DEFAULT_POLICY_ID];
  if (!policy) {
    return NextResponse.json({ error: "policy not found" }, { status: 400 });
  }

  const message = await getClient().messages.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [{ role: "user", content: buildOptimizationPrompt(treatments, policy) }],
  });

  const text = message.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");

  let parsed: OptimizeResponse;
  try {
    parsed = parseClaudeJson<OptimizeResponse>(text);
  } catch {
    return NextResponse.json(
      { error: "Claude returned invalid JSON", raw: text },
      { status: 500 }
    );
  }

  return NextResponse.json(parsed);
}
