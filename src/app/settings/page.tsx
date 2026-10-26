import { getSettings } from "@/lib/services";
import { SettingsForm } from "@/components/settings/SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getSettings();
  return <SettingsForm settings={JSON.parse(JSON.stringify(settings))} />;
}
