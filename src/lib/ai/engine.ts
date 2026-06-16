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
    ? comps.map((c) => `- ${c.title} — $${c.price}`).join("\n")
    : "(no live comparable listings available)";
  const user = `Item: ${item.title}
Category: ${item.category || "unknown"}
Condition: ${item.conditionGrade || "?"}${item.conditionNote ? " — " + item.conditionNote : ""}
Defects: ${(item.defects || []).join(", ") || "none noted"}

Comparable ACTIVE listings:
${compLines}

Reason a defensible price band.`;
  const { cfg } = getClient();
  const r = await chatJSON<{ low: number; high: number; why: string; confidence: number }>(
    [{ role: "system", content: APPRAISE_SYS }, { role: "user", content: user }],
    { model: cfg.models.text, maxTokens: 400 }
  );
  let low = Math.round(r.low), high = Math.round(r.high);
  if (high < low) [low, high] = [high, low];
  return { low, high, why: r.why, confidence: Math.max(0, Math.min(100, Math.round(r.confidence))), comps, compsLive };
}

// ---- compose-listing ----
export interface Listing {
  title: string;
  description: string;
  item_specifics: Record<string, string>;
  category: string;
}
export async function compose(item: Item): Promise<Listing> {
  const user = `Compose the listing.
Title seed: ${item.title}
Category: ${item.category || "unknown"}
Condition: ${item.conditionGrade || "?"}${item.conditionNote ? " — " + item.conditionNote : ""}
Defects: ${(item.defects || []).join(", ") || "none"}
Asking price: $${item.price ?? item.priceHigh ?? "?"}`;
  const { cfg } = getClient();
  const r = await chatJSON<Listing>(
    [{ role: "system", content: COMPOSE_SYS }, { role: "user", content: user }],
    { model: cfg.models.text, maxTokens: 500 }
  );
  return {
    title: (r.title || item.title).slice(0, 80),
    description: r.description || "",
    item_specifics: r.item_specifics || {},
    category: r.category || item.category || "Other",
  };
}

// ---- haggle ----
export interface Move {
  move: "counter" | "accept" | "decline";
  amount: number | null;
  reply: string;
  why: string;
}
export async function negotiate(item: Item, thread: Thread, settings: Settings): Promise<Move> {
  const reserve = item.reserve ?? 0;
  const ask = item.price ?? item.priceHigh ?? 0;
  const toneWord = settings.tone < 0.34 ? "friendly" : settings.tone > 0.66 ? "firm" : "firm but friendly";
  const convo = thread.messages
    .map((m) => `${m.role === "buyer" ? "Buyer" : m.role === "qm" ? "You (Quartermaster)" : "System"}: ${m.text}`)
    .join("\n");
  const user = `Item: ${item.title}
Listed price: $${ask}
Reserve floor (NEVER go below): $${reserve}
Tone: ${toneWord} (${settings.tone.toFixed(2)})
Round: ${thread.rounds + 1} of ${settings.maxRounds}
Bundles allowed: ${settings.suggestBundles ? "yes" : "no"}

Thread:
${convo}

Draft the next move.`;
  const { cfg } = getClient();
  const r = await chatJSON<Move>(
    [{ role: "system", content: HAGGLE_SYS }, { role: "user", content: user }],
    { model: cfg.models.haggle, maxTokens: 400, temperature: 0.5 }
  );
  // policy disposes: clamp any counter so it can never dip below reserve.
  if (r.move === "counter" && r.amount != null) r.amount = clampCounter(r.amount, item, settings);
  if (r.move === "accept") {
    // only accept if the buyer's latest offer is at/above reserve; else hold.
    const lastOffer = [...thread.messages].reverse().find((m) => m.role === "buyer" && m.amount != null)?.amount ?? null;
    if (lastOffer != null && lastOffer < reserve) { r.move = "counter"; r.amount = clampCounter(reserve, item, settings); }
  }
  return r;
}

export function draftReply(text: string): Promise<string> {
  return chat([{ role: "user", content: text }], { maxTokens: 200 });
}
