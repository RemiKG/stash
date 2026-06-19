import SplitFlap from "@/components/art/SplitFlap";

export default function Stat({
  value,
  label,
  h = 30,
  invert = false,
}: {
  value: string;
  label: string;
  h?: number;
  invert?: boolean;
}) {
  return (
    <span className="stat">
      <SplitFlap value={value} h={h} invert={invert} gap={3} />
      <span className="lab">{label}</span>
    </span>
  );
}
