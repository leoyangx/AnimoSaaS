import { successResponse, errorResponse } from '@/lib/api-response';
import { checkAlerts } from '@/lib/alerts';

export const dynamic = 'force-dynamic';

/**
 * GET /api/superadmin/alerts — 获取活跃告警列表
 */
export async function GET() {
  try {
    const alerts = await checkAlerts();

    return successResponse({
      alerts,
      total: alerts.length,
      critical: alerts.filter((a) => a.severity === 'critical').length,
      warning: alerts.filter((a) => a.severity === 'warning').length,
      info: alerts.filter((a) => a.severity === 'info').length,
    });
  } catch (e) {
    console.error('Alerts check error:', e);
    return errorResponse('获取告警信息失败', 500, e);
  }
}
