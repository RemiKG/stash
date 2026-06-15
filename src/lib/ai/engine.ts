// engine.ts — the four Skills wired to the client + eBay + retrieval.
// identify-item · appraise-price · compose-listing · haggle.
import { chat, chatJSON, getClient, userWithImages } from "./client";
import { IDENTIFY_SYS, APPRAISE_SYS, COMPOSE_SYS, HAGGLE_SYS } from "./prompts";
import { searchComps } from "@/lib/ebay";
import { clampCounter } from "@/lib/policy";
import type { Comp, Item, Settings, Thread } from "@/lib/types";

export interface IdentifiedItem {
  title: string;
  category?: string;
  condition_grade?: string;
  condition_note?: string;
  defects?: string[];
  confidence?: number;
  question?: { text: string; options?: string[] } | null;
  flag?: boolean;
  flag_reason?: string | null;
}

export async function identifyItems(imageDataUrls: string[], hint?: string): Promise<IdentifiedItem[]> {
  const ask = hint
    ? `Identify the sellable second-hand objects in this photo. The owner clarified: "${hint}". Use it. Return the strict JSON described.`
    : "Identify the sellable second-hand objects in this photo. Return the strict JSON described.";
  const msg = userWithImages(ask, imageDataUrls.map((u) => ({ dataUrl: u })));
  const { cfg } = getClient();
  const out = await chatJSON<{ items: IdentifiedItem[] }>(
    [{ role: "system", content: IDENTIFY_SYS }, msg],
    { model: cfg.models.vl, maxTokens: 1200, temperature: 0.2 }
  );
  return (out.items || []).slice(0, 6);
}

// ---- embeddings (Qwen text-embedding-v4) with a real lexical fallback ----
async function embed(texts: string[]): Promise<number[][] | null> {
  const { client, cfg } = getClient();
  if (!cfg.models.embed) return null;
  try {
    const res = await client.embeddings.create({ model: cfg.models.embed, input: texts });
    return res.data.map((d) => d.embedding as number[]);
  } catch {
    return null;
  }
}
const cos = (a: number[], b: number[]) => {
  let d = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { d += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return d / (Math.sqrt(na) * Math.sqrt(nb) || 1);
};
const toks = (s: string) => new Set((s || "").toLowerCase().match(/[a-z0-9]+/g) || []);
function lexSim(a: string, b: string) {
  const A = toks(a), B = toks(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  A.forEach((t) => { if (B.has(t)) inter++; });
  return inter / Math.sqrt(A.size * B.size);
}

export async function rankComps(query: string, comps: Comp[], k = 4): Promise<Comp[]> {
  if (comps.length <= k) return comps;
  const vecs = await embed([query, ...comps.map((c) => c.title)]);
  let scored: { c: Comp; s: number }[];
  if (vecs) {
    const q = vecs[0];
    scored = comps.map((c, i) => ({ c, s: cos(q, vecs[i + 1]) }));
  } else {
    scored = comps.map((c) => ({ c, s: lexSim(query, c.title) }));
  }
  return scored.sort((x, y) => y.s - x.s).slice(0, k).map((x) => x.c);
}

// ---- appraise-price ----
export interface Appraisal {
  low: number;
  high: number;
  why: string;
  confidence: number;
  comps: Comp[];
  compsLive: boolean;
}
export async function appraise(item: Pick<Item, "title" | "category" | "conditionGrade" | "conditionNote" | "defects">): Promise<Appraisal> {
  const query = [item.title, item.category].filter(Boolean).join(" ");
  const live = await searchComps(query, 10);
  const compsLive = live != null;
  const comps = live ? await rankComps(query, live, 4) : [];
  const compLines = comps.length
