import Link from "next/link";
import Mascot from "@/components/art/Mascot";
import Stat from "@/components/ui/Stat";
import { Cam, Bell } from "@/components/art/Icons";
import { currentSlug } from "@/lib/session";
import { shopView } from "@/lib/shop";
import { money } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Home() {
  const slug = await currentSlug();
  const view = slug ? await shopView(slug) : null;
  const hasItems = !!view && view.items.length > 0;
  const t = view?.totals;
  const pending = t?.pendingOffers ?? 0;

  return (
    <div className="screen">
      <div style={{ display: "flex", justifyContent: "center", marginTop: 6 }}>
        <Mascot pose="idle" title="the Quartermaster" />
      </div>
      <style>{`.screen > div:first-child svg { width: 156px; height: auto; }`}</style>

      <div>
        <p className="slabel">Your shop, so far</p>
        <div className="row" style={{ gap: 26, marginTop: 10, alignItems: "flex-end" }}>
          <Stat value={hasItems ? money(t!.found) : "$—"} label="found" />
          <Stat value={hasItems ? String(t!.listed) : "—"} label="listed" />
          <Stat value={hasItems ? String(t!.sold) : "—"} label="sold" />
        </div>
      </div>
      <hr className="hr" />

      {hasItems ? (
        <h2 style={{ textAlign: "center", fontFamily: "var(--book)", fontWeight: 700, fontSize: 21, lineHeight: 1.25, margin: "2px 0" }}>
          Every closet is a shop<br />that never opened.
        </h2>
      ) : (
        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontFamily: "var(--book)", fontWeight: 700, fontSize: 22, margin: "2px 0" }}>How much is your closet worth?</h2>
          <p className="muted" style={{ margin: "6px 0 0", fontSize: 14 }}>Point your phone at a pile. I&rsquo;ll do the rest. — the Quartermaster.</p>
        </div>
      )}

      <Link href="/intake" className="btn btn-wax" style={{ marginTop: 6 }}>
        <Cam size={24} /> Point at your pile
      </Link>
      <p className="muted" style={{ textAlign: "center", fontSize: 13, margin: 0 }}>
        point your phone at a pile — I&rsquo;ll do the rest.
      </p>

      {pending > 0 && (
        <Link href="/haggle" className="card" style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 14, textDecoration: "none" }}>
          <span style={{ position: "relative", display: "inline-flex" }}>
            <Bell size={26} />
            <span className="chip amber" style={{ position: "absolute", top: -8, left: 14, height: 18, minWidth: 18, padding: "0 5px", fontFamily: "var(--mono)", justifyContent: "center" }}>{pending}</span>
          </span>
          <span>
            <div style={{ fontFamily: "var(--book)", fontWeight: 700 }}>{pending} {pending === 1 ? "buyer" : "buyers"} waiting at the counter</div>
            <div className="muted" style={{ fontSize: 12 }}>tap to take a look →</div>
          </span>
        </Link>
      )}

      {!hasItems && (
        <Link href="/s/demo-drawer" className="demo-banner" style={{ alignSelf: "center", textDecoration: "none" }}>
          🐿 See a live demo shop →
        </Link>
      )}

      <div className="grow" />
      <hr className="hr" />
      <div style={{ textAlign: "center" }}>
        {slug ? (
          <Link href={`/s/${slug}`} className="mono muted" style={{ fontSize: 14, textDecoration: "none" }}>stash.shop/{slug}</Link>
        ) : (
          <span className="mono faint" style={{ fontSize: 13 }}>your shop opens when you point at a pile</span>
        )}
        <div className="faint" style={{ fontSize: 11.5, marginTop: 4 }}>
          <Link href={slug ? `/s/${slug}` : "/s/demo-drawer"} style={{ textDecoration: "none", color: "inherit" }}>your live shop</Link>
          {" · "}
          <Link href="/ledger" style={{ textDecoration: "none", color: "inherit" }}>Ledger</Link>
          {" · "}
          <Link href="/settings" style={{ textDecoration: "none", color: "inherit" }}>Standing Orders</Link>
        </div>
      </div>
    </div>
  );
}
