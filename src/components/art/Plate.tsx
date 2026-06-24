// Plate — the catalogue plate: a halftone object (the user's real photo, or a
// demo vector) in a double keyline frame with corner ticks + a caption/price slug.
import { objectFor, OBJ } from "@/lib/art/kit";
import WaxStamp from "./WaxStamp";

function Corners() {
  return (
    <svg className="plate-corners" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
      <g fill="none" stroke="var(--ink)" strokeWidth={1.4} vectorEffect="non-scaling-stroke">
        <path d="M0 9 L0 0 L9 0" />
        <path d="M91 0 L100 0 L100 9" />
        <path d="M0 91 L0 100 L9 100" />
        <path d="M91 100 L100 100 L100 91" />
      </g>
    </svg>
  );
}

export default function Plate({
  caption,
  price,
  sold = false,
  objName,
  src,
  className,
  style,
  soldR = 40,
}: {
  caption?: string | null;
  price?: string | null;
  sold?: boolean;
  objName?: string; // key into OBJ, or a free-text category resolved to an object
  src?: string | null; // duotone halftone image generated from the user's photo
  className?: string;
  style?: React.CSSProperties;
  soldR?: number;
}) {
  const obj = objName ? (OBJ[objName] || objectFor(objName)) : null;
  const hasSlug = caption !== undefined && caption !== null;
  return (
    <div className={`plate${className ? " " + className : ""}`} style={style}>
      <div className="plate-art">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={caption || "item"} />
        ) : obj ? (
          <svg viewBox="-78 -78 156 156" style={{ width: "100%", height: "100%", overflow: "visible" }}
            dangerouslySetInnerHTML={{ __html: obj() }} />
        ) : null}
        {sold && (
          <WaxStamp
            r={soldR}
            style={{ position: "absolute", left: "50%", top: "50%", width: soldR * 2.6, transform: "translate(-50%,-50%)" }}
          />
        )}
      </div>
      <div className="plate-inner-rule" />
      <Corners />
      {hasSlug && (
        <div className="plate-slug">
          <span className="cap">{caption}</span>
          {price != null && <span className="price">{price}</span>}
        </div>
      )}
    </div>
  );
}
