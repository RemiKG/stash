import { NextResponse } from "next/server";
import { getItem, getSettings, patchItem, appendLedger, readBlob } from "@/lib/store";
import { bufferToDataUrl } from "@/lib/image";
import { identifyItems } from "@/lib/ai/engine";
import { AIUnavailable } from "@/lib/ai/client";
import { classifyProhibited } from "@/lib/policy";
import { currentSlug } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function blobId(src?: string) {
  return src ? src.split("/").pop()! : "";
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { slug?: string; answer?: string };
  const slug = body.slug || (await currentSlug());
  if (!slug) return NextResponse.json({ error: "no shop" }, { status: 400 });
  const item = await getItem(slug, id);
  if (!item) return NextResponse.json({ error: "no item" }, { status: 404 });

  const blob = await readBlob(blobId(item.photoSrc));
  if (!blob) return NextResponse.json({ error: "no photo" }, { status: 400 });
  const dataUrl = bufferToDataUrl(blob.buf, blob.mime);

  try {
    const results = await identifyItems([dataUrl]);
    const top = results[0];
    if (!top) {
      const patched = await patchItem(slug, id, {
        title: "Couldn't spot a sellable item",
        status: "set_aside",
        prohibited: true,
        prohibitedReason: "I couldn't make out a clear item — try a closer, brighter photo",
        confidence: 0,
      });
      await appendLedger(slug, { ts: Date.now(), actor: "squirrel", action: "set aside", item: "unclear photo", itemId: id, amount: null, kind: "other" });
      return NextResponse.json({ item: patched });
    }

    const settings = await getSettings(slug);
    const haystack = [top.title, top.category, top.condition_note, (top.defects || []).join(" "), top.flag_reason].filter(Boolean).join(" ");
    const rule = classifyProhibited(haystack, settings.prohibitedExtra);
    const prohibited = !!top.flag || rule.blocked;
    const reason = rule.reason || top.flag_reason || "restricted";

    const patched = await patchItem(slug, id, {
      title: top.title || "Unidentified item",
      category: top.category,
      conditionGrade: top.condition_grade,
      conditionNote: top.condition_note,
      defects: top.defects || [],
      confidence: Math.max(0, Math.min(100, Math.round(top.confidence ?? 0))),
      question: settings.askWhenUnsure ? top.question ?? null : null,
      status: prohibited ? "set_aside" : "identifying",
      prohibited,
      prohibitedReason: prohibited ? reason : undefined,
    });

    if (prohibited) {
      await appendLedger(slug, { ts: Date.now(), actor: "squirrel", action: "set aside", item: top.title || "item", itemId: id, amount: null, kind: "other", meta: { reason } });
    } else {
      await appendLedger(slug, { ts: Date.now(), actor: "squirrel", action: "identified", item: `${Math.round(top.confidence ?? 0)}% sure`, itemId: id, amount: null, kind: "id" });
    }
    return NextResponse.json({ item: patched });
  } catch (e) {
    if (e instanceof AIUnavailable) return NextResponse.json({ error: "ai_unavailable", message: e.message }, { status: 503 });
    return NextResponse.json({ error: "identify_failed", message: String((e as Error).message) }, { status: 500 });
  }
}
