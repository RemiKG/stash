import { NextResponse } from "next/server";
import { getSettings, saveSettings } from "@/lib/store";
import { DEFAULT_SETTINGS, type Settings } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return NextResponse.json({ settings: await getSettings(slug) });
}

export async function PUT(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const patch = (await req.json().catch(() => ({}))) as Partial<Settings>;
  const current = await getSettings(slug);
  const merged: Settings = { ...DEFAULT_SETTINGS, ...current, ...patch, neverBelowReserve: true };
  // clamp the ranges the floor depends on
  merged.reserveFloorPct = Math.max(0.6, Math.min(1, merged.reserveFloorPct));
  merged.maxRounds = Math.max(1, Math.min(6, Math.round(merged.maxRounds)));
  await saveSettings(slug, merged);
  return NextResponse.json({ settings: merged });
}
