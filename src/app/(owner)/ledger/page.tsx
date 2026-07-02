import Ledger from "@/components/screens/Ledger";
import { currentSlug } from "@/lib/session";
import { readLedger } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function LedgerPage() {
  const slug = (await currentSlug()) || "";
  const entries = slug ? await readLedger(slug) : [];
  return <Ledger slug={slug} entries={entries.slice().reverse()} />;
}
