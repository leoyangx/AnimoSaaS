import { getSettings } from '@/lib/settings-service';
import { NavigationManagement } from './NavigationManagement';

export default async function NavigationPage() {
  const settings = await getSettings();
  return <NavigationManagement initialItems={settings.navigation} />;
}
