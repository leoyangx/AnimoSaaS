import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

export default async function SuperAdminLoginLayout({ children }: { children: React.ReactNode }) {
  // If already authenticated as superadmin, redirect to dashboard
  const session = await getSession('superadmin');
  if (session && session.role === 'superadmin') {
    redirect('/superadmin');
  }

  return <>{children}</>;
}
