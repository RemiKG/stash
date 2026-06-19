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
  }
}

// Real one-tap publish via the seller's OWN OAuth token (opt-in bonus).
export class EbayNotConnected extends Error {
  constructor() {
    super("eBay is not connected. Add the seller's EBAY_OAUTH_TOKEN (Sell Inventory scope) to publish for real.");
    this.name = "EbayNotConnected";
  }
}

export async function publishToEbay(item: Item): Promise<{ listingId: string; offerId: string }> {
  if (!publishEnabled()) throw new EbayNotConnected();
  const token = process.env.EBAY_OAUTH_TOKEN!;
  const h = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "Content-Language": "en-US",
    "X-EBAY-C-MARKETPLACE-ID": MKT(),
  };
  const sku = `stash-${item.id}`;
  // 1) createOrReplaceInventoryItem
  const inv = await fetch(`${HOST()}/sell/inventory/v1/inventory_item/${encodeURIComponent(sku)}`, {
    method: "PUT",
    headers: h,
    body: JSON.stringify({
      availability: { shipToLocationAvailability: { quantity: 1 } },
      condition: "USED_GOOD",
      product: {
        title: item.title.slice(0, 80),
        description: item.description || item.title,
        aspects: Object.fromEntries(Object.entries(item.itemSpecifics || {}).map(([k, v]) => [k, [String(v)]])),
      },
    }),
  });
  if (!inv.ok && inv.status !== 204) throw new Error(`inventory ${inv.status}: ${await inv.text()}`);
  // 2) createOffer
  const offRes = await fetch(`${HOST()}/sell/inventory/v1/offer`, {
    method: "POST",
    headers: h,
    body: JSON.stringify({
      sku,
      marketplaceId: MKT(),
      format: "FIXED_PRICE",
      availableQuantity: 1,
      categoryId: process.env.EBAY_CATEGORY_ID || "139973",
      listingDescription: item.description || item.title,
      pricingSummary: { price: { value: String(item.price ?? item.priceHigh ?? 0), currency: "USD" } },
      merchantLocationKey: process.env.EBAY_LOCATION_KEY || "stash-default",
      listingPolicies: {
        fulfillmentPolicyId: process.env.EBAY_FULFILLMENT_POLICY,
        paymentPolicyId: process.env.EBAY_PAYMENT_POLICY,
        returnPolicyId: process.env.EBAY_RETURN_POLICY,
      },
    }),
  });
  if (!offRes.ok) throw new Error(`offer ${offRes.status}: ${await offRes.text()}`);
  const { offerId } = (await offRes.json()) as { offerId: string };
  // 3) publishOffer
  const pub = await fetch(`${HOST()}/sell/inventory/v1/offer/${offerId}/publish`, { method: "POST", headers: h });
  if (!pub.ok) throw new Error(`publish ${pub.status}: ${await pub.text()}`);
  const { listingId } = (await pub.json()) as { listingId: string };
  return { listingId, offerId };
}
