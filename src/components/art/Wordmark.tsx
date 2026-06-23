// Wordmark — "St(a)sh" with the coin-`a`. Built from HTML + an inline SVG coin so
// it adapts to the slab font's real metrics (no hardcoded advances) and the coin
// always lands cleanly between the letters. Amber underline swoosh below.
import { C, inkwork } from "@/lib/art/kit";
import { coinWith } from "@/lib/art/mark";

function coinInner() {
  const a = `<text x="50" y="54" font-family="Rokkitt, Rockwell, Georgia, serif" font-weight="800" font-size="58" fill="${C.ink}" text-anchor="middle" dominant-baseline="central">a</text>`;
  return inkwork(coinWith(50, 50, 40, a), "lite");
}

export default function Wordmark({
  size = 30,
  underline = true,
  className,
  style,
}: {
  size?: number;
  underline?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const coin = size * 0.7;
  return (
    <span
      className={className}
      style={{ position: "relative", display: "inline-block", ...style }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          fontFamily: "var(--slab)",
          fontWeight: 800,
          fontSize: size,
          lineHeight: 1,
          color: "var(--ink)",
          letterSpacing: "-0.005em",
        }}
      >
        <span>St</span>
        <span
          style={{
            display: "inline-block",
            width: coin,
            height: coin,
            margin: `0 ${size * 0.015}px`,
            transform: `translateY(${size * 0.05}px)`,
          }}
        >
          <svg
            viewBox="0 0 100 100"
            width={coin}
            height={coin}
            style={{ display: "block", overflow: "visible" }}
            dangerouslySetInnerHTML={{ __html: coinInner() }}
          />
        </span>
        <span>sh</span>
      </span>
      {underline && (
        <svg
          viewBox="0 0 100 12"
          preserveAspectRatio="none"
          aria-hidden
          style={{
            position: "absolute",
            left: `-${size * 0.03}px`,
            right: `-${size * 0.03}px`,
            width: `calc(100% + ${size * 0.06}px)`,
            bottom: `-${size * 0.05}px`,
            height: size * 0.32,
            overflow: "visible",
          }}
        >
          <path
            d="M2 7 C 33 13, 60 1, 98 6"
            stroke={C.amber}
            strokeWidth={Math.max(3, size * 0.085)}
            fill="none"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            style={{ mixBlendMode: "multiply" }}
          />
        </svg>
      )}
    </span>
  );
}
