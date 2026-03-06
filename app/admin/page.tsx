import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import AdminSidebar from './AdminSidebar';
import AdminDashboard from './AdminDashboard';

export default async function AdminHomePage() {
  const session = await getSession('admin');
  if (!session || (session as any).role !== 'admin') redirect('/admin/login');

  const users = await db.users.getAll();
  const assets = await db.assets.getAll();
  const codes = await db.codes.getAll();
  const config = await db.config.get();
  const logs = await db.logs.getAll(10);
  const downloadLogs = await db.assets.getDownloadLogs(7);

  // Calculate actual total downloads
  const totalDownloads = assets.reduce((sum, asset) => sum + (asset.downloadCount || 0), 0);

  // Construct chart data (last 7 days)
  const chartData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });

    // Start of current processing day
    const startOfDay = new Date(d);
    startOfDay.setHours(0, 0, 0, 0);
    // End of current processing day
    const endOfDay = new Date(d);
    endOfDay.setHours(23, 59, 59, 999);

    const dayUsers = users.filter(
      (u: any) => u.createdAt >= startOfDay && u.createdAt <= endOfDay
    ).length;
    const dayDownloads = downloadLogs.filter(
      (log: any) => log.createdAt >= startOfDay && log.createdAt <= endOfDay
    ).length;

    chartData.push({
      name: dateStr,
      downloads: dayDownloads,
      users: dayUsers,
    });
  }

  const stats = {
    totalUsers: users.length,
    totalAssets: assets.length,
    totalDownloads: totalDownloads,
    unusedCodes: codes.filter((c) => c.status === 'unused').length,
  };

  return (
    <div className="min-h-screen bg-bg-dark flex">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <AdminDashboard
          stats={stats}
          users={JSON.parse(JSON.stringify(users))}
          codes={JSON.parse(JSON.stringify(codes))}
          config={JSON.parse(JSON.stringify(config))}
          chartData={chartData}
          adminLogs={JSON.parse(JSON.stringify(logs))}
        />
      </main>
    </div>
  );
}
