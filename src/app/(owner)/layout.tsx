// Owner app shell — phone-first; a warm ink bezel on desktop, exactly like the
// design renders. The public shop (/s/[slug]) lives outside this group.
import StatusBar from "@/components/ui/StatusBar";
import AppBar from "@/components/ui/AppBar";
import MirrorNote from "@/components/ui/MirrorNote";

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="owner-stage">
      <div className="phone-shell">
        <StatusBar />
        <div className="phone-scroll">
          <MirrorNote />
          <AppBar />
          {children}
        </div>
      </div>
    </div>
  );
}
