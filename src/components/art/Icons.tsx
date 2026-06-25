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
export const Share = (p: IP) => (
  <Ic {...p}>
    <g stroke={p.color || C.ink} strokeWidth={2} fill="none">
      <circle cx="7" cy="-7" r="3.2" />
      <circle cx="-8" cy="0" r="3.2" />
      <circle cx="7" cy="7" r="3.2" />
      <path d="M-5 -1.5 L4 -5.5 M-5 1.5 L4 5.5" />
    </g>
  </Ic>
);
export const Plus = (p: IP) => (
  <Ic {...p}>
    <path d="M0 -8 L0 8 M-8 0 L8 0" stroke={p.color || C.ink} strokeWidth={3} strokeLinecap="round" />
  </Ic>
);
export const Cam = (p: IP) => (
  <Ic {...p}>
    <g stroke={p.color || C.ink} strokeWidth={2} fill="none">
      <rect x="-11" y="-6" width="22" height="15" rx="3" />
      <path d="M-4 -6 L-2 -9 L2 -9 L4 -6" />
      <circle cx="0" cy="1.5" r="4.5" />
    </g>
  </Ic>
);
export const Bell = (p: IP) => (
  <Ic {...p}>
    <g stroke={p.color || C.ink} strokeWidth={2} fill="none">
      <path d="M-7 6 C-7 -2 -4 -8 0 -8 C4 -8 7 -2 7 6 Z" />
      <path d="M-9 6 L9 6" strokeLinecap="round" />
      <circle cx="0" cy="9.5" r="1.6" fill={p.color || C.ink} />
    </g>
  </Ic>
);
export const Lock = (p: IP) => (
  <Ic {...p}>
    <g stroke={p.color || C.ink} strokeWidth={2} fill="none">
      <rect x="-7" y="-1" width="14" height="12" rx="2" fill={C.paperDeep} />
      <path d="M-4 -1 L-4 -5 C-4 -9 4 -9 4 -5 L4 -1" />
      <circle cx="0" cy="4" r="1.6" fill={p.color || C.ink} />
    </g>
  </Ic>
);
export const Tag = (p: IP) => (
  <Ic {...p}>
    <g stroke={p.color || C.ink} strokeWidth={2} fill="none">
      <path d="M-9 -4 L0 -9 L9 -4 L9 8 L-9 8 Z" />
      <circle cx="0" cy="-2" r="2" />
    </g>
  </Ic>
);
export const SquirrelGlyph = (p: IP) => (
  <Ic {...p}>
    <g fill={p.color || C.ink}>
      <path d="M-8 -6 C-11 -12 -9 -14 -6 -12 C-6 -9 -5 -8 -4 -8 M8 -6 C11 -12 9 -14 6 -12 C6 -9 5 -8 4 -8" stroke={p.color || C.ink} strokeWidth={1.6} fill="none" />
      <path d="M0 -9 C6 -9 9 -4 9 2 C9 8 5 11 0 11 C-5 11 -9 8 -9 2 C-9 -4 -6 -9 0 -9 Z" fill={C.paperHi} stroke={p.color || C.ink} strokeWidth={1.6} />
      <circle cx="-3.5" cy="0" r="1.5" />
      <circle cx="3.5" cy="0" r="1.5" />
      <path d="M0 4 L-1.5 6 L1.5 6 Z" />
    </g>
  </Ic>
);
export const You = (p: IP) => (
  <Ic {...p}>
    <g stroke={p.color || C.ink} strokeWidth={1.6} fill={C.paperHi}>
      <circle cx="0" cy="2" r="6" />
      <path d="M-4 6 L-4 -4 M0 6 L0 -6 M4 6 L4 -3" strokeLinecap="round" />
    </g>
  </Ic>
);
export const Buyer = (p: IP) => (
  <Ic {...p}>
    <g stroke={p.color || C.ink} strokeWidth={1.6} fill={C.paperHi}>
      <circle cx="0" cy="-4" r="5" />
      <path d="M-8 10 C-8 2 8 2 8 10 Z" />
    </g>
  </Ic>
);
export const Coin = (p: IP) => (
  <Ic {...p}>
    <g>
      <circle cx="0" cy="0" r="9" fill={C.amber} stroke={p.color || C.ink} strokeWidth={1.8} />
      <path d="M0 -6 L0 6 M-3 -3.5 C-3 -6 3 -6 3 -4 C3 -1.5 -3 -1.5 -3 1 C-3 3.5 3 3.5 3 1" fill="none" stroke={C.ink} strokeWidth={1.6} strokeLinecap="round" />
    </g>
  </Ic>
);
