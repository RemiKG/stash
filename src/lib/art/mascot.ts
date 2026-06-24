// mascot.ts — the Quartermaster, ported verbatim from art/_tools/mascot.mjs.
// ONE body, posed. Local art box 220x306, squirrel centred ~x=100, $-tail right.
import { C, amberPlate } from "./kit";

const P = (
  d: string,
  o: { fill?: string; stroke?: string; sw?: number; cap?: string; join?: string; op?: number } = {}
) => {
  const { fill = "none", stroke = C.ink, sw = 2, cap = "round", join = "round", op = 1 } = o;
  return `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="${cap}" stroke-linejoin="${join}" opacity="${op}"/>`;
};
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

const TAIL_OUTER = "M130 214 C176 212 204 178 202 134 C200 90 178 54 138 36 C127 31 119 29 114 27";
const TAIL_INNER = "C126 46 150 66 160 104 C169 142 166 174 150 198 C140 211 134 214 130 214 Z";
const TAIL_TICKS: [number, number, number][] = [
  [202, 150, 0.05], [201, 122, -0.25], [193, 92, -0.55], [178, 66, -0.9],
  [158, 46, -1.25], [138, 36, -1.55], [201, 172, 0.35], [193, 196, 0.7],
  [176, 210, 1.05], [156, 214, 1.35],
];
function tail() {
  const shape = TAIL_OUTER + " " + TAIL_INNER;
  const fill = `<path d="${shape}" fill="${C.paperHi}"/>`;
  const shade = `<path d="M126 52 C148 72 158 108 160 150 C160 182 152 200 142 206 C152 190 152 160 148 128 C144 96 136 70 122 56 Z" fill="url(#hM)" opacity="0.6"/>`;
  const stri = [
    "M138 52 C168 74 182 112 184 150",
    "M150 66 C176 92 188 128 188 168",
    "M160 104 C182 128 190 160 184 194",
  ].map((d) => P(d, { sw: 1.1, op: 0.55 })).join("");
  const tk = TAIL_TICKS.map(([x, y, a]) =>
    `<line x1="${x}" y1="${y}" x2="${(x + Math.cos(a) * 12).toFixed(1)}" y2="${(y + Math.sin(a) * 12).toFixed(1)}" stroke="${C.ink}" stroke-width="1.6" stroke-linecap="round"/>`
  ).join("");
  const outline = P(shape, { sw: 2.2 });
  return fill + shade + stri + tk + outline;
}

function bodyBase() {
  const torso = "M78 102 C58 112 52 154 60 196 C66 228 82 246 100 246 C118 246 134 228 140 196 C148 154 142 112 122 102 C112 98 90 98 78 102 Z";
  const shadow = "M78 104 C64 116 58 156 64 196 C68 224 78 238 92 244 C80 236 74 214 74 190 C74 150 76 120 90 104 Z";
  const belly = "M100 150 C114 150 122 168 120 190 C118 214 110 230 100 232 C90 230 82 214 80 190 C78 168 86 150 100 150 Z";
  return `${P(torso, { fill: C.paperHi, sw: 2 })}
    <path d="${shadow}" fill="url(#hM)" opacity="0.55"/>
    <path d="${belly}" fill="url(#stL)" opacity="0.8"/>
    ${P("M70 198 C72 220 80 234 94 240", { sw: 1.4, op: 0.45 })}
    ${P("M140 196 C138 216 130 230 116 238", { sw: 1.4, op: 0.45 })}`;
}
function waistcoat() {
  const coat = "M82 106 C72 118 70 150 74 182 C77 206 88 224 100 230 C112 224 123 206 126 182 C130 150 128 118 118 106 C110 128 100 132 100 132 C100 132 90 128 82 106 Z";
  const amber = amberPlate(`<path d="${coat}" fill="${C.amber}"/>`);
  const ink = `
    ${P("M82 106 C90 124 100 130 100 132", { sw: 2 })}
    ${P("M118 106 C110 124 100 130 100 132", { sw: 2 })}
    ${P("M100 134 L100 214", { sw: 1.3, op: 0.7 })}
    ${[150, 168, 186, 204].map((y) => `<circle cx="100" cy="${y}" r="2.6" fill="${C.ink}"/>`).join("")}
    ${P("M108 188 L120 184", { sw: 1.3, op: 0.8 })}
    ${P(coat, { sw: 2 })}`;
  return amber + ink;
}
function head(loupe: "up" | "down" = "up") {
  const crown = "M100 22 C124 20 140 34 141 56 C142 70 136 80 126 86 C120 96 108 100 100 100 C92 100 80 96 74 86 C64 80 58 70 59 56 C60 34 76 20 100 22 Z";
  const crownShadow = "M74 40 C64 52 60 70 66 84 C58 76 55 62 60 48 C63 38 68 32 74 40 Z";
  const earL = "M74 42 C64 30 58 15 67 12 C78 12 87 25 90 37 Z";
  const earR = "M126 42 C136 30 142 15 133 12 C122 12 113 25 110 37 Z";
  const earLin = "M75 38 C69 30 66 20 71 18 C78 19 83 27 85 35 Z";
  const earRin = "M125 38 C131 30 134 20 129 18 C122 19 117 27 115 35 Z";
  const muzzle = "M100 80 C112 80 118 89 116 96 C114 103 107 106 100 106 C93 106 86 103 84 96 C82 89 88 80 100 80 Z";
  const mouth = P("M90 99 C95 104 105 104 110 99", { sw: 1.2, op: 0.6 });
  const eyeL = `<ellipse cx="85" cy="64" rx="6.5" ry="8.5" fill="${C.ink}"/><circle cx="83" cy="61" r="1.7" fill="${C.paperHi}"/>`;
  const eyeR = `<ellipse cx="115" cy="64" rx="6.5" ry="8.5" fill="${C.ink}"/><circle cx="113" cy="61" r="1.7" fill="${C.paperHi}"/>`;
  const brows = `${P("M76 50 C82 46 90 46 95 49", { sw: 1.6 })}${P("M124 50 C118 46 110 46 105 49", { sw: 1.6 })}`;
  const nose = `<path d="M96 88 C100 86 100 86 104 88 C104 92 100 95 100 95 C100 95 96 92 96 88 Z" fill="${C.ink}"/>`;
  const teeth = `<rect x="97.5" y="101" width="5" height="5" rx="1" fill="${C.paperHi}" stroke="${C.ink}" stroke-width="0.9"/><line x1="100" y1="101" x2="100" y2="106" stroke="${C.ink}" stroke-width="0.7"/>`;
  const whisk = `${P("M84 92 C70 90 60 92 52 96", { sw: 0.9, op: 0.6 })}${P("M84 96 C70 98 62 102 56 108", { sw: 0.9, op: 0.6 })}${P("M116 92 C130 90 140 92 148 96", { sw: 0.9, op: 0.6 })}${P("M116 96 C130 98 138 102 144 108", { sw: 0.9, op: 0.6 })}`;
  const cheeks = `<circle cx="72" cy="82" r="15" fill="url(#stL)" opacity="0.9"/><circle cx="128" cy="82" r="15" fill="url(#stL)" opacity="0.9"/>`;
  const band = P("M66 46 C82 34 118 34 134 46", { sw: 2.4 });
  let lp: string;
  if (loupe === "down") {
    const cx = 115, cy = 64, r = 15;
    lp = `${amberPlate(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.amber}"/>`)}
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.paperHi}" opacity="0.35"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.ink}" stroke-width="3"/>
      <circle cx="${cx}" cy="${cy}" r="${r - 4}" fill="none" stroke="${C.ink}" stroke-width="1"/>
      ${P(`M${cx - 8} ${cy - 8} L${cx + 4} ${cy + 4}`, { sw: 1, op: 0.5 })}
      ${P(`M${cx} ${cy - r} L124 44`, { sw: 2 })}`;
  } else {
    const cx = 123, cy = 34, r = 12;
    lp = `${amberPlate(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.amber}"/>`)}
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.ink}" stroke-width="2.6"/>
      <circle cx="${cx}" cy="${cy}" r="${r - 3.5}" fill="${C.paperDeep}" stroke="${C.ink}" stroke-width="0.9"/>
      ${P(`M${cx - 4} ${cy + r} L118 46`, { sw: 2 })}`;
  }
  return `${P(crown, { fill: C.paperHi, sw: 2 })}
    <path d="${crownShadow}" fill="url(#hL)" opacity="0.8"/>
    ${P(earL, { fill: C.paperHi, sw: 2 })}${P(earR, { fill: C.paperHi, sw: 2 })}
    <path d="${earLin}" fill="url(#hM)"/><path d="${earRin}" fill="url(#hM)"/>
    ${hairs(64, 8, 4, 2.4, 4.0, 4, 5)}${hairs(136, 8, 4, -1.0, 0.7, 4, 5)}
    ${cheeks}
    ${P(muzzle, { fill: C.paperHi, sw: 1.6 })}
    ${whisk}${mouth}${nose}${teeth}
    ${eyeL}${eyeR}${brows}
    ${band}${lp}`;
}
function limb(pts: [number, number][], w = 13) {
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) d += ` L${pts[i][0]} ${pts[i][1]}`;
  return `<path d="${d}" fill="none" stroke="${C.ink}" stroke-width="${w + 3.6}" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="${d}" fill="none" stroke="${C.paperHi}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
}
function paw(x: number, y: number, r = 8) {
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="${C.paperHi}" stroke="${C.ink}" stroke-width="2"/>
    ${P(`M${x - r * 0.5} ${y + r * 0.4} L${x - r * 0.5} ${y - r * 0.2}`, { sw: 1.2, op: 0.7 })}
    ${P(`M${x} ${y + r * 0.5} L${x} ${y - r * 0.3}`, { sw: 1.2, op: 0.7 })}
    ${P(`M${x + r * 0.5} ${y + r * 0.4} L${x + r * 0.5} ${y - r * 0.2}`, { sw: 1.2, op: 0.7 })}`;
}
function feet() {
  return `<ellipse cx="86" cy="244" rx="11" ry="7" fill="${C.paperHi}" stroke="${C.ink}" stroke-width="2"/>
    <ellipse cx="114" cy="244" rx="11" ry="7" fill="${C.paperHi}" stroke="${C.ink}" stroke-width="2"/>
    ${P("M80 246 L80 240 M86 247 L86 240 M92 246 L92 241", { sw: 1, op: 0.7 })}
    ${P("M108 246 L108 240 M114 247 L114 240 M120 246 L120 241", { sw: 1, op: 0.7 })}`;
}

export type Pose = "idle" | "appraise" | "counter" | "writing" | "wave";

export function quartermaster(pose: Pose = "idle") {
  let armsFront = "", hd = "", extra = "";
  if (pose === "idle") {
    hd = head("up");
    armsFront = limb([[78, 116], [70, 150], [92, 181]]) + limb([[122, 116], [130, 150], [108, 181]]) + paw(94, 183, 8) + paw(107, 183, 8);
  } else if (pose === "appraise") {
    hd = head("down");
    armsFront = limb([[74, 122], [70, 158], [92, 186]]) + paw(94, 188) + limb([[128, 122], [132, 158], [110, 186]]) + paw(108, 188);
  } else if (pose === "counter") {
    hd = head("up");
    armsFront = limb([[74, 122], [64, 150], [86, 168]]) + paw(88, 170) + limb([[128, 122], [138, 150], [116, 168]]) + paw(114, 170);
  } else if (pose === "writing") {
    hd = head("down");
    armsFront = limb([[74, 122], [70, 158], [92, 182]]) + paw(94, 184) + limb([[128, 120], [150, 140], [132, 170]]) + paw(130, 172);
    extra = P("M132 172 L150 120", { sw: 2.4 }) + P("M150 120 L154 108", { sw: 4 }) +
      `<path d="M150 120 C158 108 156 96 150 92 C150 104 146 112 148 118 Z" fill="url(#hL)" stroke="${C.ink}" stroke-width="1.4"/>`;
  } else if (pose === "wave") {
    hd = head("up");
    armsFront = limb([[74, 122], [66, 152], [84, 178]]) + paw(86, 180) + limb([[128, 116], [150, 96], [156, 60]]) + paw(158, 54);
  }
  return tail() + bodyBase() + waistcoat() + feet() + armsFront + hd + extra;
}
