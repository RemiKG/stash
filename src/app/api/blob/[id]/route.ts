import { readBlob } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await readBlob(id);
  if (!b) return new Response("not found", { status: 404 });
  return new Response(new Uint8Array(b.buf), {
    headers: { "Content-Type": b.mime, "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
