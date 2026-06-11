import { NextResponse } from "next/server";
import { buildDemo } from "@/lib/seed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// (re)build the labelled Demo shop
export async function POST() {
  const slug = await buildDemo();
  return NextResponse.json({ slug });
}
