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
