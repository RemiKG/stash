import StandingOrders from "@/components/screens/StandingOrders";
import { currentSlug } from "@/lib/session";
import { getSettings } from "@/lib/store";
import { DEFAULT_SETTINGS } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const slug = (await currentSlug()) || "";
  const settings = slug ? await getSettings(slug) : DEFAULT_SETTINGS;
  return <StandingOrders initialSlug={slug} initial={settings} />;
}
