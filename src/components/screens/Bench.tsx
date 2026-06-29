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
