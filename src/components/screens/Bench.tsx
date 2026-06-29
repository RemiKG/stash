"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Mascot from "@/components/art/Mascot";
import Plate from "@/components/art/Plate";
import SplitFlap from "@/components/art/SplitFlap";
import { Plus } from "@/components/art/Icons";
import { post } from "@/lib/api";
import { scrubAndPlate } from "@/lib/scrub.client";
import { band, money } from "@/lib/utils";
import { C } from "@/lib/art/kit";
import type { Item } from "@/lib/types";

type Step = "id" | "question" | "prohibited" | "appraise" | "compose" | "done" | "ai_error" | "error";

export default function Bench({ slug, initial }: { slug: string; initial: Item[] }) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>(initial);
  const itemsRef = useRef(initial);
  const [idx, setIdx] = useState(0);
  const [step, setStep] = useState<Step>("id");
  const [msg, setMsg] = useState("");
  const ranRef = useRef(false);
  const resumeRef = useRef<(() => void) | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [answering, setAnswering] = useState(false);

  const setBoth = (next: Item[]) => { itemsRef.current = next; setItems(next); };
  const patch = (i: number, item: Item) => { const n = [...itemsRef.current]; n[i] = item; setBoth(n); };
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;
    (async () => {
      const list = itemsRef.current;
      if (!list.length) { router.push("/nod"); return; }
      try {
        for (let i = 0; i < list.length; i++) {
          let it = itemsRef.current[i];
          if (["appraised", "listed", "sold", "set_aside"].includes(it.status)) continue;
          setIdx(i);
          setStep("id");
          it = (await post<{ item: Item }>(`/api/items/${it.id}/identify`, { slug })).item;
          patch(i, it);
          if (it.status === "set_aside") { setStep("prohibited"); await wait(1600); continue; }
          if (it.question) { setStep("question"); await new Promise<void>((res) => (resumeRef.current = res)); it = itemsRef.current[i]; }
          setStep("appraise");
          it = (await post<{ item: Item }>(`/api/items/${it.id}/appraise`, { slug })).item;
          patch(i, it);
          setStep("compose");
          it = (await post<{ item: Item }>(`/api/items/${it.id}/compose`, { slug })).item;
          patch(i, it);
        }
        setStep("done");
        await wait(700);
        router.push("/nod");
      } catch (e) {
        const err = e as { status?: number; message?: string };
        if (err.status === 503) { setStep("ai_error"); setMsg(err.message || "The eye needs a key."); }
        else { setStep("error"); setMsg(err.message || "Something jammed on the bench."); }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function answer(text: string, extraPhoto?: string) {
    if (answering) return;
    setAnswering(true);
    try {
      const it = (await post<{ item: Item }>(`/api/items/${itemsRef.current[idx].id}/answer`, { slug, answer: text, extraPhoto })).item;
      patch(idx, it);
      resumeRef.current?.();
      resumeRef.current = null;
      setStep("appraise");
    } catch {
      setMsg("Couldn't take that in — try again?");
    } finally {
      setAnswering(false);
    }
  }
  async function addPhoto(files: FileList | null) {
    if (!files?.[0]) return;
    const { scrubbed } = await scrubAndPlate(files[0]);
    await answer("(added a clearer photo)", scrubbed);
  }

  const cur = items[idx];
  const n = items.length;
  const done = items.filter((i) => ["appraised", "listed", "sold", "set_aside"].includes(i.status)).length;

  if (step === "ai_error") {
    return (
      <div className="screen">
        <p className="slabel">On the bench</p>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: "flex", gap: 12 }}>
            <Mascot pose="appraise" title="the Quartermaster" />
            <div>
              <h3 style={{ fontFamily: "var(--book)", fontWeight: 700, fontSize: 17, margin: 0 }}>The appraiser&rsquo;s eye needs a key.</h3>
              <p className="muted" style={{ fontSize: 13.5 }}>
                Live identification runs on Qwen Cloud. Set <code>DASHSCOPE_API_KEY</code> (or a dev
                <code> ANTHROPIC_API_KEY</code>) and the bench comes alive — your photo in, an inked
                engraving and a real price band out. Nothing is faked in the meantime.
              </p>
            </div>
          </div>
          <style>{`.card svg { width: 90px; height: auto; }`}</style>
        </div>
        <a className="btn btn-wax" href="/s/demo-drawer">Watch the demo shop instead →</a>
        <a className="btn btn-ghost" href="/">Back home</a>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="row between" style={{ alignItems: "baseline" }}>
        <p className="slabel" style={{ margin: 0 }}>On the bench</p>
        <span className="mono muted" style={{ fontSize: 12.5 }}>
          {step === "done" ? "all done" : `identifying ${Math.min(idx + 1, n)} of ${n}`}
        </span>
      </div>
      <div className="rail"><div className="fill" style={{ width: `${(done / Math.max(1, n)) * 100}%` }} /></div>

      <div className="row" style={{ gap: 10, alignItems: "flex-end" }}>
        <div style={{ width: 92, flex: "none" }}><Mascot pose="appraise" title="the Quartermaster" /></div>
        {cur && <Plate src={cur.plateSrc} objName={cur.plateSrc ? undefined : cur.title || cur.category} caption={cur.title ? `${cur.title}` : "on the bench"} style={{ width: 150, height: 168 }} />}
      </div>
      <div style={{ height: 10, background: C.paperDeep, border: `1.4px solid ${C.ink}`, borderRadius: 2, margin: "-4px 40px 0" }} />

      {step === "question" && cur?.question ? (
        <div className="card" style={{ padding: 16 }}>
          <p className="slabel" style={{ margin: 0 }}>One quick thing</p>
          <p style={{ fontFamily: "var(--book)", fontSize: 15, margin: "8px 0" }}>{cur.question.text}</p>
          <div className="row wrap" style={{ gap: 8 }}>
            {(cur.question.options || []).map((o) => (
              <button key={o} className="btn-ghost" style={{ minHeight: 38 }} disabled={answering} onClick={() => answer(`It's the ${o}`)}>{o}</button>
            ))}
            <button className="btn btn-amber" disabled={answering} onClick={() => fileRef.current?.click()}><Plus size={15} /> Add a photo</button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => addPhoto(e.target.files)} />
        </div>
      ) : step === "prohibited" ? (
        <div className="card" style={{ padding: 16 }}>
          <p style={{ fontFamily: "var(--book)", fontSize: 15, margin: 0 }}>
            I can&rsquo;t put this one out — {cur?.prohibitedReason}. Setting it aside.
          </p>
        </div>
      ) : (
        <>
          <div className="card" style={{ padding: 16 }}>
            <div className="row between" style={{ alignItems: "flex-start" }}>
              <p className="slabel" style={{ margin: 0 }}>Identified</p>
              <span className="col" style={{ alignItems: "flex-end" }}>
                <SplitFlap value={`${cur?.confidence ?? 0}%`} h={26} />
                <span className="muted" style={{ fontSize: 10.5, marginTop: 2 }}>confidence</span>
              </span>
            </div>
            {cur?.conditionGrade && (
              <div style={{ marginTop: 8 }}>
                <span className="chip">{cur.conditionGrade}</span>
              </div>
            )}
            <p className="muted" style={{ fontSize: 12.5, margin: "10px 0 0" }}>
              {[cur?.conditionNote, ...(cur?.defects || [])].filter(Boolean).join(" · ") || (step === "id" ? "loupe's down. give me a second with this one." : "")}
            </p>
          </div>

          <div>
            <p className="slabel">What it&rsquo;s selling for now</p>
            {cur && cur.comps.length ? (
              <div className="row" style={{ gap: 8 }}>
                {cur.comps.slice(0, 4).map((c, i) => (
                  <div key={i} className="col" style={{ alignItems: "center", gap: 4 }}>
                    <Plate objName={cur.title || cur.category} caption={undefined} style={{ width: 74, height: 76 }} />
                    <span className="mono" style={{ fontWeight: 700, fontSize: 13 }}>{money(c.price)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="hand faint" style={{ fontSize: 14, margin: 0 }}>
                {cur?.status === "appraised" ? "reasoned without live comps — connect eBay for market pricing." : "pulling comparable listings…"}
              </p>
            )}
          </div>

          <div className="card" style={{ padding: 16 }}>
            <p className="slabel" style={{ margin: "0 0 10px" }}>Your price band</p>
            {cur?.priceLow != null ? (
              <SplitFlap value={band(cur.priceLow, cur.priceHigh)} h={40} invert />
            ) : (
              <span className="hand faint" style={{ fontSize: 15 }}>scales are settling…</span>
            )}
            {cur?.why && <p className="muted" style={{ fontSize: 12.5, margin: "12px 0 0", fontStyle: "italic" }}>&ldquo;{cur.why}&rdquo;</p>}
            <p className="hand faint" style={{ fontSize: 13, margin: "6px 0 0" }}>
              {step === "compose" ? "composing the listing…" : step === "done" ? "ready for your nod." : ""}
            </p>
          </div>
        </>
      )}

      {step === "error" && <p style={{ fontSize: 13 }}><span style={{ borderBottom: `2px solid ${C.amber}` }}>{msg}</span></p>}
    </div>
  );
}
