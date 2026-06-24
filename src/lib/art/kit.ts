// kit.ts — the Stash print system, ported from art/_tools/kit.mjs + mascot.mjs +
// mark.mjs + ui.mjs. Pure string-returning SVG helpers (no randomness -> SSR-safe)
// so the React art components render identically on server and client.

export const C = {
  paper: "#F5F3EF",
  paperDeep: "#ECE7DE",
  paperHi: "#FBFAF6",
  ink: "#2B2119",
  ink70: "#6E6155",
  ink45: "#9A9084",
  ink22: "#C9C2B7",
  amber: "#E8A33D",
  amberDeep: "#C9812A",
  overprint: "#7A5A24",
};
// THE most important constant: the two-plate misregistration.
export const RISO = { dx: 1.6, dy: 1.1 };

// deterministic jitter (replaces Math.random so server == client)
const jit = (i: number, mag = 1) => (Math.sin(i * 12.9898 + 4.1) * 43758.5453 % 1) * mag;

export const amberPlate = (inner: string, dx = RISO.dx, dy = RISO.dy) =>
  `<g transform="translate(${dx} ${dy})" style="mix-blend-mode:multiply">${inner}</g>`;

export const inkwork = (inner: string, level: "lite" | "soft" | "hard" = "soft") => {
  const id = { lite: "wobLite", soft: "wob", hard: "wobHard" }[level];
  return `<g filter="url(#${id})">${inner}</g>`;
};

const P = (
  d: string,
  o: { fill?: string; stroke?: string; sw?: number; cap?: string; join?: string; op?: number } = {}
) => {
  const { fill = "none", stroke = C.ink, sw = 2, cap = "round", join = "round", op = 1 } = o;
  return `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="${cap}" stroke-linejoin="${join}" opacity="${op}"/>`;
};

function fluff(cx: number, cy: number, r: number, bumps = 8, amp = 0.2, rot = 0) {
  let d = "";
  const step = (Math.PI * 2) / bumps;
  for (let i = 0; i < bumps; i++) {
    const a0 = rot + i * step, a1 = rot + (i + 1) * step, am = (a0 + a1) / 2;
    const x0 = cx + Math.cos(a0) * r, y0 = cy + Math.sin(a0) * r;
    const x1 = cx + Math.cos(a1) * r, y1 = cy + Math.sin(a1) * r;
    const bx = cx + Math.cos(am) * r * (1 + amp), by = cy + Math.sin(am) * r * (1 + amp);
    d += (i ? "" : `M${x0.toFixed(1)} ${y0.toFixed(1)}`) + `Q${bx.toFixed(1)} ${by.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  }
  return d + "Z";
}
function hairs(cx: number, cy: number, r: number, a0: number, a1: number, n: number, len: number, w = 1) {
  let s = "";
  for (let i = 0; i < n; i++) {
    const a = a0 + (a1 - a0) * (i / (n - 1));
    const x0 = cx + Math.cos(a) * r, y0 = cy + Math.sin(a) * r;
    const x1 = cx + Math.cos(a) * (r + len), y1 = cy + Math.sin(a) * (r + len);
    s += `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="${C.ink}" stroke-width="${w}" stroke-linecap="round"/>`;
  }
  return s;
}

// ---- amber wax stamp (SOLD) — pressed, irregular, ink-embossed. deterministic. ----
export function waxStampSVG(text = "SOLD", r = 52, rot = -8) {
  let d = "";
  const N = 26;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2;
    const rr = r * (1 + Math.sin(a * 3 + 1) * 0.03 + (jit(i, 0.06) - 0.03));
    d += (i ? "L" : "M") + (Math.cos(a) * rr).toFixed(1) + "," + (Math.sin(a) * rr).toFixed(1) + " ";
  }
  d += "Z";
  return `<g transform="rotate(${rot})">
    <path d="${d}" transform="translate(${RISO.dx} ${RISO.dy})" fill="${C.amberDeep}" opacity="0.9" style="mix-blend-mode:multiply" filter="url(#rough)"/>
    <path d="${d}" fill="${C.amber}" filter="url(#rough)"/>
    <path d="${d}" transform="scale(0.82)" fill="none" stroke="${C.overprint}" stroke-width="1.4" opacity="0.6"/>
    <text x="0" y="0" fill="${C.overprint}" font-family="Rokkitt,Rockwell,Georgia,serif" font-weight="900" font-size="${r * 0.5}" text-anchor="middle" dominant-baseline="central" letter-spacing="1">${text}</text>
  </g>`;
}

// ============================================================================
//  Halftone object primitives (demo / seeded items + ledger). ~130 wide, centred.
// ============================================================================
const A = amberPlate;
const htRect = (x: number, y: number, w: number, h: number, r = 6, tone = "htB") =>
  `${A(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="url(#htAmber)"/>`)}<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="url(#${tone})"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="none" stroke="${C.ink}" stroke-width="2"/>`;
const htCirc = (cx: number, cy: number, r: number, tone = "htC") =>
  `${A(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#htAmber)"/>`)}<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${tone})"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.ink}" stroke-width="2"/>`;
const htPath = (d: string, tone = "htB") =>
  `${A(`<path d="${d}" fill="url(#htAmber)"/>`)}<path d="${d}" fill="url(#${tone})"/><path d="${d}" fill="none" stroke="${C.ink}" stroke-width="2"/>`;
const ln = (d: string, w = 1.5, op = 0.8) =>
  `<path d="${d}" fill="none" stroke="${C.ink}" stroke-width="${w}" opacity="${op}" stroke-linecap="round"/>`;

export const OBJ: Record<string, () => string> = {
  camera: () => `${htRect(-58, -26, 116, 58, 8)}${htRect(-22, -40, 40, 16, 3, "htA")}${htCirc(0, 4, 26)}<circle cx="0" cy="4" r="12" fill="${C.paperDeep}" stroke="${C.ink}" stroke-width="1.6"/><circle cx="0" cy="4" r="5" fill="none" stroke="${C.ink}" stroke-width="1.2"/>${htRect(30, -20, 16, 10, 2, "htA")}${ln("M-46 -14 L-30 -14")}`,
  lamp: () => `${htPath("M-34 -46 L34 -46 L22 -6 L-22 -6 Z")}<rect x="-4" y="-6" width="8" height="42" fill="url(#htB)" stroke="${C.ink}" stroke-width="1.6"/>${htPath("M-26 36 L26 36 L20 46 L-20 46 Z")}${ln("M-30 -30 L30 -30", 1, 0.5)}`,
  sneaker: () => `${htPath("M-58 20 C-58 6 -44 2 -30 2 C-14 2 -6 -10 10 -14 C30 -19 44 -8 52 6 C58 16 56 24 44 24 L-50 24 C-56 24 -58 22 -58 20 Z")}${ln("M-50 24 L50 24")}${ln("M-8 -8 C-4 -2 0 0 6 0")}${ln("M2 -12 C6 -6 10 -4 16 -4")}<ellipse cx="-30" cy="10" rx="10" ry="5" fill="${C.paperDeep}" stroke="${C.ink}" stroke-width="1.4"/>`,
  watch: () => `${htRect(-13, -44, 26, 34, 6, "htA")}${htRect(-13, 12, 26, 34, 6, "htA")}${htCirc(0, 0, 26)}<circle cx="0" cy="0" r="20" fill="${C.paperHi}" stroke="${C.ink}" stroke-width="1.6"/>${ln("M0 0 L0 -12", 2)}${ln("M0 0 L9 4", 2)}<circle cx="0" cy="0" r="1.8" fill="${C.ink}"/>`,
  books: () => `${htRect(-46, 20, 92, 18, 2, "htB")}${htRect(-40, 2, 84, 18, 2, "htA")}${htRect(-44, -16, 88, 18, 2, "htC")}${ln("M-38 26 L38 26", 1.2, 0.6)}${ln("M-34 8 L34 8", 1.2, 0.6)}${ln("M-36 -10 L36 -10", 1.2, 0.6)}`,
  vase: () => `${htPath("M-20 -44 C-20 -30 -34 -20 -34 6 C-34 34 -18 46 0 46 C18 46 34 34 34 6 C34 -20 20 -30 20 -44 C12 -40 -12 -40 -20 -44 Z")}${ln("M-18 -40 C-8 -36 8 -36 18 -40", 1.4, 0.6)}${ln("M-30 4 C-14 12 14 12 30 4", 1.2, 0.5)}`,
  chair: () => `${htRect(-30, -46, 52, 44, 5, "htA")}${htRect(-30, 4, 52, 12, 3)}<rect x="-28" y="16" width="7" height="30" fill="url(#htB)" stroke="${C.ink}" stroke-width="1.6"/><rect x="16" y="16" width="7" height="30" fill="url(#htB)" stroke="${C.ink}" stroke-width="1.6"/>${ln("M-22 -38 L14 -38 M-22 -26 L14 -26 M-22 -14 L14 -14", 1.2, 0.5)}`,
  jacket: () => `${htPath("M-40 -34 L-16 -40 C-8 -30 8 -30 16 -40 L40 -34 L30 -12 L24 -14 L24 46 L-24 46 L-24 -14 L-30 -12 Z")}${ln("M0 -30 L0 46", 1.4, 0.6)}${ln("M-16 -40 L-6 -20 M16 -40 L6 -20", 1.4, 0.6)}<circle cx="0" cy="0" r="2" fill="${C.ink}"/><circle cx="0" cy="14" r="2" fill="${C.ink}"/><circle cx="0" cy="28" r="2" fill="${C.ink}"/>`,
  bag: () => `${htPath("M-34 -8 L34 -8 L40 46 L-40 46 Z")}${ln("M-20 -8 C-20 -30 20 -30 20 -8", 3)}${htRect(-42, -12, 84, 10, 3, "htA")}${ln("M-24 8 L24 8", 1.2, 0.5)}`,
  console: () => `${htRect(-52, -14, 104, 30, 6)}${htCirc(-34, 1, 12, "htA")}${ln("M-40 -5 L-28 -5 M-34 -11 L-34 7", 2)}<circle cx="28" cy="-4" r="4" fill="${C.paperDeep}" stroke="${C.ink}" stroke-width="1.4"/><circle cx="40" cy="-4" r="4" fill="${C.paperDeep}" stroke="${C.ink}" stroke-width="1.4"/><circle cx="28" cy="8" r="4" fill="${C.paperDeep}" stroke="${C.ink}" stroke-width="1.4"/><circle cx="40" cy="8" r="4" fill="${C.paperDeep}" stroke="${C.ink}" stroke-width="1.4"/>`,
  // a neutral fallback for any unmatched category: a tidy parcel/box
  box: () => `${htPath("M-42 -30 L0 -44 L42 -30 L42 34 L0 48 L-42 34 Z")}${ln("M-42 -30 L0 -16 L42 -30", 1.6, 0.7)}${ln("M0 -16 L0 48", 1.4, 0.6)}${ln("M-20 -37 L22 -23", 1.2, 0.5)}`,
};

// pick a demo object for a category-ish string
export function objectFor(name = ""): () => string {
  const n = name.toLowerCase();
  const hit = Object.keys(OBJ).find((k) => n.includes(k));
  if (hit) return OBJ[hit];
  if (/cam|lens|slr|photo/.test(n)) return OBJ.camera;
  if (/shoe|trainer|sneak|boot/.test(n)) return OBJ.sneaker;
  if (/coat|shirt|dress|cloth|tee|hood/.test(n)) return OBJ.jacket;
  if (/light|lamp/.test(n)) return OBJ.lamp;
  if (/book|novel/.test(n)) return OBJ.books;
  if (/watch|clock/.test(n)) return OBJ.watch;
  if (/vase|pot|jar|cup|glass/.test(n)) return OBJ.vase;
  if (/bag|purse|tote/.test(n)) return OBJ.bag;
  if (/chair|stool|seat/.test(n)) return OBJ.chair;
  if (/game|console|controller/.test(n)) return OBJ.console;
  return OBJ.box;
}
