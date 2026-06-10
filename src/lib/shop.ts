// shop.ts — derived views over stored data.
import { getItems, getSettings, getShop, getThreads } from "./store";
import type { Item, Settings, Shop, Thread } from "./types";

export interface Totals {
  found: number; // cumulative proceeds from sold items
  listed: number; // items that reached the shelf (listed + sold)
  sold: number; // items sold
  pendingOffers: number; // open buyer threads waiting at the counter
}

export function computeTotals(items: Item[], threads: Thread[]): Totals {
  const sold = items.filter((i) => i.status === "sold");
  const listed = items.filter((i) => i.status === "listed" || i.status === "sold");
  const found = sold.reduce((s, i) => s + (i.soldPrice ?? i.price ?? 0), 0);
  const pendingOffers = threads.filter((t) => t.status === "open").length;
  return { found, listed: listed.length, sold: sold.length, pendingOffers };
}

export interface ShopView {
  shop: Shop;
  items: Item[];
  threads: Thread[];
  settings: Settings;
  totals: Totals;
}

export async function shopView(slug: string): Promise<ShopView | null> {
  const shop = await getShop(slug);
  if (!shop) return null;
  const [items, threads, settings] = await Promise.all([getItems(slug), getThreads(slug), getSettings(slug)]);
  // newest first for lists
  items.sort((a, b) => b.createdAt - a.createdAt);
  return { shop, items, threads, settings, totals: computeTotals(items, threads) };
}

// items visible on the public shelf (listed or sold), oldest-first so the shelf is stable
export function shelfItems(items: Item[]): Item[] {
  return items
    .filter((i) => i.status === "listed" || i.status === "sold")
    .sort((a, b) => (a.listedAt ?? a.createdAt) - (b.listedAt ?? b.createdAt));
}
