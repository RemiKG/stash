import { NextResponse } from "next/server";
import { getItem, patchItem, appendLedger } from "@/lib/store";
import { compose } from "@/lib/ai/engine";
import { AIUnavailable } from "@/lib/ai/client";
import { currentSlug } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { slug?: string };
  const slug = body.slug || (await currentSlug());
  if (!slug) return NextResponse.json({ error: "no shop" }, { status: 400 });
  const item = await getItem(slug, id);
  if (!item) return NextResponse.json({ error: "no item" }, { status: 404 });
  if (item.prohibited) return NextResponse.json({ item });

  try {
    const l = await compose(item);
    const patched = await patchItem(slug, id, {
      description: l.description,
      itemSpecifics: l.item_specifics,
      ebayCategory: l.category,
    });
    await appendLedger(slug, { ts: Date.now(), actor: "squirrel", action: "composed", item: item.title, itemId: id, amount: null, kind: "other" });
    return NextResponse.json({ item: patched, listingTitle: l.title });
  } catch (e) {
    if (e instanceof AIUnavailable) return NextResponse.json({ error: "ai_unavailable", message: e.message }, { status: 503 });
    return NextResponse.json({ error: "compose_failed", message: String((e as Error).message) }, { status: 500 });
  }
}
