import Anthropic from "@anthropic-ai/sdk";

export const MODEL = "claude-sonnet-4-6";

const API_KEY = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;

export function getClient() {
  return new Anthropic({ apiKey: API_KEY });
}
