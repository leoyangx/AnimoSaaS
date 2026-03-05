import { getSettings } from '@/lib/settings-service';
import { BrandSettingsForm } from './BrandSettingsForm';

export default async function BrandSettingsPage() {
  const settings = await getSettings();
  return <BrandSettingsForm initialConfig={settings.system} />;
}
