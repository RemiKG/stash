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
