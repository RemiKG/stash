// store.ts — filesystem persistence (shops, items, threads, settings, the
// append-only NDJSON ledger, and scrubbed photos + generated plates as blobs).
// Rooted at STASH_DATA_DIR (default ./.data). Persists on any host with a disk;
// this is the design's "persists on the deployment".
import { promises as fs } from "node:fs";
import path from "node:path";
import { DEFAULT_SETTINGS, type Item, type Settings, type Shop, type Thread, type LedgerEntry } from "./types";

const ROOT = process.env.STASH_DATA_DIR
  ? path.resolve(process.env.STASH_DATA_DIR)
  : path.join(process.cwd(), ".data");

const shopsDir = () => path.join(ROOT, "shops");
const shopDir = (slug: string) => path.join(shopsDir(), slug);
const blobsDir = () => path.join(ROOT, "blobs");

// ---- tiny per-path async lock to serialise read-modify-write ----
const locks = new Map<string, Promise<unknown>>();
async function withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = locks.get(key) || Promise.resolve();
  let release!: () => void;
  const next = new Promise<void>((r) => (release = r));
  locks.set(key, prev.then(() => next));
  try {
    await prev;
    return await fn();
  } finally {
    release();
    if (locks.get(key) === next) locks.delete(key);
  }
}

async function readJSON<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
async function writeJSON(file: string, data: unknown) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = file + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(data, null, 2));
  await fs.rename(tmp, file);
}

// ---- slugs ----
const ADJ = ["quiet", "amber", "brass", "tidy", "walnut", "clever", "cosy", "spry", "hazel", "dusty", "little", "warm", "prompt", "keen", "snug"];
const ANIM = ["otter", "squirrel", "marten", "sparrow", "badger", "wren", "vole", "finch", "stoat", "dormouse", "robin", "hare", "magpie", "shrew", "swift"];
function pick<T>(a: T[], n: number) { return a[Math.abs(n) % a.length]; }

export async function uniqueSlug(): Promise<string> {
  for (let i = 0; i < 60; i++) {
    const seed = Date.now() + i * 7919 + Math.floor(Math.random() * 100000);
    const slug = `${pick(ADJ, seed)}-${pick(ANIM, Math.floor(seed / 13))}`;
    if (!(await shopExists(slug))) return slug;
    const alt = `${slug}-${(seed % 89) + 2}`;
    if (!(await shopExists(alt))) return alt;
  }
  return `shop-${Date.now().toString(36)}`;
}

export async function shopExists(slug: string): Promise<boolean> {
  try { await fs.access(path.join(shopDir(slug), "shop.json")); return true; } catch { return false; }
}

// ---- shops ----
export async function getShop(slug: string): Promise<Shop | null> {
  return readJSON<Shop | null>(path.join(shopDir(slug), "shop.json"), null);
}
export async function saveShop(shop: Shop) {
  await writeJSON(path.join(shopDir(shop.slug), "shop.json"), shop);
}
export async function createShop(partial: Partial<Shop> = {}): Promise<Shop> {
  const slug = partial.slug || (await uniqueSlug());
  const shop: Shop = {
    slug,
    name: partial.name || "A shop that finally opened.",
    blurb: partial.blurb || "the shop that finally opened.",
    createdAt: Date.now(),
    isDemo: partial.isDemo ?? false,
    claimed: partial.claimed ?? false,
  };
  await saveShop(shop);
  await saveSettings(slug, DEFAULT_SETTINGS);
  return shop;
}
export async function listShops(): Promise<Shop[]> {
  try {
    const dirs = await fs.readdir(shopsDir());
    const shops = await Promise.all(dirs.map((d) => getShop(d)));
    return shops.filter(Boolean) as Shop[];
  } catch {
    return [];
  }
}
export async function deleteShop(slug: string) {
  await fs.rm(shopDir(slug), { recursive: true, force: true });
}

// ---- items ----
const itemsFile = (slug: string) => path.join(shopDir(slug), "items.json");
export async function getItems(slug: string): Promise<Item[]> {
  return readJSON<Item[]>(itemsFile(slug), []);
}
export async function getItem(slug: string, id: string): Promise<Item | null> {
  const items = await getItems(slug);
  return items.find((i) => i.id === id) || null;
}
export async function upsertItem(item: Item): Promise<Item> {
  return withLock(itemsFile(item.shopSlug), async () => {
    const items = await getItems(item.shopSlug);
    const idx = items.findIndex((i) => i.id === item.id);
    if (idx >= 0) items[idx] = item; else items.push(item);
    await writeJSON(itemsFile(item.shopSlug), items);
    return item;
  });
}
export async function patchItem(slug: string, id: string, patch: Partial<Item>): Promise<Item | null> {
  return withLock(itemsFile(slug), async () => {
    const items = await getItems(slug);
    const idx = items.findIndex((i) => i.id === id);
    if (idx < 0) return null;
    items[idx] = { ...items[idx], ...patch };
    await writeJSON(itemsFile(slug), items);
    return items[idx];
  });
}

// ---- threads ----
const threadsFile = (slug: string) => path.join(shopDir(slug), "threads.json");
export async function getThreads(slug: string): Promise<Thread[]> {
  return readJSON<Thread[]>(threadsFile(slug), []);
}
export async function getThread(slug: string, id: string): Promise<Thread | null> {
  return (await getThreads(slug)).find((t) => t.id === id) || null;
}
export async function upsertThread(t: Thread): Promise<Thread> {
  return withLock(threadsFile(t.shopSlug), async () => {
    const list = await getThreads(t.shopSlug);
    const idx = list.findIndex((x) => x.id === t.id);
    if (idx >= 0) list[idx] = t; else list.push(t);
    await writeJSON(threadsFile(t.shopSlug), list);
    return t;
  });
}

// ---- settings ----
const settingsFile = (slug: string) => path.join(shopDir(slug), "settings.json");
export async function getSettings(slug: string): Promise<Settings> {
  const s = await readJSON<Partial<Settings>>(settingsFile(slug), {});
  return { ...DEFAULT_SETTINGS, ...s, neverBelowReserve: true };
}
export async function saveSettings(slug: string, s: Settings) {
  await writeJSON(settingsFile(slug), { ...s, neverBelowReserve: true });
}

// ---- ledger (append-only NDJSON) ----
const ledgerFile = (slug: string) => path.join(shopDir(slug), "ledger.ndjson");
export async function appendLedger(slug: string, entry: LedgerEntry) {
  return withLock(ledgerFile(slug), async () => {
    await fs.mkdir(shopDir(slug), { recursive: true });
    await fs.appendFile(ledgerFile(slug), JSON.stringify(entry) + "\n");
  });
}
export async function readLedger(slug: string): Promise<LedgerEntry[]> {
  try {
    const raw = await fs.readFile(ledgerFile(slug), "utf8");
    return raw.split("\n").filter(Boolean).map((l) => JSON.parse(l) as LedgerEntry);
  } catch {
    return [];
  }
}
export async function readLedgerRaw(slug: string): Promise<string> {
  try { return await fs.readFile(ledgerFile(slug), "utf8"); } catch { return ""; }
}

// ---- blobs (scrubbed photos + generated plates) ----
const extFor = (mime: string) => (mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg");
export async function writeBlob(id: string, buf: Buffer, mime: string): Promise<string> {
  await fs.mkdir(blobsDir(), { recursive: true });
  const file = path.join(blobsDir(), `${id}.${extFor(mime)}`);
  await fs.writeFile(file, buf);
  return `/api/blob/${id}`;
}
export async function readBlob(id: string): Promise<{ buf: Buffer; mime: string } | null> {
  const safe = id.replace(/[^a-zA-Z0-9_-]/g, "");
  for (const ext of ["png", "jpg", "webp"]) {
    try {
      const buf = await fs.readFile(path.join(blobsDir(), `${safe}.${ext}`));
      const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
      return { buf, mime };
    } catch { /* try next */ }
  }
  return null;
}

export function dataRoot() { return ROOT; }
