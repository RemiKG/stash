import { NextResponse } from "next/server";
import { currentShop, setCurrent } from "@/lib/session";
import { createShop, upsertItem, writeBlob } from "@/lib/store";
import { dataUrlToBuffer, scrubServer } from "@/lib/image";
import { id } from "@/lib/utils";
import type { Item } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Accepts device-scrubbed photos + generated plates, re-scrubs server-side
// (drops any residual EXIF), stores them, and creates one draft item per photo.
export async function POST(req: Request) {
  const body = (await req.json()) as { photos: { scrubbed: string; plate?: string }[] };
  if (!body.photos?.length) return NextResponse.json({ error: "no photos" }, { status: 400 });

  // add to the current OWNER shop; never write into the demo shop
  let shop = await currentShop();
  if (!shop || shop.isDemo) {
    shop = await createShop();
    await setCurrent(shop.slug);
  }

  const items: string[] = [];
  for (const p of body.photos.slice(0, 20)) {
    const itemId = id("it");
    const { buf } = dataUrlToBuffer(p.scrubbed);
    const scrubbed = await scrubServer(buf);
    const photoSrc = await writeBlob(`${itemId}-photo`, scrubbed.buf, scrubbed.mime);
    let plateSrc: string | undefined;
    if (p.plate) {
      const pb = dataUrlToBuffer(p.plate);
      plateSrc = await writeBlob(`${itemId}-plate`, pb.buf, pb.mime);
    }
    const item: Item = {
      id: itemId,
      shopSlug: shop.slug,
      status: "draft",
      createdAt: Date.now(),
      title: "",
      defects: [],
      confidence: 0,
      comps: [],
      photoSrc,
      plateSrc,
    };
    await upsertItem(item);
    items.push(itemId);
  }
  return NextResponse.json({ slug: shop.slug, items });
}
