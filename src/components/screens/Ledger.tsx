"use client";
import { useState } from "react";
import { SquirrelGlyph, You, Buyer, Book } from "@/components/art/Icons";
import { money } from "@/lib/utils";
import { C } from "@/lib/art/kit";
import type { Actor, LedgerEntry } from "@/lib/types";

const FILTERS = [
  { k: "all", label: "All" },
  { k: "id", label: "IDs" },
  { k: "price", label: "Prices" },
  { k: "message", label: "Messages" },
  { k: "sale", label: "Sales" },
] as const;

const glyph = (a: Actor) => (a === "squirrel" ? <SquirrelGlyph size={22} /> : a === "you" ? <You size={22} /> : <Buyer size={22} />);
const dayKey = (ts: number) => new Date(ts).toISOString().slice(0, 10);
const dayLabel = (ts: number) =>
  new Date(ts).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long" }).toUpperCase().replace(",", " ·");
const hhmm = (ts: number) => new Date(ts).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });

export default function Ledger({ slug, entries }: { slug: string; entries: LedgerEntry[] }) {
  const [filter, setFilter] = useState<string>("all");
  const shown = filter === "all" ? entries : entries.filter((e) => (e.kind || "other") === filter);

  // group by day (already newest-first)
  const days: { key: string; label: string; total: number; rows: LedgerEntry[] }[] = [];
  for (const e of shown) {
    const k = dayKey(e.ts);
    let d = days.find((x) => x.key === k);
    if (!d) { d = { key: k, label: dayLabel(e.ts), total: 0, rows: [] }; days.push(d); }
    d.rows.push(e);
    if (e.kind === "sale" && e.action.includes("sold")) d.total += e.amount || 0;
  }

  return (
    <div className="screen">
      <h1 style={{ fontFamily: "var(--slab)", fontWeight: 800, fontSize: 27 }}>The Ledger</h1>
      <p className="muted" style={{ margin: "-8px 0 0", fontSize: 13.5 }}>Everything I did, in order. Nothing hidden.</p>

      <div className="row wrap" style={{ gap: 8 }}>
        {FILTERS.map((f) => (
          <button key={f.k} className={`chip tap ${filter === f.k ? "amber" : ""}`} onClick={() => setFilter(f.k)}>{f.label}</button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="hand faint" style={{ fontSize: 15 }}>Blank page. Point at a pile and I&rsquo;ll start writing.</p>
      ) : (
        days.map((d) => (
          <div key={d.key}>
            <div className="ledger-day" style={{ position: "relative" }}>
              <span>{d.label}</span>
              <span className="today">{d.total > 0 ? `${money(d.total)} today` : ""}</span>
              <svg width="16" height="16" viewBox="0 0 16 16" style={{ position: "absolute", right: 0, top: 0 }} aria-hidden>
                <path d="M16 0 L0 0 L16 16 Z" fill={C.paper} stroke={C.ink} strokeWidth="1" />
              </svg>
            </div>
            {d.rows.map((e, i) => (
              <div key={i} className={`ledger-row ${i % 2 === 1 ? "shade" : ""}`}>
                <span className="t">{hhmm(e.ts)}</span>
                <span style={{ display: "inline-flex" }}>{glyph(e.actor)}</span>
                <span className="act">{e.action}{e.item ? <span className="it" style={{ marginLeft: 8 }}>· {e.item}</span> : null}</span>
                <span className="amt">{e.amount != null ? money(e.amount) : "—"}</span>
              </div>
            ))}
          </div>
        ))
      )}

      <p className="faint" style={{ fontSize: 11.5, textAlign: "center", margin: "6px 0 0" }}>rows are inked in, never erased — corrections are new lines.</p>
      <a className="btn btn-wax" href={`/api/ledger/${slug}?format=ndjson`} download>
        <Book size={20} /> Export the daybook
      </a>
    </div>
  );
}
