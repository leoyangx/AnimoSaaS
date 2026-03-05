import { getSettings } from '@/lib/settings-service';
import { StorageSettingsForm } from './StorageSettingsForm';

export default async function StorageSettingsPage() {
  const settings = await getSettings();
  return <StorageSettingsForm initialConfig={settings.storage} />;
}
