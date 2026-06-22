"use client";
// SplitFlap — every live number, on mechanical flap tiles. Cream (default) or ink
// (invert = the hero live figures). Flips the changed tiles when the value updates.
import { useEffect, useRef, useState } from "react";

const isSym = (c: string) => /[^0-9]/.test(c);

export default function SplitFlap({
  value,
  invert = false,
  h = 32,
  gap = 4,
  className,
  style,
  ariaLabel,
}: {
  value: string | number;
  invert?: boolean;
  h?: number;
  gap?: number;
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
}) {
  const str = String(value);
  const chars = [...str];
  const prev = useRef(str);
  const [flip, setFlip] = useState<boolean[]>([]);

  useEffect(() => {
    if (prev.current !== str) {
      const p = [...prev.current];
      setFlip(chars.map((c, i) => c !== p[i]));
      prev.current = str;
      const t = setTimeout(() => setFlip([]), 220);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [str]);

  const fs = Math.round(h * 0.6);
  return (
    <span
      className={`flap${invert ? " invert" : ""}${className ? " " + className : ""}`}
      style={{ gap, ...style }}
      role="img"
      aria-label={ariaLabel || str}
    >
      {chars.map((c, i) => {
        const w = isSym(c) ? Math.round(h * 0.52) : Math.round(h * 0.72);
        return (
          <span
            key={i}
            className={`flap-cell${isSym(c) ? " sym" : ""}${flip[i] ? " flipping" : ""}`}
            style={{ width: w, height: h, fontSize: fs }}
          >
            {c}
          </span>
        );
      })}
    </span>
  );
}
