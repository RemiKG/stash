import Bench from "@/components/screens/Bench";
import { currentSlug } from "@/lib/session";
import { getItems } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function BenchPage({ searchParams }: { searchParams: Promise<{ slug?: string }> }) {
  const sp = await searchParams;
  const slug = sp.slug || (await currentSlug());
  const items = slug ? await getItems(slug) : [];
  const pending = items
    .filter((i) => ["draft", "identifying", "appraised"].includes(i.status))
    .sort((a, b) => a.createdAt - b.createdAt);
  return <Bench slug={slug || ""} initial={pending} />;
}
