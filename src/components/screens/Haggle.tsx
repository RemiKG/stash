"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Mascot from "@/components/art/Mascot";
import Plate from "@/components/art/Plate";
import SplitFlap from "@/components/art/SplitFlap";
import { post } from "@/lib/api";
import { money } from "@/lib/utils";
import { C } from "@/lib/art/kit";
import type { Item, Thread } from "@/lib/types";

type Deal = { thread: Thread; item: Item };
type Draft = { text: string; move: "counter" | "accept" | "decline"; amount: number | null };

export default function Haggle({ slug, deals }: { slug: string; deals: Deal[] }) {
  const router = useRouter();
  const [i, setI] = useState(0);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [meta, setMeta] = useState<{ lastOffer: number | null; reserve: number; ask: number; winRate: number }>({ lastOffer: null, reserve: 0, ask: 0, winRate: 0 });
  const [busy, setBusy] = useState(false);
  const [aiDraftless, setAiDraftless] = useState(false);
  const [manual, setManual] = useState<number>(0);
  const ranFor = useRef<string>("");

  const deal = deals[i];

  useEffect(() => {
    if (!deal || ranFor.current === deal.thread.id) return;
    ranFor.current = deal.thread.id;
    setDraft(null); setAiDraftless(false);
    (async () => {
      try {
        const r = await post<{ draft: Draft; lastOffer: number | null; reserve: number; ask: number; winRate: number }>(`/api/threads/${deal.thread.id}/draft`, { slug });
        setDraft(r.draft);
        setMeta({ lastOffer: r.lastOffer, reserve: r.reserve, ask: r.ask, winRate: r.winRate });
        setManual(r.draft.amount ?? r.reserve);
      } catch (e) {
        const err = e as { status?: number };
        const lastOffer = [...deal.thread.messages].reverse().find((m) => m.role === "buyer" && m.amount != null)?.amount ?? null;
        setMeta({ lastOffer, reserve: deal.item.reserve ?? 0, ask: deal.item.price ?? 0, winRate: 0 });
        setManual(deal.item.reserve ?? 0);
        if (err.status === 503) setAiDraftless(true);
      }
    })();
  }, [deal, slug]);

  if (!deal) {
    return (
      <div className="screen">
        <p className="slabel">The haggle</p>
        <div className="card" style={{ padding: 20, textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center" }}><Mascot pose="idle" /></div>
          <style>{`.card svg{width:118px;height:auto}`}</style>
          <p style={{ fontFamily: "var(--book)", fontSize: 16 }}>No one&rsquo;s at the counter. When a buyer messages your shop, I&rsquo;ll bring it here.</p>
        </div>
        <Link className="btn btn-wax" href="/">Back home</Link>
      </div>
    );
  }

  const { item, thread } = deal;
  const counterAmt = draft?.move === "counter" ? draft.amount ?? manual : manual;

  async function move(kind: "counter" | "accept" | "decline") {
    if (busy) return;
    setBusy(true);
    try {
      const amount = kind === "counter" ? counterAmt : kind === "accept" ? meta.lastOffer ?? undefined : undefined;
      await post(`/api/threads/${thread.id}/move`, { slug, move: kind, amount });
      if (kind === "accept") { router.push("/fulfill"); return; }
      // counter / decline -> advance to next open deal or go home
      if (i + 1 < deals.length) { setI(i + 1); ranFor.current = ""; setBusy(false); }
      else router.push("/");
    } catch { setBusy(false); }
  }

  // reserve rail geometry
  const min = Math.max(0, meta.reserve * 0.7);
  const max = Math.max(meta.ask * 1.1, meta.reserve + 1, counterAmt + 1);
  const pos = (v: number) => `${Math.max(0, Math.min(1, (v - min) / (max - min))) * 100}%`;

  return (
    <div className="screen">
      <p className="slabel">The haggle</p>

      <div className="card" style={{ padding: 12 }}>
        <div className="row" style={{ gap: 12, alignItems: "center" }}>
          <Plate src={item.plateSrc} objName={item.plateSrc ? undefined : item.title} caption={undefined} style={{ width: 52, height: 52 }} />
          <div className="grow">
            <div style={{ fontFamily: "var(--book)", fontWeight: 700, fontSize: 15 }}>{item.title}</div>
            <div className="mono muted" style={{ fontSize: 12.5 }}>listed {money(item.price)}</div>
          </div>
          <div className="col" style={{ alignItems: "flex-end" }}>
            <span className="muted" style={{ fontSize: 11 }}>reserve</span>
            <SplitFlap value={money(item.reserve)} h={28} />
          </div>
        </div>
      </div>

      <div className="thread">
        {thread.messages.map((m, k) => (
          <div key={k} className={`bubble ${m.role === "buyer" ? "buyer" : "qm"}`}>
            {m.text}
            <svg className="tail" viewBox="0 0 16 12" aria-hidden>
              {m.role === "buyer"
                ? <path d="M2 0 L2 12 L16 4 Z" fill={C.paperDeep} stroke={C.ink} strokeWidth="1.6" />
                : <path d="M14 0 L14 12 L0 4 Z" fill={C.paperHi} stroke={C.ink} strokeWidth="1.6" />}
            </svg>
          </div>
        ))}
      </div>

      {draft ? (
        <div className="card" style={{ padding: 16 }}>
          <div className="row between" style={{ alignItems: "center" }}>
            <p className="slabel" style={{ margin: 0 }}>
              {draft.move === "counter" ? "I'd counter at" : draft.move === "accept" ? "I'd take" : "I'd hold"}
            </p>
            {draft.amount != null && <SplitFlap value={money(draft.amount)} h={38} invert />}
          </div>
          <p className="muted" style={{ fontSize: 12.5, margin: "10px 0 0", fontStyle: "italic" }}>&ldquo;{draft.text}&rdquo;</p>
        </div>
      ) : aiDraftless ? (
        <div className="card" style={{ padding: 16 }}>
          <p className="muted" style={{ fontSize: 13, margin: 0 }}>
            The drafting brain needs a Qwen key — but you can still gate the move. The reserve floor is enforced either way.
          </p>
          <div className="row" style={{ gap: 10, marginTop: 10, alignItems: "center" }}>
            <span className="muted" style={{ fontSize: 13 }}>Counter at</span>
            <input type="number" value={manual} onChange={(e) => setManual(+e.target.value)}
              style={{ width: 110, fontFamily: "var(--mono)", fontWeight: 700, fontSize: 18, background: C.ink, color: C.paper, border: `2px solid ${C.ink}`, borderRadius: 4, padding: "4px 8px" }} />
          </div>
        </div>
      ) : (
        <p className="hand faint" style={{ fontSize: 14 }}>drafting a reply…</p>
      )}

      <div>
        <p className="slabel">Never below your floor</p>
        <div style={{ position: "relative", height: 34, marginTop: 8 }}>
          <div className="slider" style={{ width: "100%" }}>
            <div className="track" />
            <div className="fill" style={{ width: pos(meta.reserve) }} />
            <div className="knob" style={{ left: pos(counterAmt) }} />
          </div>
          <div style={{ position: "absolute", left: pos(meta.reserve), top: -8, transform: "translateX(-50%)", textAlign: "center" }}>
            <div className="mono muted" style={{ fontSize: 10 }}>{money(meta.reserve)} floor</div>
            <svg width="16" height="20" viewBox="0 0 16 20"><path d="M8 20 L8 6 M2 6 L14 6 L8 -2 Z" fill={C.ink} stroke={C.ink} /></svg>
          </div>
          <span className="mono" style={{ position: "absolute", right: 0, top: 6, fontWeight: 700 }}>{money(counterAmt)}</span>
        </div>
      </div>

      <button className="btn btn-wax" disabled={busy} onClick={() => move("counter")}>Counter {money(counterAmt)}</button>
      <div className="row" style={{ gap: 12 }}>
        <button className="btn btn-ghost grow" disabled={busy || meta.lastOffer == null} onClick={() => move("accept")}>Accept {money(meta.lastOffer)}</button>
        <button className="btn btn-ghost grow" disabled={busy} onClick={() => move("decline")}>Decline</button>
      </div>
      {meta.winRate > 0 && (
        <p className="muted" style={{ fontSize: 12.5, margin: 0 }}>win-rate vs. just-say-yes: <span className="mono" style={{ fontWeight: 700, color: C.ink }}>+{meta.winRate}%</span></p>
      )}
      {deals.length > 1 && <p className="faint" style={{ fontSize: 12, textAlign: "center", margin: 0 }}>{deals.length - i - 1} more at the counter</p>}
    </div>
  );
}
