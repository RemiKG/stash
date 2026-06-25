"use client";
import { useState } from "react";
import { Share } from "@/components/art/Icons";
import { post } from "@/lib/api";
import { money } from "@/lib/utils";
import type { Item } from "@/lib/types";

function pack(item: Item, platform: string): string {
  const price = money(item.price);
  const specs = Object.entries(item.itemSpecifics || {}).map(([k, v]) => `${k}: ${v}`).join("\n");
  return `${item.title} — ${price}\n\n${item.description || ""}\n\n${specs}\n\n(${platform} pack — formatted by Stash, paste it in yourself)`.trim();
}

export default function ShopOwnerTools({ slug, item }: { slug: string; item: Item | null }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");

  async function share() {
    const url = `${location.origin}/s/${slug}`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((navigator as any).share) { try { await (navigator as any).share({ title: "My Stash shop", url }); return; } catch { /* fall through */ } }
    await navigator.clipboard?.writeText(url);
    setNote("Link copied.");
    setTimeout(() => setNote(""), 1800);
  }
  async function copyPack(platform: string) {
    if (!item) return;
    await navigator.clipboard?.writeText(pack(item, platform));
    setNote(`${platform} pack copied — paste it in yourself.`);
    setOpen(false);
    setTimeout(() => setNote(""), 2600);
  }
  async function ebay() {
    if (!item) return;
    try {
      const r = await post<{ listingId: string }>(`/api/items/${item.id}/publish-ebay`, { slug });
      setNote(`Live on eBay — listing ${r.listingId}.`);
    } catch (e) {
      const err = e as { status?: number; message?: string };
      setNote(err.status === 409 ? "Connect your eBay seller account first (Standing Orders → eBay)." : `eBay: ${err.message}`);
    }
    setOpen(false);
    setTimeout(() => setNote(""), 4000);
  }

  return (
    <div className="row" style={{ gap: 10, alignItems: "center", position: "relative" }}>
      <button className="btn btn-amber" onClick={share}><Share size={16} /> Share</button>
      {item && (
        <div style={{ position: "relative" }}>
          <button className="btn-ghost" style={{ minHeight: 32 }} onClick={() => setOpen((o) => !o)}>Export ▾</button>
          {open && (
            <div className="card" style={{ position: "absolute", right: 0, top: 40, zIndex: 20, padding: 8, minWidth: 210 }}>
              <button className="btn-ghost" style={{ width: "100%", justifyContent: "flex-start", marginBottom: 6, minHeight: 36 }} onClick={ebay}>Publish to eBay</button>
              {["Depop", "Facebook", "Vinted"].map((p) => (
                <button key={p} className="btn-ghost" style={{ width: "100%", justifyContent: "flex-start", marginBottom: 6, minHeight: 36 }} onClick={() => copyPack(p)}>Copy {p} pack</button>
              ))}
            </div>
          )}
        </div>
      )}
      {note && <span className="mono muted" style={{ fontSize: 12 }}>{note}</span>}
    </div>
  );
}
