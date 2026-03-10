import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import BannerManager from './BannerManager';

export default async function BannersPage() {
  const session = await getSession('admin');
  if (!session || session.role !== 'ADMIN') {
    redirect('/admin/login');
  }

  const rawBanners = await db.banners.getAll(session.tenantId!);
  const banners = rawBanners.map((b) => ({
    ...b,
    link: b.link ?? undefined,
    linkText: b.linkText ?? undefined,
  }));

  return <BannerManager initialBanners={banners} />;
}
