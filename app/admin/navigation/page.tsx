import { db } from '@/lib/db';
import { NavigationManagement } from './NavigationManagement';

export default async function NavigationPage() {
  const items = await db.navigation.getAll();
  return <NavigationManagement initialItems={JSON.parse(JSON.stringify(items))} />;
}
