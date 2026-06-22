// TailMark — the tail-$ brand mark. `badge` wraps it on a milled amber coin.
import { tailDollarInner, tailBadgeInner } from "@/lib/art/mark";

export default function TailMark({
  badge = false,
  className,
  size,
}: {
  badge?: boolean;
  className?: string;
  size?: number;
}) {
  const vb = badge ? "0 0 150 150" : "0 0 120 140";
  const inner = badge ? tailBadgeInner() : tailDollarInner();
  return (
    <svg
      viewBox={vb}
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Stash"
      style={{ display: "block", overflow: "visible" }}
      dangerouslySetInnerHTML={{ __html: inner }}
    />
  );
}
