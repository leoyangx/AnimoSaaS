/**
 * 告警规则系统
 *
 * 定义告警条件，检查系统状态，生成告警列表
 */

import { prisma } from './prisma';
import { getRequestStats, getSystemInfo, createLogger } from './logger';

const log = createLogger('alerts');

export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface Alert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  category: string;
  timestamp: string;
  meta?: Record<string, any>;
}

/**
 * 检查所有告警规则，返回活跃告警列表
 */
export async function checkAlerts(): Promise<Alert[]> {
  const alerts: Alert[] = [];
  const now = new Date().toISOString();

  // 1. 内存使用检查
  const sysInfo = getSystemInfo();
  if (sysInfo.memory.heapUsed > sysInfo.memory.heapTotal * 0.9) {
    alerts.push({
      id: 'mem-critical',
      severity: 'critical',
      title: '内存使用率过高',
      message: `堆内存使用 ${sysInfo.memory.heapUsed}MB / ${sysInfo.memory.heapTotal}MB (>90%)`,
      category: 'system',
      timestamp: now,
      meta: sysInfo.memory,
    });
  } else if (sysInfo.memory.heapUsed > sysInfo.memory.heapTotal * 0.7) {
    alerts.push({
      id: 'mem-warning',
      severity: 'warning',
      title: '内存使用率较高',
      message: `堆内存使用 ${sysInfo.memory.heapUsed}MB / ${sysInfo.memory.heapTotal}MB (>70%)`,
      category: 'system',
      timestamp: now,
      meta: sysInfo.memory,
    });
  }

  // 2. 错误率检查
  const reqStats = getRequestStats();
  const errorRateNum = reqStats.total > 0 ? (reqStats.errors / reqStats.total) * 100 : 0;
  if (reqStats.total > 100 && errorRateNum > 10) {
    alerts.push({
      id: 'error-rate-critical',
      severity: 'critical',
      title: '错误率过高',
      message: `请求错误率 ${errorRateNum.toFixed(1)}% (${reqStats.errors}/${reqStats.total})`,
      category: 'api',
      timestamp: now,
      meta: { errorRate: errorRateNum, total: reqStats.total, errors: reqStats.errors },
    });
  } else if (reqStats.total > 50 && errorRateNum > 5) {
    alerts.push({
      id: 'error-rate-warning',
      severity: 'warning',
      title: '错误率偏高',
      message: `请求错误率 ${errorRateNum.toFixed(1)}% (${reqStats.errors}/${reqStats.total})`,
      category: 'api',
      timestamp: now,
    });
  }

  // 3. 数据库连接检查
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (e) {
    alerts.push({
      id: 'db-disconnected',
      severity: 'critical',
      title: '数据库连接异常',
      message: e instanceof Error ? e.message : '数据库连接失败',
      category: 'database',
      timestamp: now,
    });
  }

  // 4. 租户配额告警
  try {
    const quotas = await prisma.tenantQuota.findMany({
      include: { tenant: { select: { name: true, slug: true } } },
    });

    for (const q of quotas) {
      // 用户配额
      if (q.maxUsers > 0 && q.usedUsers / q.maxUsers > 0.9) {
        alerts.push({
          id: `quota-users-${q.tenantId}`,
          severity: q.usedUsers >= q.maxUsers ? 'critical' : 'warning',
          title: `租户 ${q.tenant.name} 用户配额不足`,
          message: `用户 ${q.usedUsers}/${q.maxUsers} (${Math.round((q.usedUsers / q.maxUsers) * 100)}%)`,
          category: 'quota',
          timestamp: now,
          meta: { tenant: q.tenant.slug, used: q.usedUsers, max: q.maxUsers },
        });
      }

      // 资产配额
      if (q.maxAssets > 0 && q.usedAssets / q.maxAssets > 0.9) {
        alerts.push({
          id: `quota-assets-${q.tenantId}`,
          severity: q.usedAssets >= q.maxAssets ? 'critical' : 'warning',
          title: `租户 ${q.tenant.name} 资产配额不足`,
          message: `资产 ${q.usedAssets}/${q.maxAssets} (${Math.round((q.usedAssets / q.maxAssets) * 100)}%)`,
          category: 'quota',
          timestamp: now,
          meta: { tenant: q.tenant.slug, used: q.usedAssets, max: q.maxAssets },
        });
      }

      // 存储配额
      const usedStorage = Number(q.usedStorage);
      const maxStorage = Number(q.maxStorage);
      if (maxStorage > 0 && usedStorage / maxStorage > 0.9) {
        alerts.push({
          id: `quota-storage-${q.tenantId}`,
          severity: usedStorage >= maxStorage ? 'critical' : 'warning',
          title: `租户 ${q.tenant.name} 存储空间不足`,
          message: `存储 ${formatBytes(usedStorage)}/${formatBytes(maxStorage)} (${Math.round((usedStorage / maxStorage) * 100)}%)`,
          category: 'quota',
          timestamp: now,
          meta: { tenant: q.tenant.slug, used: usedStorage, max: maxStorage },
        });
      }
    }
  } catch (e) {
    log.warn('配额告警检查失败', { error: e instanceof Error ? e.message : String(e) });
  }

  // 5. 停用租户检查
  try {
    const suspendedCount = await prisma.tenant.count({ where: { status: 'suspended' } });
    if (suspendedCount > 0) {
      alerts.push({
        id: 'suspended-tenants',
        severity: 'info',
        title: '存在停用租户',
        message: `${suspendedCount} 个租户处于停用状态`,
        category: 'tenant',
        timestamp: now,
        meta: { count: suspendedCount },
      });
    }
  } catch {
    // ignore
  }

  // 按严重度排序
  const severityOrder: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 };
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return alerts;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
