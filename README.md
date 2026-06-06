# Stash 🐿️

> **Turn your stash into cash.** Point your phone at a pile of stuff. A little
> shopkeeper — the **Quartermaster** — identifies it, prices it, lists it, and
> haggles with buyers for you. You just **nod**.
>
> _Every closet is a shop that never opened._

**Track 4 · Autopilot Agent** — Qwen Cloud Global AI Hackathon. An autopilot
back-office for recommerce: intake → identify → appraise → compose → publish →
negotiate → fulfill, with a human‑in‑the‑loop nod at every gate that touches the
world.

It looks like a 1900s mail-order curiosity-shop, hand-printed on a risograph —
two inks on cream, hand-cut woodcut engraving, split-flap numbers, a constant
`+1.6/+1.1px` amber misregistration. That hand-made skin is deliberate; the
engine underneath is a modern multi-model agent.

---

## The one mechanic — _point → nod_

Four things you **do**, two you **watch**, one you **set once**:

| | | |
|---|---|---|
| **Add** | point your phone at a pile — the only input | `qwen3-vl-plus` fine-grained ID + condition + defects → JSON; on-device PII scrub |
| **Answer** | one targeted question, only when the agent is genuinely unsure | uncertainty → single answerable question → re-run |
| **Nod** | the Counter — `✔ / ✎ / ✕`, three gates, one gesture | deterministic policy layer + `qwen3.7-max` negotiation |
| **Share** | a real, public, shareable shop URL | hosted shop (real) · eBay one-tap (opt-in) · export packs |
| **Watch — the Bench** | identify → appraise → compose, made legible | `text-embedding-v4` comps + `qwen3.7-plus` band/why/compose |
| **Watch — the Ledger** | an append-only receipt of everything it did | append-only NDJSON audit log |
| **Set — Standing Orders** | reserve rules, the haggler, prohibited items, comms, eBay | the policy layer, surfaced |

The three Track-4 human-in-the-loop gates are **one gesture (the Counter) that
recurs**: the Quartermaster presents something across a counter and waits for
your `✔ list / ✎ edit / ✕ not this`. Learn it once at Gate 1; Gates 2 and 3 need
no new learning.

---

## What is REAL

Everything here runs on a stranger's own live input, no third-party account, and
persists on the deployment. A clearly-labelled **Demo shop** sits _on top of_ the
real path; the real path works on its own.

| What | Live input | What the core does | Persists |
|---|---|---|---|
| **Your photos** | your camera / uploaded files (a pile per photo) | EXIF/metadata stripped + **faces mosaiced on-device** (pico.js), then re-encoded server-side; turned into a duotone **catalogue plate** | scrubbed photo + plate → object storage |
| **Identification** | the real photo | **VL model** returns make/model/edition/size + grade + defects + a **confidence**; low confidence → asks _you_ one question | item record |
| **Appraisal** | live **eBay Browse** comps (when connected) | **embeddings** (or lexical) rank comps; the model reasons a **band + one-line why + confidence** | comps + band + rationale |
| **Listing** | the item + your Gate-1 edits | the model composes a platform-correct listing (title, description, item-specifics, category) | the composed listing |
| **Your Stash shop** | what you approved at Gate 1 | published to a **real, public, shareable URL** (`/s/<slug>`) — no account for a visitor | shop, items, prices, SOLD state |
| **Negotiation** | a real buyer's message (shop box / Telegram) | **`qwen3.7-max`** runs a genuine multi-turn haggle and drafts each move; **you gate every move** | thread + each gated decision → DB + ledger |
| **The policy layer** | every model proposal, before it touches the world | deterministic **reserve floor** (never breached without you), **prohibited-items** classifier, **idempotent publish**, gating | your Standing Orders |
| **The receipt ledger** | every action | appended, in order, immutable — corrections are new lines | **append-only NDJSON**, exportable |
| **eBay real publish** _(opt-in)_ | your own eBay seller OAuth | `createOrReplaceInventoryItem → createOffer → publishOffer` = a genuine live listing | offer/listing ids |

**Faked / demo-only, on purpose:** the pre-seeded Demo shop's numbers are
illustrative; Depop/Facebook/Vinted are honest **copy-paste export packs** (no
open API); the shipping-label purchase at Gate 3 is simulated (SOLD state + ledger
are real) until a carrier API is wired; the example buyer in the demo is seeded.

### The AI provider seam
All inference goes through one **OpenAI-compatible** client
(`src/lib/ai/client.ts`) pointed at whichever key is present:

- **Qwen Cloud** (the intended provider) — `DASHSCOPE_API_KEY`, base
  `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`, models
  `qwen3-vl-plus · text-embedding-v4 · qwen3.7-plus · qwen3.7-max`.
- **Anthropic** (a real dev/verification fallback) — `ANTHROPIC_API_KEY`, used
  only when no Qwen key is set, so the pipeline is verifiable end-to-end.
- **Neither** → the app degrades honestly: the Demo shop and the whole UI still
  work; the live upload path says "the appraiser's eye needs a key".

No secret is hardcoded or committed. See `.env.example`.

---

## Architecture

The **architecture diagram and the UI are the same left-to-right picture**:

```
