// client.ts — one OpenAI-compatible client, pointed at whichever provider's key
// is present (Qwen Cloud by default; Anthropic as a dev/verification fallback).
// Both the Qwen `compatible-mode` endpoint and Anthropic's `/v1/` are
// OpenAI-compatible, so a single code path drives the whole pipeline.
import OpenAI from "openai";
import { resolveAI, type AIConfig } from "@/lib/config";

export class AIUnavailable extends Error {
  constructor() {
    super("No AI provider configured — set DASHSCOPE_API_KEY (Qwen Cloud) or ANTHROPIC_API_KEY.");
    this.name = "AIUnavailable";
  }
}

export function getClient(): { client: OpenAI; cfg: AIConfig } {
  const cfg = resolveAI();
  if (cfg.provider === "none") throw new AIUnavailable();
  const client = new OpenAI({
    apiKey: cfg.apiKey,
    baseURL: cfg.baseURL,
    // Anthropic's OpenAI-compat requires this header to be tolerant of the SDK;
    // it is harmless for Qwen. Timeouts keep the UI honest under a slow model.
    timeout: 60_000,
    maxRetries: 1,
  });
  return { client, cfg };
}

export type ImageInput = { dataUrl: string };

type Msg = OpenAI.Chat.Completions.ChatCompletionMessageParam;

export async function chat(
  messages: Msg[],
  opts: { model?: string; maxTokens?: number; temperature?: number } = {}
): Promise<string> {
  const { client, cfg } = getClient();
  const model = opts.model || cfg.models.text;
  const res = await client.chat.completions.create({
    model,
    messages,
    max_tokens: opts.maxTokens ?? 1024,
    temperature: opts.temperature ?? 0.4,
  });
  return res.choices?.[0]?.message?.content?.trim() || "";
}

// robustly pull the first JSON object/array out of a model reply
export function extractJSON<T = unknown>(text: string): T {
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  // find the outermost {...} or [...]
  const firstObj = t.indexOf("{");
  const firstArr = t.indexOf("[");
  let start = -1;
  if (firstObj === -1) start = firstArr;
  else if (firstArr === -1) start = firstObj;
  else start = Math.min(firstObj, firstArr);
  if (start === -1) throw new Error("no JSON found in model reply");
  const open = t[start];
  const close = open === "{" ? "}" : "]";
  let depth = 0, end = -1, inStr = false, esc = false;
  for (let i = start; i < t.length; i++) {
    const ch = t[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
    } else {
      if (ch === '"') inStr = true;
      else if (ch === open) depth++;
      else if (ch === close) { depth--; if (depth === 0) { end = i; break; } }
    }
  }
  if (end === -1) throw new Error("unbalanced JSON in model reply");
  return JSON.parse(t.slice(start, end + 1)) as T;
}

export async function chatJSON<T = unknown>(
  messages: Msg[],
  opts: { model?: string; maxTokens?: number; temperature?: number } = {}
): Promise<T> {
  const text = await chat(messages, { temperature: 0.2, ...opts });
  return extractJSON<T>(text);
}

export function userWithImages(text: string, images: ImageInput[]): Msg {
  return {
    role: "user",
    content: [
      { type: "text", text },
      ...images.map((im) => ({ type: "image_url" as const, image_url: { url: im.dataUrl } })),
    ],
  };
}
