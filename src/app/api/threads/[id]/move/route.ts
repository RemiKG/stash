import { NextResponse } from "next/server";
import { getItem, getSettings, getThread, upsertThread, appendLedger } from "@/lib/store";
import { clampCounter } from "@/lib/policy";
import { currentSlug } from "@/lib/session";
import { money } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The owner NODs a negotiation move (accept / counter / decline). Gate 2.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { slug?: string; move: "counter" | "accept" | "decline"; amount?: number };
  const slug = body.slug || (await currentSlug());
  if (!slug) return NextResponse.json({ error: "no shop" }, { status: 400 });
  const thread = await getThread(slug, id);
  if (!thread) return NextResponse.json({ error: "no thread" }, { status: 404 });
  const item = await getItem(slug, thread.itemId);
  if (!item) return NextResponse.json({ error: "no item" }, { status: 404 });
  const settings = await getSettings(slug);

  const lastOffer = [...thread.messages].reverse().find((m) => m.role === "buyer" && m.amount != null)?.amount ?? null;

  if (body.move === "counter") {
    const amount = clampCounter(body.amount ?? thread.draft?.amount ?? item.reserve ?? 0, item, settings);
    const text = thread.draft?.text || `I can do ${money(amount)} — firm but friendly.`;
    thread.messages.push({ role: "qm", text, ts: Date.now(), amount });
    thread.rounds += 1;
    thread.status = "open";
    thread.draft = null;
    await appendLedger(slug, { ts: Date.now(), actor: "squirrel", action: "counter", item: item.title, itemId: item.id, amount, kind: "message" });
  } else if (body.move === "accept") {
    const price = body.amount ?? lastOffer ?? item.price ?? 0;
    thread.agreedPrice = Math.round(price);
    thread.status = "accepted";
    thread.messages.push({ role: "qm", text: `Deal at ${money(price)}. I'll wrap it up.`, ts: Date.now(), amount: Math.round(price) });
    thread.draft = null;
    await appendLedger(slug, { ts: Date.now(), actor: "you", action: "accepted · deal", item: item.title, itemId: item.id, amount: Math.round(price), kind: "message" });
  } else {
    thread.status = "declined";
    thread.messages.push({ role: "qm", text: "Thanks for the offer — I'll hold for now.", ts: Date.now(), amount: null });
    thread.draft = null;
    await appendLedger(slug, { ts: Date.now(), actor: "you", action: "declined", item: item.title, itemId: item.id, amount: null, kind: "message" });
  }
  await upsertThread(thread);
  return NextResponse.json({ thread });
}
