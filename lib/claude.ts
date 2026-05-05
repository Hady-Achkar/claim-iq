import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";

// Model used for both extraction and optimization calls
export const MODEL = "claude-sonnet-4-6";

function getApiKey(): string | undefined {
  const fromEnv = process.env.ANTHROPIC_API_KEY;
  if (fromEnv) return fromEnv;

  // Shell env may have set an empty ANTHROPIC_API_KEY that shadows .env.local.
  // Fall back to reading .env.local directly in development.
  if (process.env.NODE_ENV !== "production") {
    try {
      const raw = fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf-8");
      const match = raw.match(/^ANTHROPIC_API_KEY=(.+)$/m);
      if (match) return match[1].trim();
    } catch {}
  }
  return undefined;
}

export function getClient() {
  return new Anthropic({ apiKey: getApiKey() });
}
