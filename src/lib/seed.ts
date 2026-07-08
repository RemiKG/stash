// seed.ts — the pre-seeded DEMO shop. Clearly labelled, always separate from real
// shops. Its numbers are illustrative (a curated pile) but its totals are REAL —
// "$ found" is the genuine sum of its sold items. The real path (upload your own
// photos -> your own live shop) works without any of this.
import { DEFAULT_SETTINGS, type Item, type Thread, type LedgerEntry } from "./types";
import { appendLedger, deleteShop, saveSettings, saveShop, shopExists, upsertItem, upsertThread } from "./store";

export const DEMO_SLUG = "demo-drawer";

type Seed = {
  id: string; title: string; category: string; obj: string; price: number;
  grade: string; note: string; defects: string[]; conf: number; low: number; high: number; why: string;
  reserve: number; sold?: number;
};

const LISTED: Seed[] = [
  { id: "cam", title: "Canon AE-1 · 35mm film SLR", category: "Film cameras", obj: "camera", price: 95, grade: "Good", note: "light brassing on top plate", defects: ["one small dent, base plate", "meter responds"], conf: 92, low: 88, high: 102, why: "Working meter, common body; clean glass lifts it.", reserve: 80 },
  { id: "watch", title: "Seiko 5 automatic watch", category: "Watches", obj: "watch", price: 140, grade: "Very good", note: "runs strong, light bracelet wear", defects: ["hairlines on caseback"], conf: 90, low: 120, high: 165, why: "In-house automatic, box-less but honest.", reserve: 119 },
  { id: "sneaker", title: "Adidas Samba OG trainers", category: "Sneakers", obj: "sneaker", price: 60, grade: "Good", note: "worn, plenty of life left", defects: ["sole creasing"], conf: 88, low: 45, high: 75, why: "Evergreen model; size-dependent.", reserve: 45 },
  { id: "lamp", title: "Anglepoise 1227 desk lamp", category: "Lighting", obj: "lamp", price: 45, grade: "Good", note: "sprung arm holds", defects: ["paint chips to base"], conf: 84, low: 35, high: 60, why: "Design classic; cord is original.", reserve: 34 },
  { id: "jacket", title: "Harris Tweed jacket", category: "Menswear", obj: "jacket", price: 75, grade: "Very good", note: "clean, no moth", defects: [], conf: 86, low: 60, high: 95, why: "Authentic orb label; timeless cut.", reserve: 60 },
  { id: "vase", title: "Studio pottery vase", category: "Ceramics", obj: "vase", price: 32, grade: "Good", note: "signed to base", defects: ["glaze pop, rim"], conf: 72, low: 22, high: 45, why: "Unattributed studio piece; charming.", reserve: 22 },
  { id: "books", title: "Penguin clothbound books (set of 6)", category: "Books", obj: "books", price: 28, grade: "Very good", note: "bright boards", defects: [], conf: 80, low: 20, high: 38, why: "Coralie Bickford-Smith set; decorative.", reserve: 20 },
  { id: "console", title: "Super Nintendo + 2 controllers", category: "Retro games", obj: "console", price: 90, grade: "Good", note: "tested, powers on", defects: ["yellowing to shell"], conf: 83, low: 70, high: 120, why: "Complete-ish; games extra.", reserve: 70 },
];

const SOLD: Seed[] = [
  { id: "chair", title: "Eames-style lounge chair", category: "Furniture", obj: "chair", price: 520, grade: "Good", note: "reupholstered", defects: [], conf: 78, low: 420, high: 620, why: "Replica but comfortable and clean.", reserve: 420, sold: 520 },
  { id: "bag", title: "Leather weekender bag", category: "Bags", obj: "bag", price: 180, grade: "Very good", note: "full-grain, patina", defects: [], conf: 82, low: 140, high: 220, why: "Solid hardware; ages well.", reserve: 140, sold: 180 },
  { id: "lens", title: "Nikon 50mm f/1.4 lens", category: "Camera lenses", obj: "camera", price: 340, grade: "Very good", note: "clear glass", defects: ["slight focus ring wear"], conf: 89, low: 280, high: 380, why: "Fast prime, no fungus; sought-after.", reserve: 280, sold: 340 },
  { id: "lamp2", title: "Vintage brass desk lamp", category: "Lighting", obj: "lamp", price: 150, grade: "Good", note: "rewired", defects: ["patina"], conf: 76, low: 110, high: 190, why: "Heavy brass; safely rewired.", reserve: 110, sold: 150 },
  { id: "barbour", title: "Barbour wax jacket", category: "Menswear", obj: "jacket", price: 420, grade: "Very good", note: "freshly re-waxed", defects: [], conf: 85, low: 340, high: 480, why: "Re-waxed, tartan lining intact.", reserve: 340, sold: 420 },
  { id: "speaker", title: "Marshall Stanmore speaker", category: "Audio", obj: "box", price: 800, grade: "Very good", note: "boxed", defects: [], conf: 80, low: 640, high: 900, why: "Boxed with cable; loud and clean.", reserve: 640, sold: 800 },
]; // sold sum = 520+180+340+150+420+800 = 2410

function mk(s: Seed, status: Item["status"], t: number): Item {
  return {
    id: `demo-${s.id}`, shopSlug: DEMO_SLUG, status, createdAt: t,
    title: s.title, category: s.category, conditionGrade: s.grade, conditionNote: s.note,
    defects: s.defects, confidence: s.conf, comps: [], priceLow: s.low, priceHigh: s.high, why: s.why,
    price: s.price, reserve: s.reserve,
    description: `${s.title}. Condition: ${s.grade}${s.note ? " — " + s.note : ""}. ${s.why}`,
    itemSpecifics: { Category: s.category, Condition: s.grade },
    listedAt: t, soldAt: status === "sold" ? t + 3600_000 : undefined, soldPrice: s.sold,
    buyer: status === "sold" ? "quiet_otter_42" : undefined,
  };
}

export async function ensureDemo(): Promise<string> {
  if (await shopExists(DEMO_SLUG)) return DEMO_SLUG;
  return buildDemo();
}

export async function buildDemo(): Promise<string> {
  await deleteShop(DEMO_SLUG);
  const now = Date.now();
  await saveShop({ slug: DEMO_SLUG, name: "The Demo Drawer", blurb: "one real closet, opened.", createdAt: now, isDemo: true, claimed: false });
  await saveSettings(DEMO_SLUG, { ...DEFAULT_SETTINGS });

  let t = now - 14 * 3600_000;
  for (const s of SOLD) { await upsertItem(mk(s, "sold", t)); t += 900_000; }
  for (const s of LISTED) { await upsertItem(mk(s, "listed", t)); t += 900_000; }

  // Canon gets comps + a live buyer offer waiting at the counter (Screen F canon).
  await upsertItem({ ...mk(LISTED[0], "listed", now - 3600_000), comps: [
    { title: "Canon AE-1 body, working", price: 88, source: "eBay active" },
    { title: "Canon AE-1 w/ 50mm", price: 95, source: "eBay active" },
    { title: "Canon AE-1 Program, mint", price: 110, source: "eBay active" },
    { title: "Canon AE-1 as-is", price: 79, source: "eBay active" },
  ] });

  const thread: Thread = {
    id: "demo-th-canon", itemId: "demo-cam", shopSlug: DEMO_SLUG, buyer: "quiet_otter_42",
    status: "open", rounds: 0, createdAt: now - 1800_000,
    messages: [{ role: "buyer", text: "Still available? Take $70?", ts: now - 1800_000, amount: 70 }],
    draft: null,
  };
  await upsertThread(thread);

  // a curated, honest daybook (append-only)
  const L: LedgerEntry[] = [
    { ts: now - 13.9 * 3600_000, actor: "squirrel", action: "identified", item: "92% sure", itemId: "demo-cam", amount: null, kind: "id" },
    { ts: now - 13.8 * 3600_000, actor: "squirrel", action: "appraised", item: "band $88–102", itemId: "demo-cam", amount: null, kind: "price" },
    { ts: now - 13.7 * 3600_000, actor: "squirrel", action: "composed", item: "Canon AE-1", itemId: "demo-cam", amount: null, kind: "other" },
    { ts: now - 13.6 * 3600_000, actor: "you", action: "approved · list", item: "Canon AE-1", itemId: "demo-cam", amount: 95, kind: "sale" },
    ...SOLD.map((s, i): LedgerEntry => ({ ts: now - (10 - i) * 3600_000, actor: "you", action: "approved · list", item: s.title, itemId: `demo-${s.id}`, amount: s.price, kind: "sale" })),
    ...SOLD.map((s, i): LedgerEntry => ({ ts: now - (6 - i * 0.5) * 3600_000, actor: "squirrel", action: "sold", item: s.title, itemId: `demo-${s.id}`, amount: s.sold ?? s.price, kind: "sale" })),
    { ts: now - 1800_000, actor: "buyer", action: "offered", item: "Canon AE-1", itemId: "demo-cam", amount: 70, kind: "message", meta: { buyer: "quiet_otter_42" } },
  ];
  L.sort((a, b) => a.ts - b.ts);
  for (const e of L) await appendLedger(DEMO_SLUG, e);

  return DEMO_SLUG;
}
