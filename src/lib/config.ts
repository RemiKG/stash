// config.ts — resolves the AI provider + storage location from env.
// Nothing hardcoded; the real path activates the moment a key exists.

export type Provider = "qwen" | "anthropic" | "none";

export interface AIConfig {
  provider: Provider;
  baseURL: string;
  apiKey: string;
  models: { vl: string; text: string; haggle: string; embed: string | null };
  label: string; // human label for UI/ledger transparency
}

export function resolveAI(): AIConfig {
  const forced = (process.env.STASH_AI_PROVIDER || "").toLowerCase();
  const hasQwen = !!process.env.DASHSCOPE_API_KEY;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;

  const wantQwen = forced === "qwen" || (forced !== "anthropic" && forced !== "none" && hasQwen);
  const wantAnthropic = forced === "anthropic" || (!wantQwen && forced !== "none" && hasAnthropic);

  if (wantQwen && hasQwen) {
    return {
      provider: "qwen",
      baseURL: process.env.QWEN_BASE_URL || "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
      apiKey: process.env.DASHSCOPE_API_KEY as string,
      models: {
        vl: process.env.QWEN_VL_MODEL || "qwen3-vl-plus",
        text: process.env.QWEN_TEXT_MODEL || "qwen3.7-plus",
        haggle: process.env.QWEN_HAGGLE_MODEL || "qwen3.7-max",
        embed: process.env.QWEN_EMBED_MODEL || "text-embedding-v4",
      },
      label: "Qwen Cloud",
    };
  }
  if (wantAnthropic && hasAnthropic) {
    const m = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";
    return {
      provider: "anthropic",
      baseURL: process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com/v1/",
      apiKey: process.env.ANTHROPIC_API_KEY as string,
      models: { vl: m, text: m, haggle: m, embed: null },
      label: "Anthropic (dev fallback)",
    };
  }
  return {
    provider: "none",
    baseURL: "",
    apiKey: "",
    models: { vl: "", text: "", haggle: "", embed: null },
    label: "not configured",
  };
}

export const aiReady = () => resolveAI().provider !== "none";

// The transparency line shown in Settings — always names the intended Qwen stack.
export const QWEN_STACK = "qwen3-vl-plus · text-embedding-v4 · qwen3.7-plus · qwen3.7-max";
export const QWEN_BASE_URL_PUBLIC =
  process.env.QWEN_BASE_URL || "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";

export function baseUrlFromReq(req: Request): string {
  const env = process.env.NEXT_PUBLIC_STASH_BASE_URL;
  if (env) return env.replace(/\/$/, "");
  try {
    const u = new URL(req.url);
    const host = req.headers.get("x-forwarded-host") || u.host;
    const proto = req.headers.get("x-forwarded-proto") || u.protocol.replace(":", "");
    return `${proto}://${host}`;
  } catch {
    return "";
  }
}
