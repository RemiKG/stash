// ebay.ts — LIVE comparable listings (Browse API) + real one-tap publish (Sell
// Inventory API, opt-in). Both behind env seams: activate the moment creds exist,
// degrade honestly (and say so) without them. Never faked.
import type { Comp, Item } from "./types";

const HOST = () => (process.env.EBAY_ENV === "sandbox" ? "https://api.sandbox.ebay.com" : "https://api.ebay.com");
const MKT = () => process.env.EBAY_MARKETPLACE_ID || "EBAY_US";

export const compsEnabled = () => !!(process.env.EBAY_CLIENT_ID && process.env.EBAY_CLIENT_SECRET);
export const publishEnabled = () => !!process.env.EBAY_OAUTH_TOKEN;

let tok: { value: string; exp: number } | null = null;
async function appToken(): Promise<string> {
  if (tok && tok.exp > Date.now() + 30_000) return tok.value;
  const id = process.env.EBAY_CLIENT_ID!;
  const secret = process.env.EBAY_CLIENT_SECRET!;
  const basic = Buffer.from(`${id}:${secret}`).toString("base64");
  const res = await fetch(`${HOST()}/identity/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials&scope=" + encodeURIComponent("https://api.ebay.com/oauth/api_scope"),
  });
  if (!res.ok) throw new Error(`eBay token ${res.status}`);
  const j = (await res.json()) as { access_token: string; expires_in: number };
  tok = { value: j.access_token, exp: Date.now() + j.expires_in * 1000 };
  return tok.value;
}

// Live active comps. Returns null when creds are absent (honest "no comps").
export async function searchComps(query: string, limit = 8): Promise<Comp[] | null> {
  if (!compsEnabled()) return null;
  try {
    const token = await appToken();
    const url = `${HOST()}/buy/browse/v1/item_summary/search?q=${encodeURIComponent(query)}&limit=${limit}&filter=${encodeURIComponent("buyingOptions:{FIXED_PRICE}")}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-EBAY-C-MARKETPLACE-ID": MKT(),
      },
    });
    if (!res.ok) return null;
    const j = (await res.json()) as {
      itemSummaries?: { title: string; price?: { value: string }; itemWebUrl?: string }[];
    };
    const comps: Comp[] = (j.itemSummaries || [])
      .map((s) => ({
        title: s.title,
        price: Number(s.price?.value ?? NaN),
        url: s.itemWebUrl,
        source: "eBay active",
      }))
      .filter((c) => isFinite(c.price) && c.price > 0);
    return comps;
  } catch {
    return null;
