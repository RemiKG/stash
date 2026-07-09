import { NextResponse } from "next/server";
import { getItem, getSettings, patchItem, appendLedger, readBlob } from "@/lib/store";
import { bufferToDataUrl } from "@/lib/image";
import { identifyItems } from "@/lib/ai/engine";
import { AIUnavailable } from "@/lib/ai/client";
import { classifyProhibited } from "@/lib/policy";
import { currentSlug } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

// the ambiguity branch: the owner answers the one targeted question -> re-run ID.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { slug?: string; answer?: string; extraPhoto?: string };
  const slug = body.slug || (await currentSlug());
  if (!slug || !body.answer) return NextResponse.json({ error: "bad request" }, { status: 400 });
  const item = await getItem(slug, id);
  if (!item) return NextResponse.json({ error: "no item" }, { status: 404 });

  const blob = await readBlob((item.photoSrc || "").split("/").pop() || "");
  const images: string[] = [];
  if (blob) images.push(bufferToDataUrl(blob.buf, blob.mime));
  if (body.extraPhoto) images.push(body.extraPhoto);
  if (!images.length) return NextResponse.json({ error: "no photo" }, { status: 400 });

  try {
    const results = await identifyItems(images, body.answer);
    const top = results[0];
    if (!top) return NextResponse.json({ error: "nothing identified" }, { status: 422 });
    const settings = await getSettings(slug);
    const rule = classifyProhibited([top.title, top.category, top.condition_note].filter(Boolean).join(" "), settings.prohibitedExtra);
    const prohibited = !!top.flag || rule.blocked;
    const patched = await patchItem(slug, id, {
      title: top.title,
      category: top.category,
      conditionGrade: top.condition_grade,
      conditionNote: top.condition_note,
      defects: top.defects || [],
      confidence: Math.round(top.confidence ?? 0),
      question: null,
      status: prohibited ? "set_aside" : "identifying",
      prohibited,
      prohibitedReason: prohibited ? rule.reason : undefined,
    });
    await appendLedger(slug, { ts: Date.now(), actor: "you", action: "answered", item: top.title, itemId: id, amount: null, kind: "id" });
    return NextResponse.json({ item: patched });
  } catch (e) {
    if (e instanceof AIUnavailable) return NextResponse.json({ error: "ai_unavailable", message: e.message }, { status: 503 });
    return NextResponse.json({ error: "identify_failed", message: String((e as Error).message) }, { status: 500 });
  }
}
