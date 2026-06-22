// WaxStamp — the amber "SOLD" seal. A satisfying thunk, never an alarm.
import { waxStampSVG } from "@/lib/art/kit";

export default function WaxStamp({
  text = "SOLD",
  r = 52,
  rot = -12,
  className,
  style,
}: {
  text?: string;
  r?: number;
  rot?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const pad = 10;
  const box = (r + pad) * 2;
  return (
    <svg
      viewBox={`${-(r + pad)} ${-(r + pad)} ${box} ${box}`}
      className={className}
      role="img"
      aria-label={text}
      style={{ display: "block", overflow: "visible", ...style }}
      dangerouslySetInnerHTML={{ __html: waxStampSVG(text, r, rot) }}
    />
  );
}
