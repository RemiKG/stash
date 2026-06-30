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
