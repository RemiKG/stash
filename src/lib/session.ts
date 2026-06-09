// session.ts — the owner's "current shop" is a slug in a cookie. No account wall.
import { cookies } from "next/headers";
import { createShop, getShop } from "./store";
import type { Shop } from "./types";

const COOKIE = "stash_shop";

export async function currentSlug(): Promise<string | null> {
  const c = await cookies();
  return c.get(COOKIE)?.value ?? null;
}

export async function currentShop(): Promise<Shop | null> {
  const slug = await currentSlug();
  if (!slug) return null;
  return getShop(slug);
}

export async function ensureShop(): Promise<Shop> {
  const existing = await currentShop();
  if (existing) return existing;
  const shop = await createShop();
  const c = await cookies();
  c.set(COOKIE, shop.slug, { httpOnly: false, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
  return shop;
}

export async function setCurrent(slug: string) {
  const c = await cookies();
  c.set(COOKIE, slug, { httpOnly: false, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
}

export async function isOwner(slug: string): Promise<boolean> {
  return (await currentSlug()) === slug;
}
