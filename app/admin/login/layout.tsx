import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

export default async function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  // If already authenticated as admin, redirect to dashboard
  const session = await getSession('admin');
  if (session && session.role === 'ADMIN') {
    redirect('/admin');
  }

  return <>{children}</>;
}
