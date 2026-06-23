// Mascot — the Quartermaster, five poses, one body.
import { quartermaster, type Pose } from "@/lib/art/mascot";

export default function Mascot({
  pose = "idle",
  className,
  flip = false,
  title,
}: {
  pose?: Pose;
  className?: string;
  flip?: boolean;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 220 306"
      className={className}
      role="img"
      aria-label={title || `the Quartermaster (${pose})`}
      style={{ display: "block", overflow: "visible" }}
    >
      <g
        filter="url(#wob)"
        transform={flip ? "translate(220 0) scale(-1 1)" : undefined}
        dangerouslySetInnerHTML={{ __html: quartermaster(pose) }}
      />
    </svg>
  );
}
