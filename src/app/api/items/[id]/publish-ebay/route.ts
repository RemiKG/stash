import { NextResponse } from "next/server";
import { getItem, patchItem, appendLedger } from "@/lib/store";
import { publishToEbay, EbayNotConnected } from "@/lib/ebay";
import { currentSlug } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

// The opt-in flagship: a REAL live eBay listing via the seller's OWN OAuth.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { slug?: string };
  const slug = body.slug || (await currentSlug());
  if (!slug) return NextResponse.json({ error: "no shop" }, { status: 400 });
  const item = await getItem(slug, id);
  if (!item) return NextResponse.json({ error: "no item" }, { status: 404 });
  if (item.ebayListingId) return NextResponse.json({ listingId: item.ebayListingId, alreadyPublished: true });

  try {
    const { listingId, offerId } = await publishToEbay(item);
    await patchItem(slug, id, { ebayListingId: listingId, ebayOfferId: offerId, ebayError: undefined });
    await appendLedger(slug, { ts: Date.now(), actor: "you", action: "published · eBay", item: item.title, itemId: id, amount: item.price ?? null, kind: "other", meta: { listingId } });
    return NextResponse.json({ listingId, offerId });
  } catch (e) {
    if (e instanceof EbayNotConnected) return NextResponse.json({ error: "ebay_not_connected", message: e.message }, { status: 409 });
    await patchItem(slug, id, { ebayError: String((e as Error).message) });
    return NextResponse.json({ error: "ebay_failed", message: String((e as Error).message) }, { status: 502 });
  }
}
