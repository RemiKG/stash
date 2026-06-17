import { NextResponse } from "next/server";
import { getItem, patchItem, appendLedger } from "@/lib/store";
import { currentSlug } from "@/lib/session";
import { baseUrlFromReq } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Gate 1 — the Counter. Approve to list (idempotent), edit price/reserve, or set aside.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    slug?: string; action: "list" | "edit" | "decline"; price?: number; reserve?: number;
  };
  const slug = body.slug || (await currentSlug());
  if (!slug) return NextResponse.json({ error: "no shop" }, { status: 400 });
  const item = await getItem(slug, id);
  if (!item) return NextResponse.json({ error: "no item" }, { status: 404 });

  const shopUrl = `${baseUrlFromReq(req)}/s/${slug}`;

  if (body.action === "edit") {
    const patch: Record<string, number> = {};
    if (typeof body.price === "number" && body.price > 0) patch.price = Math.round(body.price);
    if (typeof body.reserve === "number" && body.reserve > 0) patch.reserve = Math.round(body.reserve);
    const patched = await patchItem(slug, id, patch);
    return NextResponse.json({ item: patched });
  }

  if (body.action === "decline") {
    const patched = await patchItem(slug, id, { status: "set_aside" });
    await appendLedger(slug, { ts: Date.now(), actor: "you", action: "set aside", item: item.title, itemId: id, amount: null, kind: "other" });
    return NextResponse.json({ item: patched });
  }

  // list — idempotent (never double-post)
  if (item.status === "listed" || item.status === "sold") {
    return NextResponse.json({ item, shopUrl, alreadyListed: true });
  }
  if (item.prohibited) return NextResponse.json({ error: "prohibited", message: item.prohibitedReason }, { status: 409 });

  const price = typeof body.price === "number" && body.price > 0 ? Math.round(body.price) : item.price;
  const reserve = typeof body.reserve === "number" && body.reserve > 0 ? Math.round(body.reserve) : item.reserve;
  const patched = await patchItem(slug, id, { status: "listed", listedAt: Date.now(), price, reserve });
  await appendLedger(slug, { ts: Date.now(), actor: "you", action: "approved · list", item: item.title, itemId: id, amount: price ?? null, kind: "sale" });
  return NextResponse.json({ item: patched, shopUrl });
}
