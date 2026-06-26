"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Mascot from "@/components/art/Mascot";
import Plate from "@/components/art/Plate";
import SplitFlap from "@/components/art/SplitFlap";
import { Check, Pencil, Cross, Copy } from "@/components/art/Icons";
import { post } from "@/lib/api";
import { money } from "@/lib/utils";
import { C } from "@/lib/art/kit";
import type { Item } from "@/lib/types";

export default function Gate1({ slug, items, listedExists }: { slug: string; items: Item[]; listedExists: boolean }) {
  const router = useRouter();
  const [queue, setQueue] = useState<Item[]>(items);
  const [i, setI] = useState(0);
  const [editing, setEditing] = useState(false);
  const [price, setPrice] = useState<number>(items[0]?.price ?? 0);
  const [reserve, setReserve] = useState<number>(items[0]?.reserve ?? 0);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const cur = queue[i];

  function loadInto(idx: number) {
    const it = queue[idx];
    if (it) { setPrice(it.price ?? 0); setReserve(it.reserve ?? 0); setEditing(false); }
  }
  function next() {
    setToast("");
    if (i + 1 < queue.length) { setI(i + 1); loadInto(i + 1); }
    else router.push(`/s/${slug}`);
  }

  async function list() {
    if (busy || !cur) return;
    setBusy(true);
    try {
      const res = await post<{ shopUrl: string }>(`/api/items/${cur.id}/gate`, { slug, action: "list", price, reserve });
      const url = res.shopUrl?.replace(/^https?:\/\//, "") || `stash.shop/${slug}`;
      setToast(url);
    } finally { setBusy(false); }
  }
  async function decline() {
    if (busy || !cur) return;
    setBusy(true);
    try { await post(`/api/items/${cur.id}/gate`, { slug, action: "decline" }); next(); }
    finally { setBusy(false); }
  }
  async function saveEdit() {
    if (!cur) return;
    await post(`/api/items/${cur.id}/gate`, { slug, action: "edit", price, reserve });
    setEditing(false);
  }

  if (!cur) {
    return (
      <div className="screen">
        <p className="slabel">Your nod</p>
        <div className="card" style={{ padding: 20, textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center" }}><Mascot pose="idle" /></div>
          <style>{`.card svg{width:120px;height:auto}`}</style>
          <p style={{ fontFamily: "var(--book)", fontSize: 16 }}>The counter&rsquo;s quiet. Nothing waiting for a nod.</p>
        </div>
        {listedExists ? <Link className="btn btn-wax" href={`/s/${slug}`}>See your shop →</Link> : <Link className="btn btn-wax" href="/intake">Point at your pile</Link>}
      </div>
    );
  }

  const aboveBand = cur.priceHigh != null && reserve > cur.priceHigh;

  return (
