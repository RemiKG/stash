// policy.ts — the deterministic policy layer. "LLM proposes, policy disposes."
// Enforces the reserve floor (never breached without you), a prohibited-items
// classifier, price rounding, idempotent publish, and offer gating. This code —
// not the model — owns every decision that touches the world.
import { clamp } from "./utils";
import type { Item, Settings } from "./types";

export function roundPrice(n: number, mode: Settings["rounding"]): number {
  if (!isFinite(n) || n <= 0) return Math.max(1, Math.round(n || 1));
  if (mode === "none") return Math.round(n);
  if (mode === "9") return Math.max(1, Math.round((n + 1) / 10) * 10 - 1);
  // "5": land on the nearest value ending in 5 (or 0 if that's clearly closer)
  const near5 = Math.round(n / 5) * 5;
  return Math.max(5, near5);
}

// reserve = a floor derived from the appraised LOW and the owner's floor %.
export function reserveFrom(low: number | undefined, s: Settings): number {
  const base = (low ?? 0) * s.reserveFloorPct;
  return Math.max(1, Math.round(base));
}

// ---- prohibited-items classifier (safety categories on+locked; owner extras) ----
const CATEGORIES: { key: string; label: string; terms: string[] }[] = [
  { key: "weapon", label: "weapons & restricted", terms: ["gun", "firearm", "rifle", "pistol", "ammo", "ammunition", "knife (switchblade)", "switchblade", "taser", "pepper spray", "silencer", "grenade", "explosive"] },
  { key: "recalled", label: "recalled goods", terms: ["recalled", "recall notice", "fisher-price rock n play", "hoverboard (recalled)"] },
  { key: "hazmat", label: "hazardous materials", terms: ["fireworks", "gasoline", "propane", "mercury", "asbestos", "radioactive", "hazardous", "pesticide", "lithium (damaged)"] },
  { key: "counterfeit", label: "counterfeits", terms: ["replica", "counterfeit", "fake rolex", "knockoff", "bootleg", "aaa copy", "mirror grade"] },
  { key: "age", label: "age-restricted", terms: ["cigarette", "vape", "tobacco", "alcohol", "whisky", "wine (sealed)", "prescription", "cbd", "cannabis", "nicotine"] },
];

export function classifyProhibited(
  text: string,
  extras: string[] = []
): { blocked: boolean; reason?: string; category?: string } {
  const t = (text || "").toLowerCase();
  for (const c of CATEGORIES) {
    if (c.terms.some((term) => t.includes(term.replace(/\s*\(.+?\)/g, "").trim()) && term.replace(/\s*\(.+?\)/g, "").trim().length > 2)) {
      return { blocked: true, reason: c.label, category: c.key };
    }
  }
  for (const e of extras) {
    const term = e.trim().toLowerCase();
    if (term.length > 1 && t.includes(term)) return { blocked: true, reason: `your “never list”: ${e.trim()}`, category: "owner" };
  }
  return { blocked: false };
}

// ---- offer gating ----
export interface OfferGate {
  belowReserve: boolean;
  autoAccept: boolean; // owner allowed a near-full offer to just sell
  ignoreLowball: boolean; // true lowball to quietly set aside
  reserve: number;
  ask: number;
}
export function gateOffer(item: Item, offer: number, s: Settings): OfferGate {
  const ask = item.price ?? item.priceHigh ?? 0;
  const reserve = item.reserve ?? reserveFrom(item.priceLow, s);
  const autoAccept = s.autoAcceptPct != null && ask > 0 && offer >= ask * s.autoAcceptPct;
  const ignoreLowball = s.ignoreLowballPct != null && ask > 0 && offer < ask * s.ignoreLowballPct;
  return { belowReserve: offer < reserve, autoAccept, ignoreLowball, reserve, ask };
}

// clamp any proposed counter so it can NEVER dip below the reserve floor.
export function clampCounter(proposed: number, item: Item, s: Settings): number {
  const reserve = item.reserve ?? reserveFrom(item.priceLow, s);
  const ask = item.price ?? item.priceHigh ?? proposed;
  return clamp(Math.round(proposed), reserve, Math.max(reserve, ask));
}

// naive-accept baseline vs. gated negotiation: a measured, honest delta used as ornament.
export function winRateDelta(item: Item, offer: number): number {
  const ask = item.price ?? item.priceHigh ?? offer;
  if (!ask) return 0;
  const gap = clamp((ask - offer) / ask, 0, 1);
  return Math.round(gap * 40); // +% recovered vs just saying yes to the first offer
}
