import Anthropic from "@anthropic-ai/sdk";

import { env } from "@/config/env";

let anthropicClient: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (!anthropicClient) {
    if (!env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not set");
    }
    anthropicClient = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }
  return anthropicClient;
}

export const SUPPORT_AI_MODEL = "claude-sonnet-4-20250514";
