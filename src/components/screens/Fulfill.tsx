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
