import { NextResponse } from "next/server";
import { getItem, getThreads, upsertThread, appendLedger } from "@/lib/store";
import { id } from "@/lib/utils";
import type { Thread } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HANDLES = ["quiet_otter", "brass_wren", "hazel_finch", "tidy_stoat", "amber_vole", "spry_robin"];
function handle() {
  return `${HANDLES[Math.floor(Math.random() * HANDLES.length)]}_${10 + Math.floor(Math.random() * 89)}`;
}
function parseAmount(text: string, given?: number): number | null {
  if (typeof given === "number" && given > 0) return Math.round(given);
  const m = (text || "").match(/\$?\s?(\d{1,6})(?:\.\d+)?/);
  return m ? Math.round(Number(m[1])) : null;
}

// PUBLIC — a stranger makes the squirrel an offer. No account needed. Feeds Gate 2.
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = (await req.json().catch(() => ({}))) as { itemId: string; buyer?: string; text?: string; amount?: number };
  if (!body.itemId) return NextResponse.json({ error: "no item" }, { status: 400 });
  const item = await getItem(slug, body.itemId);
  if (!item) return NextResponse.json({ error: "no item" }, { status: 404 });
  if (item.status !== "listed") return NextResponse.json({ error: "not for sale" }, { status: 409 });

  const buyer = (body.buyer || handle()).replace(/[^\w-]/g, "").slice(0, 24) || handle();
  const text = (body.text || "").trim() || "Still available?";
  const amount = parseAmount(text, body.amount);

  const threads = await getThreads(slug);
  let thread = threads.find((t) => t.itemId === body.itemId && t.buyer === buyer && t.status !== "closed");
  if (!thread) {
    thread = {
      id: id("th"), itemId: body.itemId, shopSlug: slug, buyer,
      status: "open", messages: [], rounds: 0, createdAt: Date.now(),
    } as Thread;
  }
  thread.status = "open";
  thread.messages.push({ role: "buyer", text, ts: Date.now(), amount });
  await upsertThread(thread);
  await appendLedger(slug, { ts: Date.now(), actor: "buyer", action: "offered", item: item.title, itemId: item.id, amount: amount ?? null, kind: "message", meta: { buyer } });

  return NextResponse.json({ threadId: thread.id, buyer });
}
