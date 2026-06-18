import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { deleteShop } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await deleteShop(slug);
  const c = await cookies();
  if (c.get("stash_shop")?.value === slug) c.delete("stash_shop");
  return NextResponse.json({ ok: true });
}
