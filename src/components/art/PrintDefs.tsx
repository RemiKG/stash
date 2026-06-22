// PrintDefs — the print system's filters + patterns (from kit.mjs `defs()`),
// injected ONCE in the document so any <svg> can reference them by id
// (url(#wob), url(#hM), url(#htAmber), ...). SVG id references are document-scoped.
import { C } from "@/lib/art/kit";

const SEED = 7;

export default function PrintDefs() {
  return (
    <svg
      aria-hidden
      width="0"
      height="0"
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
    >
      <defs>
        {/* hand-cut wobble for linework groups */}
        <filter id="wob" x="-6%" y="-6%" width="112%" height="112%">
          <feTurbulence type="fractalNoise" baseFrequency="0.028 0.036" numOctaves={2} seed={SEED + 3} result="t" />
          <feDisplacementMap in="SourceGraphic" in2="t" scale="1.7" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="wobHard" x="-8%" y="-8%" width="116%" height="116%">
          <feTurbulence type="fractalNoise" baseFrequency="0.05 0.06" numOctaves={2} seed={SEED + 5} result="t" />
          <feDisplacementMap in="SourceGraphic" in2="t" scale="2.6" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="wobLite" x="-4%" y="-4%" width="108%" height="108%">
          <feTurbulence type="fractalNoise" baseFrequency="0.02 0.024" numOctaves={2} seed={SEED + 7} result="t" />
          <feDisplacementMap in="SourceGraphic" in2="t" scale="0.9" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="rough" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves={2} seed={SEED + 11} result="t" />
          <feDisplacementMap in="SourceGraphic" in2="t" scale="3.4" xChannelSelector="R" yChannelSelector="G" />
        </filter>

        {/* cross-hatch tone (one ink; density = spacing) */}
        <pattern id="hL" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="7" stroke={C.ink} strokeWidth="0.8" />
        </pattern>
        <pattern id="hM" width="4.5" height="4.5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="4.5" stroke={C.ink} strokeWidth="0.85" />
        </pattern>
        <pattern id="hD" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="4" stroke={C.ink} strokeWidth="0.9" />
          <line x1="0" y1="0" x2="4" y2="0" stroke={C.ink} strokeWidth="0.9" />
        </pattern>
        <pattern id="hXX" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="3" stroke={C.ink} strokeWidth="0.95" />
          <line x1="0" y1="0" x2="3" y2="0" stroke={C.ink} strokeWidth="0.95" />
        </pattern>

        {/* stipple */}
        <pattern id="stL" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="0.55" fill={C.ink} />
          <circle cx="4.5" cy="4.5" r="0.55" fill={C.ink} />
        </pattern>
        <pattern id="stM" width="4.5" height="4.5" patternUnits="userSpaceOnUse">
          <circle cx="1.2" cy="1.2" r="0.7" fill={C.ink} />
          <circle cx="3.4" cy="3.4" r="0.7" fill={C.ink} />
        </pattern>
        <pattern id="stD" width="3.6" height="3.6" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.9" fill={C.ink} />
          <circle cx="2.8" cy="2.8" r="0.9" fill={C.ink} />
        </pattern>

        {/* halftone screens for catalogue plates (tone via dot radius) */}
        <pattern id="htA" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="2.5" cy="2.5" r="0.8" fill={C.ink} /></pattern>
        <pattern id="htB" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="2.5" cy="2.5" r="1.5" fill={C.ink} /></pattern>
        <pattern id="htC" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="2.5" cy="2.5" r="2.1" fill={C.ink} /></pattern>
        <pattern id="htAmber" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="2.5" cy="2.5" r="1.5" fill={C.amber} /></pattern>
      </defs>
    </svg>
  );
}
