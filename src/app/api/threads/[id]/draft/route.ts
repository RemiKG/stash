import { NextResponse } from "next/server";
import { getItem, getSettings, getThread, upsertThread } from "@/lib/store";
import { negotiate } from "@/lib/ai/engine";
import { AIUnavailable } from "@/lib/ai/client";
import { gateOffer, winRateDelta } from "@/lib/policy";
import { currentSlug } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

// The Quartermaster drafts the next move; the owner gates it at Gate 2.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { slug?: string };
  const slug = body.slug || (await currentSlug());
  if (!slug) return NextResponse.json({ error: "no shop" }, { status: 400 });
  const thread = await getThread(slug, id);
  if (!thread) return NextResponse.json({ error: "no thread" }, { status: 404 });
  const item = await getItem(slug, thread.itemId);
  if (!item) return NextResponse.json({ error: "no item" }, { status: 404 });

  const lastOffer = [...thread.messages].reverse().find((m) => m.role === "buyer" && m.amount != null)?.amount ?? null;
  const settings = await getSettings(slug);

  try {
    const move = await negotiate(item, thread, settings);
    thread.draft = { text: move.reply, move: move.move, amount: move.amount, why: move.why };
    await upsertThread(thread);
    const gate = lastOffer != null ? gateOffer(item, lastOffer, settings) : null;
    return NextResponse.json({
      draft: thread.draft,
      lastOffer,
      reserve: item.reserve,
      ask: item.price,
      winRate: lastOffer != null ? winRateDelta(item, lastOffer) : 0,
      gate,
    });
  } catch (e) {
    if (e instanceof AIUnavailable) return NextResponse.json({ error: "ai_unavailable", message: e.message }, { status: 503 });
    return NextResponse.json({ error: "draft_failed", message: String((e as Error).message) }, { status: 500 });
  }
}
