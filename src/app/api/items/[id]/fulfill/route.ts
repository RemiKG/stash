import { NextResponse } from "next/server";
import { getItem, getItems, getThreads, patchItem, upsertThread, appendLedger } from "@/lib/store";
import { computeTotals } from "@/lib/shop";
import { currentSlug } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Gate 3 — Fulfill + SOLD. The SOLD state + ledger are REAL; the label purchase /
// pickup booking is simulated unless a carrier API is wired (honest limitation).
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { slug?: string; method?: "label" | "pickup"; threadId?: string };
  const slug = body.slug || (await currentSlug());
  if (!slug) return NextResponse.json({ error: "no shop" }, { status: 400 });
  const item = await getItem(slug, id);
  if (!item) return NextResponse.json({ error: "no item" }, { status: 404 });
  if (item.status === "sold") {
    const [items, threads] = await Promise.all([getItems(slug), getThreads(slug)]);
    return NextResponse.json({ item, totals: computeTotals(items, threads), alreadySold: true });
  }

  const threads = await getThreads(slug);
  const thread = body.threadId ? threads.find((t) => t.id === body.threadId) : threads.find((t) => t.itemId === id && (t.status === "accepted" || t.status === "open"));
  const soldPrice = thread?.agreedPrice ?? item.price ?? item.priceHigh ?? 0;
  const buyer = thread?.buyer ?? "a buyer";

  const patched = await patchItem(slug, id, { status: "sold", soldAt: Date.now(), soldPrice, buyer });
  if (thread) { thread.status = "closed"; await upsertThread(thread); }

  await appendLedger(slug, { ts: Date.now(), actor: "squirrel", action: "sold", item: item.title, itemId: id, amount: soldPrice, kind: "sale", meta: { method: body.method || "label", buyer } });

  const items = await getItems(slug);
  return NextResponse.json({ item: patched, totals: computeTotals(items, await getThreads(slug)), method: body.method || "label" });
}
