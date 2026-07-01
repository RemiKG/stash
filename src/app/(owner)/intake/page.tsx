"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Plate from "@/components/art/Plate";
import { Plus, Lock } from "@/components/art/Icons";
import { scrubAndPlate } from "@/lib/scrub.client";
import { post } from "@/lib/api";
import { C } from "@/lib/art/kit";

type Shot = { scrubbed: string; plate: string };

export default function Intake() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [shots, setShots] = useState<Shot[]>([]);
  const [busy, setBusy] = useState(false);
  const [scrubbing, setScrubbing] = useState(false);
  const [err, setErr] = useState("");

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setScrubbing(true);
    setErr("");
    try {
      const next: Shot[] = [];
      for (const f of Array.from(files).slice(0, 20)) {
        if (!f.type.startsWith("image/")) continue;
        next.push(await scrubAndPlate(f));
      }
      setShots((s) => [...s, ...next].slice(0, 20));
    } catch {
      setErr("Couldn't read that photo. Try another?");
    } finally {
      setScrubbing(false);
    }
  }

  async function appraise() {
    if (!shots.length || busy) return;
    setBusy(true);
    setErr("");
    try {
      const res = await post<{ slug: string; items: string[] }>("/api/intake", { photos: shots });
      router.push(`/bench?slug=${res.slug}`);
    } catch {
      setErr("Something jammed on the way in. Try again?");
      setBusy(false);
    }
  }

  const corner = (pos: React.CSSProperties, d: string) => (
    <svg width="26" height="26" viewBox="0 0 26 26" style={{ position: "absolute", ...pos }} aria-hidden>
      <path d={d} fill="none" stroke={C.amber} strokeWidth="3.4" strokeLinecap="round" />
    </svg>
  );

  return (
    <div className="screen">
      <p className="slabel">Intake</p>
      <h2 style={{ fontFamily: "var(--book)", fontWeight: 700, fontSize: 22, margin: 0 }}>Dump it all in.</h2>
      <p className="muted" style={{ margin: "-6px 0 0", fontSize: 14 }}>One photo or forty — I&rsquo;ll sort the pile.</p>

      <div
        className="well tap"
        style={{ position: "relative", height: 288, display: "flex", alignItems: "center", justifyContent: "center" }}
        onClick={() => fileRef.current?.click()}
      >
        {corner({ left: 12, top: 12 }, "M24 2 L2 2 L2 24")}
        {corner({ right: 12, top: 12 }, "M2 2 L24 2 L24 24")}
        {corner({ left: 12, bottom: 12 }, "M2 2 L2 24 L24 24")}
        {corner({ right: 12, bottom: 12 }, "M24 2 L24 24 L2 24")}

        <button className="btn-ghost" style={{ position: "absolute", top: 14, right: 14, minHeight: 32, fontSize: 14 }} onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}>
          <Plus size={16} /> choose photos
        </button>

        <svg width="240" height="150" viewBox="0 0 240 150" aria-hidden style={{ opacity: 0.5 }}>
          <g stroke={C.ink} strokeWidth="2" fill="none">
            <rect x="22" y="70" width="80" height="52" rx="6" />
            <ellipse cx="150" cy="92" rx="48" ry="34" />
            <rect x="70" y="22" width="70" height="60" rx="8" />
            <circle cx="186" cy="46" r="26" />
          </g>
        </svg>
        <span className="hand faint" style={{ position: "absolute", bottom: 44, left: 0, right: 0, textAlign: "center", fontSize: 17 }}>point at your pile</span>

        <div style={{ position: "absolute", bottom: -30, left: "50%", transform: "translateX(-50%)" }}>
          <div style={{ width: 60, height: 60, borderRadius: "50%", background: C.amber, border: `2.6px solid ${C.ink}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 46, height: 46, borderRadius: "50%", border: `2.4px solid ${C.paper}` }} />
          </div>
        </div>
      </div>

      <input ref={fileRef} type="file" accept="image/*" multiple capture="environment" hidden onChange={(e) => onFiles(e.target.files)} />

      <div style={{ marginTop: 20 }}>
        <div className="row" style={{ gap: 10, marginBottom: 8 }}>
          <span className="slabel">In the crate</span>
          {shots.length > 0 && <span className="chip amber" style={{ height: 20, minWidth: 20, padding: "0 6px", fontFamily: "var(--mono)", justifyContent: "center" }}>{shots.length}</span>}
          {scrubbing && <span className="hand muted" style={{ fontSize: 14 }}>scrubbing…</span>}
        </div>
        {shots.length === 0 ? (
          <p className="hand faint" style={{ fontSize: 15, margin: 0 }}>The crate&rsquo;s empty. Feed me a pile.</p>
        ) : (
          <div className="row wrap" style={{ gap: 8 }}>
            {shots.map((s, i) => (
              <Plate key={i} src={s.plate} caption={undefined} style={{ width: 60, height: 68 }} />
            ))}
          </div>
        )}
      </div>

      <div className="row" style={{ gap: 8, alignItems: "flex-start" }}>
        <Lock size={18} color={C.ink45} />
        <p className="muted" style={{ fontSize: 12.5, margin: 0 }}>
          Faces and personal details are scrubbed on your device, before anything is saved.
        </p>
      </div>

      {err && <p style={{ color: "var(--ink)", fontSize: 13, margin: 0 }}><span style={{ borderBottom: `2px solid ${C.amber}` }}>{err}</span></p>}

      <button className="btn btn-wax" disabled={!shots.length || busy} onClick={appraise} style={{ marginTop: 4 }}>
        {busy ? "Sending to the bench…" : shots.length ? `Appraise ${shots.length} ${shots.length === 1 ? "thing" : "things"} →` : "Appraise the pile →"}
      </button>
    </div>
  );
}
