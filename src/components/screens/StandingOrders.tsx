"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "@/components/art/Icons";
import { post, put } from "@/lib/api";
import { clamp } from "@/lib/utils";

const QWEN_STACK = "qwen3-vl-plus · text-embedding-v4 · qwen3.7-plus · qwen3.7-max";
import { C } from "@/lib/art/kit";
import { DEFAULT_SETTINGS, type Settings } from "@/lib/types";

function Lever({ on, locked, onToggle }: { on: boolean; locked?: boolean; onToggle?: () => void }) {
  return (
    <button className={`lever ${on ? "on" : ""}`} disabled={locked} onClick={onToggle} aria-pressed={on} aria-label="toggle">
      <span className="knob" />
    </button>
  );
}
function BrassSlider({ value, onChange, ticks = 7 }: { value: number; onChange: (v: number) => void; ticks?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const set = (clientX: number) => {
    const r = ref.current!.getBoundingClientRect();
    onChange(clamp((clientX - r.left) / r.width, 0, 1));
  };
  return (
    <div ref={ref} className="slider" style={{ width: 120 }}
      onPointerDown={(e) => { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); set(e.clientX); }}
      onPointerMove={(e) => { if (e.buttons) set(e.clientX); }}>
      <div className="track" />
      {Array.from({ length: ticks }).map((_, i) => (<div key={i} className="tick" style={{ left: `${(i / (ticks - 1)) * 100}%` }} />))}
      <div className="fill" style={{ width: `${value * 100}%` }} />
      <div className="knob" style={{ left: `${value * 100}%` }} />
    </div>
  );
}
function Connect({ label = "Connect", onClick }: { label?: string; onClick?: () => void }) {
  return <button className="btn btn-amber" style={{ minHeight: 32 }} onClick={onClick}>{label}</button>;
}
function Row({ label, sub, lock, children }: { label: string; sub?: string; lock?: boolean; children?: React.ReactNode }) {
  return (
    <div className="srow">
      <div className="labels">
        <div className="l">{label}{lock && <Lock size={16} color={C.ink70} />}</div>
        {sub && <div className="s">{sub}</div>}
      </div>
      {children}
    </div>
  );
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="settings-section">
      <p className="slabel">{title}</p>
      <div className="card">{children}</div>
    </div>
  );
}

export default function StandingOrders({ initialSlug, initial }: { initialSlug: string; initial: Settings }) {
  const router = useRouter();
  const [slug, setSlug] = useState(initialSlug);
  const [s, setS] = useState<Settings>(initial);
  const [note, setNote] = useState("");

  async function ensureSlug(): Promise<string> {
    if (slug) return slug;
    const r = await post<{ slug: string }>("/api/shop");
    setSlug(r.slug);
    return r.slug;
  }
  async function save(patch: Partial<Settings>) {
    const next = { ...s, ...patch };
    setS(next);
    const sl = await ensureSlug();
    try { await put(`/api/settings/${sl}`, next); flash("noted."); } catch { flash("didn't take — try again?"); }
  }
  const flashRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  function flash(t: string) { setNote(t); if (flashRef.current) clearTimeout(flashRef.current); flashRef.current = setTimeout(() => setNote(""), 1400); }

  const floorPct = Math.round(s.reserveFloorPct * 100);

  async function del() {
    if (!slug) return;
    if (!confirm("Delete this shop and its data? This can't be undone.")) return;
    await fetch(`/api/shop/${slug}`, { method: "DELETE" });
    router.push("/");
  }

  return (
    <div className="screen">
      <div className="row between" style={{ alignItems: "baseline" }}>
        <h1 style={{ fontFamily: "var(--slab)", fontWeight: 800, fontSize: 27 }}>Standing Orders</h1>
        {note && <span className="hand muted" style={{ fontSize: 15 }}>{note}</span>}
      </div>
      <p className="muted" style={{ margin: "-8px 0 0", fontSize: 12.5 }}>The orders you leave your shopkeeper — sensible by default.</p>

      <Section title="Reserve rules · the floor">
        <Row label="Reserve floor" sub={`${floorPct}% of the appraised low`}>
          <BrassSlider value={(s.reserveFloorPct - 0.6) / 0.4} onChange={(v) => save({ reserveFloorPct: 0.6 + v * 0.4 })} />
        </Row>
        <Row label="Never sell below reserve" sub="the one lock you can't open" lock><Lever on locked /></Row>
        <Row label="Auto-accept at/above" sub={s.autoAcceptPct ? `${Math.round(s.autoAcceptPct * 100)}% of asking` : "off — every offer is gated"}>
          <Lever on={s.autoAcceptPct != null} onToggle={() => save({ autoAcceptPct: s.autoAcceptPct == null ? 0.95 : null })} />
        </Row>
        <Row label="Price rounding">
          <div className="row" style={{ gap: 6 }}>
            {(["none", "5", "9"] as const).map((r) => (
              <button key={r} className={`chip tap ${s.rounding === r ? "amber" : ""}`} onClick={() => save({ rounding: r })}>{r === "none" ? "none" : `ends in ${r}`}</button>
            ))}
          </div>
        </Row>
      </Section>

      <Section title="The haggler · persona">
        <Row label="Tone" sub="friendly ⟷ firm"><BrassSlider value={s.tone} onChange={(v) => save({ tone: v })} /></Row>
        <Row label="Max rounds" sub="then it holds, or asks you">
          <div className="row" style={{ gap: 8, alignItems: "center" }}>
            <button className="chip tap" onClick={() => save({ maxRounds: Math.max(1, s.maxRounds - 1) })}>−</button>
            <span className="mono" style={{ fontWeight: 700 }}>{s.maxRounds}</span>
            <button className="chip tap" onClick={() => save({ maxRounds: Math.min(6, s.maxRounds + 1) })}>+</button>
          </div>
        </Row>
        <Row label="Suggest bundles"><Lever on={s.suggestBundles} onToggle={() => save({ suggestBundles: !s.suggestBundles })} /></Row>
      </Section>

      <Section title="What I won't touch">
        <Row label="Safety categories" sub="recalled · weapons · hazmat · counterfeit · age-gated" lock />
        <Row label="When unsure, ask me first"><Lever on={s.askWhenUnsure} onToggle={() => save({ askWhenUnsure: !s.askWhenUnsure })} /></Row>
      </Section>

      <Section title="How buyers reach me">
        <Row label="Channel">
          <select className="chip" value={s.channel} onChange={(e) => save({ channel: e.target.value as Settings["channel"] })}
            style={{ appearance: "auto", padding: "2px 8px", height: 26 }}>
            <option value="shop">Shop box</option>
            <option value="telegram">Telegram</option>
            <option value="email">Email</option>
          </select>
        </Row>
        <Row label="Connect Telegram" sub="haggle from your phone"><Connect onClick={() => flash("Add a bot token to connect Telegram (see README).")} /></Row>
        <Row label="Quiet hours" sub="it still drafts, won't send"><Lever on={s.quietHours.on} onToggle={() => save({ quietHours: { ...s.quietHours, on: !s.quietHours.on } })} /></Row>
      </Section>

      <Section title="eBay & export">
        <Row label="Connect eBay" sub="one-tap real eBay listings"><Connect onClick={() => flash("Add your eBay seller OAuth token to publish for real (see README).")} /></Row>
        <Row label="Export packs" sub="Depop · Facebook · Vinted — copy-paste"><Lever on={s.exportPacks} onToggle={() => save({ exportPacks: !s.exportPacks })} /></Row>
      </Section>

      <Section title="The shop">
        <Row label="Shop link"><span className="mono muted" style={{ fontSize: 13 }}>{slug ? `stash.shop/${slug}` : "opens on first pile"}</span></Row>
        <Row label="Show “$ found” publicly"><Lever on={s.showFound} onToggle={() => save({ showFound: !s.showFound })} /></Row>
        <Row label="Claim your shop" sub="optional · keeps your shop for good"><Connect label="Claim" onClick={() => flash("Claiming (email/passkey) keeps your shop beyond this session.")} /></Row>
      </Section>

      <Section title="Demo & data">
        <Row label="Demo shop" sub="a curated pile, clearly separate">
          <button className="btn-ghost" style={{ minHeight: 30 }} onClick={() => router.push("/s/demo-drawer")}>Open</button>
        </Row>
        <Row label="Export everything">
          <a className="btn-ghost" style={{ minHeight: 30 }} href={slug ? `/api/ledger/${slug}?format=ndjson` : "#"} download>Export</a>
        </Row>
        <Row label="Delete my shop"><button className="btn-ghost" style={{ minHeight: 30 }} onClick={del}>Delete</button></Row>
      </Section>

      <div style={{ textAlign: "center", marginTop: 12 }}>
        <p className="faint" style={{ fontFamily: "var(--book)", fontWeight: 700, fontSize: 12, margin: 0 }}>Runs on Qwen Cloud</p>
        <p className="faint mono" style={{ fontSize: 10.5, margin: "4px 0" }}>{QWEN_STACK}</p>
        <p className="faint" style={{ fontSize: 12, margin: 0 }}>Nothing about you is sold.</p>
      </div>
    </div>
  );
}
