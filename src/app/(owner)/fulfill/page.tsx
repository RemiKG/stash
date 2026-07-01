import Fulfill from "@/components/screens/Fulfill";
import { currentSlug } from "@/lib/session";
import { getItems, getThreads } from "@/lib/store";
import { computeTotals } from "@/lib/shop";

export const dynamic = "force-dynamic";

export default async function FulfillPage() {
  const slug = (await currentSlug()) || "";
  const threads = slug ? await getThreads(slug) : [];
  const items = slug ? await getItems(slug) : [];
  const accepted = threads.find((t) => t.status === "accepted");
  const item = accepted ? items.find((i) => i.id === accepted.itemId) ?? null : null;
  const found = computeTotals(items, threads).found;
  return <Fulfill slug={slug} item={item} thread={accepted ?? null} foundBefore={found} />;
}
