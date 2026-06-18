import { NextResponse } from "next/server";
import { readLedger, readLedgerRaw } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The append-only daybook. ?format=ndjson downloads the raw immutable record.
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const url = new URL(req.url);
  if (url.searchParams.get("format") === "ndjson") {
    const raw = await readLedgerRaw(slug);
    return new Response(raw, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Content-Disposition": `attachment; filename="stash-${slug}-daybook.ndjson"`,
      },
    });
  }
  return NextResponse.json({ entries: await readLedger(slug) });
}
