import Haggle from "@/components/screens/Haggle";
import { currentSlug } from "@/lib/session";
import { getItems, getThreads } from "@/lib/store";
import type { Item, Thread } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HagglePage() {
  const slug = (await currentSlug()) || "";
  const threads = slug ? await getThreads(slug) : [];
  const items = slug ? await getItems(slug) : [];
  const map = new Map(items.map((i) => [i.id, i]));
  const active = threads
    .filter((t) => t.status === "open")
    .map((t) => ({ thread: t, item: map.get(t.itemId) as Item }))
    .filter((x) => x.item);
  return <Haggle slug={slug} deals={active as { thread: Thread; item: Item }[]} />;
}
