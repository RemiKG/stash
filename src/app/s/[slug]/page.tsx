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
