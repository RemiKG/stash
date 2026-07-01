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
