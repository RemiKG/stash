import { NextResponse } from "next/server";
import { createShop } from "@/lib/store";
import { setCurrent, currentShop } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// start a fresh owner shop (used by "make your own shop")
export async function POST() {
  const shop = await createShop();
  await setCurrent(shop.slug);
  return NextResponse.json({ slug: shop.slug });
}

export async function GET() {
  const shop = await currentShop();
  return NextResponse.json({ shop });
}
