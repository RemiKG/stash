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
