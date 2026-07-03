import Link from "next/link";
import { notFound } from "next/navigation";
import Wordmark from "@/components/art/Wordmark";
import Mascot from "@/components/art/Mascot";
import Plate from "@/components/art/Plate";
import SplitFlap from "@/components/art/SplitFlap";
import OfferBox from "@/components/screens/OfferBox";
import ShopOwnerTools from "@/components/screens/ShopOwnerTools";
import { shopView, shelfItems } from "@/lib/shop";
import { getSettings } from "@/lib/store";
import { ensureDemo, DEMO_SLUG } from "@/lib/seed";
import { isOwner } from "@/lib/session";
import { money } from "@/lib/utils";

export const dynamic = "force-dynamic";

const AWNING = Array.from({ length: 26 });

export default async function ShopPage({
  params, searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ item?: string }>;
}) {
  const { slug } = await params;
  const { item: itemParam } = await searchParams;
  if (slug === DEMO_SLUG) await ensureDemo();

  const view = await shopView(slug);
  if (!view) notFound();
  const settings = await getSettings(slug);
  const owner = await isOwner(slug);

  const shelf = shelfItems(view.items);
  const openThread = view.threads.find((t) => t.status === "open");
  const featured =
    (itemParam && shelf.find((i) => i.id === itemParam)) ||
    (openThread && shelf.find((i) => i.id === openThread.itemId && i.status === "listed")) ||
    shelf.find((i) => i.status === "listed") ||
    shelf[0] ||
    null;
  const rest = shelf.filter((i) => i.id !== featured?.id);
  const rows: typeof rest[] = [];
  for (let i = 0; i < rest.length; i += 3) rows.push(rest.slice(i, i + 3));

  return (
    <main className="shopfront">
      <div className="awning-bar" />
      <div className="awning">
        {AWNING.map((_, i) => (
          <div key={i} className={`awning-seg ${i % 2 === 0 ? "amber" : "cream"}`} />
        ))}
      </div>

      <header className="shop-header">
        <Wordmark size={52} />
        <span className="muted" style={{ fontSize: 18 }}>{view.shop.blurb}</span>
        <div className="shop-stats">
          {settings.showFound && (
            <span className="stat"><SplitFlap value={money(view.totals.found)} h={44} invert /><span className="lab">found</span></span>
          )}
          <span className="stat"><SplitFlap value={String(shelf.length)} h={44} /><span className="lab">items</span></span>
          <div style={{ width: 108, flex: "none", alignSelf: "flex-start", marginTop: -18 }}>
            <Mascot pose="wave" title="the Quartermaster" />
          </div>
        </div>
      </header>

      {view.shop.isDemo && (
        <div style={{ marginTop: 6 }}><span className="demo-banner">🐿 Demo shop — a curated pile. Numbers are illustrative; the real path is your own upload.</span></div>
      )}
      {owner && (
        <div style={{ marginTop: 10 }}><ShopOwnerTools slug={slug} item={featured} /></div>
      )}

      <hr className="hr" style={{ margin: "14px 0 0" }} />

      <div className="shop-grid">
        <div className="col" style={{ gap: 18 }}>
          {featured ? (
            <>
              <Plate
                src={featured.plateSrc}
                objName={featured.plateSrc ? undefined : featured.title}
                caption={featured.title}
                price={money(featured.price)}
                sold={featured.status === "sold"}
                soldR={64}
                style={{ height: 300 }}
              />
              {featured.status === "listed" && <OfferBox slug={slug} itemId={featured.id} />}
            </>
          ) : (
            <p className="muted">The shelves are still filling.</p>
          )}
        </div>

        <div className="col" style={{ gap: 0 }}>
          {rows.map((row, ri) => (
            <div key={ri}>
              <div className="shelf">
                {row.map((it) => (
                  <Link key={it.id} href={`/s/${slug}?item=${it.id}`} style={{ textDecoration: "none" }}>
                    <Plate
                      src={it.plateSrc}
                      objName={it.plateSrc ? undefined : it.title}
                      caption={it.title}
                      price={money(it.price)}
                      sold={it.status === "sold"}
                      soldR={38}
                      style={{ height: 210 }}
                    />
                  </Link>
                ))}
              </div>
              <div className="shelf-plank" />
            </div>
          ))}
          {!rest.length && <p className="faint">More on the shelf soon.</p>}
        </div>
      </div>

      <hr className="hr" style={{ marginTop: 10 }} />
      <div className="row between wrap" style={{ padding: "18px 0 0", gap: 12 }}>
        <span className="muted" style={{ fontSize: 15 }}>Run by a squirrel on Qwen Cloud. Every closet is a shop that never opened.</span>
        <span className="muted" style={{ fontSize: 14 }}>
          MIT · open source · <Link href="/intake" style={{ color: "inherit" }}>make your own shop →</Link>
        </span>
      </div>
    </main>
  );
}
