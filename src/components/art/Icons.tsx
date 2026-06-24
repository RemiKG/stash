// Icons — inked, hand-cut glyphs (never emoji/Material), ported from ui.mjs `ic`.
// Each is drawn centred at (0,0); the wrapper gives a -14..14 viewBox.
import { C } from "@/lib/art/kit";

type IP = { size?: number; color?: string; className?: string; style?: React.CSSProperties };

function Ic({ size = 22, className, style, children }: IP & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="-14 -14 28 28"
      width={size}
      height={size}
      className={className}
      style={{ display: "block", overflow: "visible", ...style }}
      aria-hidden
    >
      {children}
    </svg>
  );
}

export const Check = (p: IP) => (
  <Ic {...p}>
    <path d="M-7 0 L-2 6 L8 -7" fill="none" stroke={p.color || C.ink} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
  </Ic>
);
export const Cross = (p: IP) => (
  <Ic {...p}>
    <path d="M-6 -6 L6 6 M6 -6 L-6 6" fill="none" stroke={p.color || C.ink} strokeWidth={3} strokeLinecap="round" />
  </Ic>
);
export const Pencil = (p: IP) => (
  <Ic {...p}>
    <g stroke={p.color || C.ink} strokeWidth={2.2} fill="none" strokeLinejoin="round">
      <path d="M-7 7 L-9 11 L-5 9 Z" fill={p.color || C.ink} />
      <path d="M-6 8 L6 -4 L9 -1 L-3 11 Z" />
      <path d="M4 -6 L7 -3" />
    </g>
  </Ic>
);
export const Copy = (p: IP) => (
  <Ic {...p}>
    <g stroke={p.color || C.ink} strokeWidth={2} fill="none">
      <rect x="-8" y="-6" width="11" height="13" rx="2" />
      <rect x="-3" y="-10" width="11" height="13" rx="2" fill={C.paperHi} />
    </g>
  </Ic>
);
export const Loupe = (p: IP) => (
  <Ic {...p}>
    <g stroke={p.color || C.ink} strokeWidth={2.2} fill="none">
      <circle cx="-3" cy="-3" r="7" />
      <path d="M3 3 L9 9" strokeLinecap="round" />
    </g>
  </Ic>
);
export const Gear = (p: IP) => (
  <Ic {...p}>
    <g>
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <line key={i} x1={Math.cos(a) * 6} y1={Math.sin(a) * 6} x2={Math.cos(a) * 10} y2={Math.sin(a) * 10} stroke={p.color || C.ink} strokeWidth={2.4} strokeLinecap="round" />
        );
      })}
      <circle cx="0" cy="0" r="5.5" fill="none" stroke={p.color || C.ink} strokeWidth={2.2} />
    </g>
  </Ic>
);
export const Book = (p: IP) => (
  <Ic {...p}>
    <g stroke={p.color || C.ink} strokeWidth={2} fill="none">
      <path d="M-9 -8 L0 -6 L9 -8 L9 8 L0 10 L-9 8 Z" />
      <path d="M0 -6 L0 10" />
    </g>
  </Ic>
);
