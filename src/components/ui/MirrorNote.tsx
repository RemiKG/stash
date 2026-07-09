// MirrorNote — a thin honest strip shown only on the stateless hosted mirror
// (serverless instances don't share a disk). Points at the primary stateful
// deployment before anyone hits the seam.
import { isStatelessMirror, primaryUrl } from "@/lib/config";

export default function MirrorNote() {
  if (!isStatelessMirror()) return null;
  const primary = primaryUrl();
  return (
    <div className="mirror-note">
      hosted mirror — uploads may not persist here ·{" "}
      <a href={primary}>full stateful demo →</a>
    </div>
  );
}
