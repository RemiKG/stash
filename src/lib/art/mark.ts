// mark.ts — the tail-$ mark (a squirrel tail that IS a dollar sign) ported from
// art/_tools/mark.mjs. Legible to favicon size. Plain glyph + coin badge.
import { C, amberPlate, inkwork } from "./kit";

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

// tail-$ glyph inside a 120x140 box (cx=60).
export function tailDollarInner() {
  const cx = 60;
  const S = "M78 42 C78 27 58 23 45 30 C31 37 32 55 49 61 C67 67 79 72 75 88 C71 105 50 108 37 99";
  const bar = `<path d="M${cx} 18 L${cx} 122" stroke="${C.ink}" stroke-width="8" stroke-linecap="round"/>`;
  const ticks = [[78, 42, -0.9], [72, 30, -1.6], [50, 26, -2.1], [79, 78, 0.2], [70, 100, 0.9], [40, 101, 1.7]]
    .map(([x, y, a]) => `<line x1="${x}" y1="${y}" x2="${(x + Math.cos(a) * 9).toFixed(1)}" y2="${(y + Math.sin(a) * 9).toFixed(1)}" stroke="${C.ink}" stroke-width="2" stroke-linecap="round"/>`)
    .join("");
  const tipTop = `<path d="${fluff(80, 40, 8, 8, 0.2, 1)}" fill="${C.amber}" stroke="${C.ink}" stroke-width="2"/>`;
  const tipBot = `<path d="${fluff(37, 100, 8, 8, 0.2, 2)}" fill="${C.amber}" stroke="${C.ink}" stroke-width="2"/>`;
  const inner = `
    ${amberPlate(`<path d="${S}" fill="none" stroke="${C.amber}" stroke-width="15" stroke-linecap="round"/>`)}
    ${bar}
    <path d="${S}" fill="none" stroke="${C.amber}" stroke-width="14" stroke-linecap="round"/>
    <path d="${S}" fill="none" stroke="${C.ink}" stroke-width="2" stroke-linecap="round"/>
    ${tipTop}${tipBot}${ticks}`;
  return inkwork(`<g>${inner}</g>`, "lite");
}

// coin badge (awning / favicon): the glyph on a milled amber coin. 150x150 box.
export function tailBadgeInner() {
  const R = 66, C0 = 70;
  let mill = "";
  for (let i = 0; i < 44; i++) {
    const a = (i / 44) * Math.PI * 2;
    mill += `<line x1="${(C0 + Math.cos(a) * (R + 1)).toFixed(1)}" y1="${(C0 + Math.sin(a) * (R + 1)).toFixed(1)}" x2="${(C0 + Math.cos(a) * (R + 5)).toFixed(1)}" y2="${(C0 + Math.sin(a) * (R + 5)).toFixed(1)}" stroke="${C.ink}" stroke-width="1.5"/>`;
  }
  return `${mill}
    <circle cx="${C0}" cy="${C0}" r="${R}" fill="${C.paperHi}" stroke="${C.ink}" stroke-width="4"/>
    <circle cx="${C0}" cy="${C0}" r="${R - 6}" fill="none" stroke="${C.ink}" stroke-width="1.3"/>
    <g transform="translate(10 2)">${tailDollarInner()}</g>`;
}

// a milled amber coin holding a glyph/letter (used by the wordmark's coin-a and app-bar $)
export function coinWith(cx: number, cy: number, r: number, glyph: string, amber = true) {
  let mill = "";
  const N = 48;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2, r1 = r + 1.5, r2 = r + 5.5;
    mill += `<line x1="${(cx + Math.cos(a) * r1).toFixed(1)}" y1="${(cy + Math.sin(a) * r1).toFixed(1)}" x2="${(cx + Math.cos(a) * r2).toFixed(1)}" y2="${(cy + Math.sin(a) * r2).toFixed(1)}" stroke="${C.ink}" stroke-width="1.4"/>`;
  }
  return `${amber ? amberPlate(`<circle cx="${cx}" cy="${cy}" r="${r - 1}" fill="${C.amber}"/>`) : ""}
    <circle cx="${cx}" cy="${cy}" r="${r - 1}" fill="${amber ? C.amber : C.paperHi}"/>
    ${mill}
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.ink}" stroke-width="4"/>
    <circle cx="${cx}" cy="${cy}" r="${r - 6}" fill="none" stroke="${C.ink}" stroke-width="1.3"/>
    ${glyph}`;
}
