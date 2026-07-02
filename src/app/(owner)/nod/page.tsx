import Gate1 from "@/components/screens/Gate1";
import { currentSlug } from "@/lib/session";
import { getItems } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function NodPage() {
  const slug = (await currentSlug()) || "";
  const items = slug ? await getItems(slug) : [];
  const pending = items.filter((i) => i.status === "appraised" && !i.prohibited).sort((a, b) => a.createdAt - b.createdAt);
  const listedExists = items.some((i) => i.status === "listed" || i.status === "sold");
  return <Gate1 slug={slug} items={pending} listedExists={listedExists} />;
}
