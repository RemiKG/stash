// StatusBar — the little "9:41 · signal/wifi/battery" strip, shown only inside the
// desktop phone frame (hidden on a real phone). Pure decoration, on-brand.
import { C } from "@/lib/art/kit";

export default function StatusBar() {
  return (
    <div className="statusbar">
      <span>9:41</span>
      <svg width="74" height="16" viewBox="0 0 74 16" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={i * 6} y={6 - i * 2} width="4" height={4 + i * 2} rx="1" fill={C.ink} />
        ))}
        <path d="M28 8 C31 5 36 5 39 8 M30 10 C32 8 35 8 37 10" fill="none" stroke={C.ink} strokeWidth="1.6" />
        <rect x="48" y="4" width="18" height="9" rx="2.5" fill="none" stroke={C.ink} strokeWidth="1.4" />
        <rect x="50" y="6" width="12" height="5" rx="1" fill={C.ink} />
        <rect x="67" y="6.5" width="2.4" height="4" rx="1" fill={C.ink} />
      </svg>
    </div>
  );
}
