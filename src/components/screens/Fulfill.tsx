"use client";
import { useState } from "react";
import Link from "next/link";
import Plate from "@/components/art/Plate";
import Mascot from "@/components/art/Mascot";
import SplitFlap from "@/components/art/SplitFlap";
import { Tag, Bell } from "@/components/art/Icons";
import { post } from "@/lib/api";
import { money } from "@/lib/utils";
import { C } from "@/lib/art/kit";
import type { Item, Thread } from "@/lib/types";

export default function Fulfill({ slug, item, thread, foundBefore }: { slug: string; item: Item | null; thread: Thread | null; foundBefore: number }) {
  const [done, setDone] = useState(false);
  const [found, setFound] = useState(foundBefore);
  const [busy, setBusy] = useState(false);
  const agreed = thread?.agreedPrice ?? item?.price ?? 0;

  async function fulfill(method: "label" | "pickup") {
    if (busy || !item) return;
    setBusy(true);
    try {
      const r = await post<{ totals: { found: number } }>(`/api/items/${item.id}/fulfill`, { slug, method, threadId: thread?.id });
      setFound(r.totals.found);
      setDone(true);
    } finally { setBusy(false); }
  }

  if (!item) {
    return (
      <div className="screen">
        <p className="slabel">Wrapping up</p>
        <div className="card" style={{ padding: 20, textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center" }}><Mascot pose="idle" /></div>
          <style>{`.card svg{width:118px;height:auto}`}</style>
          <p style={{ fontFamily: "var(--book)", fontSize: 16 }}>Nothing to wrap yet. Agree a deal at the counter and I&rsquo;ll box it up.</p>
        </div>
        <Link className="btn btn-wax" href="/haggle">To the counter →</Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="screen">
        <p className="slabel">And it&rsquo;s gone</p>
        <div className="row" style={{ gap: 18, alignItems: "center" }}>
          <Plate src={item.plateSrc} objName={item.plateSrc ? undefined : item.title} caption={item.title.split(" ").slice(0, 2).join(" ")} price={money(agreed)} sold soldR={40} style={{ width: 150, height: 168 }} />
          <div className="col" style={{ gap: 4 }}>
            <span className="muted" style={{ fontSize: 13 }}>$ found</span>
            <SplitFlap value={money(found)} h={34} />
            <span className="mono muted" style={{ fontSize: 12.5, marginTop: 2 }}>up {money(agreed)}</span>
            <h3 style={{ fontFamily: "var(--book)", fontWeight: 700, fontSize: 17, margin: "12px 0 0", lineHeight: 1.25 }}>&ldquo;Wrapped and gone.<br />Nice one.&rdquo;</h3>
          </div>
        </div>
        <Link className="btn btn-wax" href={`/s/${slug}`}>See your shop →</Link>
        <Link className="btn btn-ghost" href="/">Back home</Link>
      </div>
    );
  }

  return (
    <div className="screen">
      <p className="slabel">Wrapping up</p>
      <div className="card" style={{ padding: 18 }}>
        <div className="row between" style={{ alignItems: "center" }}>
          <div className="row" style={{ gap: 14, alignItems: "center" }}>
            <span className="muted" style={{ fontSize: 16 }}>Deal at</span>
            <SplitFlap value={money(agreed)} h={46} invert />
          </div>
          <Plate src={item.plateSrc} objName={item.plateSrc ? undefined : item.title} caption={undefined} style={{ width: 62, height: 70 }} />
        </div>
        <p className="muted" style={{ fontSize: 13, margin: "12px 0 0" }}>with {thread?.buyer ?? "your buyer"}</p>
      </div>

      <p className="slabel">How it goes out</p>
      <button className="card" disabled={busy} onClick={() => fulfill("label")} style={{ position: "relative", padding: 0, border: "none", background: "none", textAlign: "left", cursor: "pointer" }}>
        <div style={{ position: "relative", background: C.amber, border: `1.8px solid ${C.ink}`, borderRadius: 12, padding: "14px 18px", display: "flex", gap: 14, alignItems: "center" }}>
          <Tag size={22} />
          <span><div style={{ fontFamily: "var(--slab)", fontWeight: 800, fontSize: 16 }}>Buy the label</div><div style={{ fontSize: 12.5, color: C.overprint }}>prepaid · $8.40 · tracked, pick-up tomorrow</div></span>
        </div>
      </button>
      <button className="btn-ghost" disabled={busy} onClick={() => fulfill("pickup")} style={{ minHeight: 66, justifyContent: "flex-start", gap: 14, padding: "0 18px", width: "100%" }}>
        <Bell size={22} />
        <span style={{ textAlign: "left" }}><div style={{ fontFamily: "var(--slab)", fontWeight: 800, fontSize: 16 }}>Set a pickup</div><div className="muted" style={{ fontSize: 12.5 }}>arrange a time &amp; place with the buyer</div></span>
      </button>
      <p className="faint" style={{ fontSize: 11.5, margin: 0 }}>The SOLD stamp &amp; ledger entry are real; the label purchase is simulated until a carrier API is connected.</p>
    </div>
  );
}
