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
  const [err, setErr] = useState<string>("");
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
    setErr("");
    try {
      const res = await post<{ shopUrl: string }>(`/api/items/${cur.id}/gate`, { slug, action: "list", price, reserve });
      const url = res.shopUrl?.replace(/^https?:\/\//, "") || `stash.shop/${slug}`;
      setToast(url);
    } catch (e) {
      setErr((e as Error).message || "Couldn't list it — try again.");
    } finally { setBusy(false); }
  }
  async function decline() {
    if (busy || !cur) return;
    setBusy(true);
    setErr("");
    try { await post(`/api/items/${cur.id}/gate`, { slug, action: "decline" }); next(); }
    catch (e) { setErr((e as Error).message || "Couldn't set it aside — try again."); }
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
    <div className="screen">
      <p className="slabel">Your nod</p>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: -4 }}>
        <div style={{ width: 118 }}><Mascot pose="counter" title="the Quartermaster at the counter" /></div>
        <div style={{ marginTop: -16 }}><Plate src={cur.plateSrc} objName={cur.plateSrc ? undefined : cur.title} caption={undefined} style={{ width: 78, height: 88 }} /></div>
        <div style={{ height: 10, background: C.paperDeep, border: `1.4px solid ${C.ink}`, borderRadius: 2, alignSelf: "stretch", margin: "6px 0 0" }} />
      </div>

      <div className="card" style={{ padding: 18 }}>
        <div className="row between" style={{ alignItems: "flex-start" }}>
          <h3 style={{ fontFamily: "var(--slab)", fontWeight: 800, fontSize: 18, margin: 0, maxWidth: "76%" }}>{cur.title}</h3>
          <span className="mono" style={{ fontWeight: 700, fontSize: 12.5 }}>{cur.confidence}% sure</span>
        </div>
        {cur.conditionGrade && (
          <div style={{ marginTop: 8 }}>
            <span className="chip">{cur.conditionGrade}</span>
            {cur.conditionNote && <p className="muted" style={{ fontSize: 12.5, margin: "8px 0 0" }}>{cur.conditionNote}</p>}
          </div>
        )}
        <hr className="hr" style={{ margin: "14px 0" }} />

        <div className="row between" style={{ alignItems: "center" }}>
          <span className="muted" style={{ fontSize: 14 }}>List at</span>
          {editing ? (
            <input type="number" value={price} onChange={(e) => setPrice(+e.target.value)}
              style={{ width: 120, fontFamily: "var(--mono)", fontSize: 22, fontWeight: 700, background: C.ink, color: C.paper, border: `2px solid ${C.ink}`, borderRadius: 4, padding: "4px 8px" }} />
          ) : (
            <span className="tap" onClick={() => setEditing(true)}><SplitFlap value={money(price)} h={44} invert /></span>
          )}
          {!editing && <span className="hand faint" style={{ fontSize: 12 }}>tap to adjust</span>}
        </div>

        <div className="row between" style={{ alignItems: "center", marginTop: 14 }}>
          <span className="muted" style={{ fontSize: 14 }}>Reserve</span>
          {editing ? (
            <input type="number" value={reserve} onChange={(e) => setReserve(+e.target.value)}
              style={{ width: 110, fontFamily: "var(--mono)", fontSize: 20, fontWeight: 700, background: C.paperHi, color: C.ink, border: `2px solid ${C.ink}`, borderRadius: 4, padding: "4px 8px", borderBottom: `3px solid ${C.amber}` }} />
          ) : (
            <span style={{ borderBottom: `3px solid ${C.amber}`, paddingBottom: 3 }}><SplitFlap value={money(reserve)} h={40} /></span>
          )}
          <span style={{ width: 60 }} />
        </div>
        <p className="muted" style={{ fontSize: 12.5, margin: "12px 0 0", fontStyle: "italic" }}>&ldquo;I&rsquo;ll never sell below this without asking you.&rdquo;</p>
        {cur.why && <p className="faint" style={{ fontSize: 12, margin: "6px 0 0" }}>why: {cur.why}</p>}
        {aboveBand && <p className="muted" style={{ fontSize: 12.5, margin: "6px 0 0" }}><span style={{ borderBottom: `2px solid ${C.amber}` }}>That&rsquo;s above what buyers are paying — happy to try.</span></p>}
        {editing && <button className="btn-ghost" style={{ marginTop: 12 }} onClick={saveEdit}>Save</button>}
      </div>

      {toast ? (
        <div className="card" style={{ padding: 14 }}>
          <p style={{ fontFamily: "var(--book)", fontWeight: 700, margin: 0 }}>On the shelf →</p>
          <div className="row between" style={{ marginTop: 6 }}>
            <span className="mono" style={{ fontSize: 14 }}>{toast}</span>
            <button className="btn-ghost" style={{ minHeight: 34 }} onClick={() => { navigator.clipboard?.writeText(`${location.origin}/s/${slug}`); setCopied(true); }}>
              <Copy size={16} /> {copied ? "copied" : "Copy link"}
            </button>
          </div>
          <button className="btn btn-wax sm" style={{ marginTop: 12 }} onClick={next}>{i + 1 < queue.length ? `Next — ${queue.length - i - 1} more →` : "See your shop →"}</button>
        </div>
      ) : (
        <>
          <button className="btn btn-wax" disabled={busy} onClick={list}><Check size={22} /> List it</button>
          {err && <p style={{ fontSize: 13, textAlign: "center", margin: 0 }}><span style={{ borderBottom: `2px solid ${C.amber}` }}>{err}</span></p>}
          <div className="row" style={{ gap: 12 }}>
            <button className="btn btn-ghost grow" onClick={() => setEditing((e) => !e)}><Pencil size={18} /> Edit</button>
            <button className="btn btn-ghost grow" disabled={busy} onClick={decline}><Cross size={18} /> Not this</button>
          </div>
          {queue.length > 1 && <p className="faint" style={{ fontSize: 12, textAlign: "center", margin: 0 }}>{queue.length - i - 1} more waiting</p>}
        </>
      )}
    </div>
  );
}
