import { getSettings } from '@/lib/settings-service';
import { SecuritySettingsForm } from './SecuritySettingsForm';

export default async function SecuritySettingsPage() {
  const settings = await getSettings();
  return <SecuritySettingsForm initialConfig={settings.security} />;
}
