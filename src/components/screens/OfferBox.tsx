"use client";
import { useState } from "react";
import { post } from "@/lib/api";

export default function OfferBox({ slug, itemId }: { slug: string; itemId: string }) {
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function send() {
    if (!text.trim() || busy) return;
    setBusy(true);
    try {
      await post(`/api/shop/${slug}/offer`, { itemId, text: text.trim() });
      setSent(true);
      setText("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card" style={{ padding: 18 }}>
      <p className="slabel" style={{ margin: "0 0 10px" }}>Message the shopkeeper</p>
      {sent ? (
        <p style={{ fontFamily: "var(--book)", margin: 0 }}>Sent — the squirrel&rsquo;s on it. Watch this space.</p>
      ) : (
        <>
          <input
            className="well"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Make the squirrel an offer…"
            style={{ width: "100%", padding: "12px 14px", fontFamily: "var(--book)", fontSize: 15, color: "var(--ink)" }}
          />
          <button className="btn btn-wax sm" style={{ width: "100%", marginTop: 12 }} disabled={busy || !text.trim()} onClick={send}>
            {busy ? "Sending…" : "Send offer"}
          </button>
        </>
      )}
    </div>
  );
}
