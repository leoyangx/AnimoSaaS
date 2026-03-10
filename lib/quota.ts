/**
 * 配额管理工具
 *
 * 提供租户配额的检查和更新功能。
 * 用于在创建/删除用户、资产等操作前后进行配额管理。
 */

import { prisma } from './prisma';

export type QuotaType = 'users' | 'assets' | 'storage';

export interface QuotaCheckResult {
  allowed: boolean;
  current: number;
  max: number;
  message?: string;
}

/**
 * 检查租户是否有足够的配额
 */
export async function checkQuota(
  tenantId: string,
  type: QuotaType,
  increment: number = 1
): Promise<QuotaCheckResult> {
  const quota = await prisma.tenantQuota.findUnique({
    where: { tenantId },
  });

  if (!quota) {
    return { allowed: false, current: 0, max: 0, message: '租户配额未配置' };
  }

  switch (type) {
    case 'users': {
      const allowed = quota.usedUsers + increment <= quota.maxUsers;
      return {
        allowed,
        current: quota.usedUsers,
        max: quota.maxUsers,
        message: allowed ? undefined : `用户数已达上限 (${quota.usedUsers}/${quota.maxUsers})`,
      };
    }
    case 'assets': {
      const allowed = quota.usedAssets + increment <= quota.maxAssets;
      return {
        allowed,
        current: quota.usedAssets,
        max: quota.maxAssets,
        message: allowed ? undefined : `资产数已达上限 (${quota.usedAssets}/${quota.maxAssets})`,
      };
    }
    case 'storage': {
      const usedStorage = Number(quota.usedStorage);
      const maxStorage = Number(quota.maxStorage);
      const allowed = usedStorage + increment <= maxStorage;
      return {
        allowed,
        current: usedStorage,
        max: maxStorage,
        message: allowed
          ? undefined
          : `存储空间已达上限 (${formatBytes(usedStorage)}/${formatBytes(maxStorage)})`,
      };
    }
  }
}

/**
 * 增加配额使用量
 */
export async function incrementQuota(
  tenantId: string,
  type: QuotaType,
  amount: number = 1
): Promise<void> {
  switch (type) {
    case 'users':
      await prisma.tenantQuota.update({
        where: { tenantId },
        data: { usedUsers: { increment: amount } },
      });
      break;
    case 'assets':
      await prisma.tenantQuota.update({
        where: { tenantId },
        data: { usedAssets: { increment: amount } },
      });
      break;
    case 'storage':
      await prisma.tenantQuota.update({
        where: { tenantId },
        data: { usedStorage: { increment: amount } },
      });
      break;
  }
}

/**
 * 减少配额使用量
 */
export async function decrementQuota(
  tenantId: string,
  type: QuotaType,
  amount: number = 1
): Promise<void> {
  switch (type) {
    case 'users':
      await prisma.tenantQuota.update({
        where: { tenantId },
        data: { usedUsers: { decrement: amount } },
      });
      break;
    case 'assets':
      await prisma.tenantQuota.update({
        where: { tenantId },
        data: { usedAssets: { decrement: amount } },
      });
      break;
    case 'storage':
      await prisma.tenantQuota.update({
        where: { tenantId },
        data: { usedStorage: { decrement: amount } },
      });
      break;
  }
}

/**
 * 重新计算租户的配额使用量（同步修正）
 */
export async function recalculateQuota(tenantId: string): Promise<void> {
  const [userCount, assetCount, storageSum] = await Promise.all([
    prisma.user.count({ where: { tenantId, deletedAt: null } }),
    prisma.asset.count({ where: { tenantId, deletedAt: null } }),
    prisma.asset.aggregate({
      where: { tenantId, deletedAt: null },
      _sum: { fileSize: true },
    }),
  ]);

  await prisma.tenantQuota.update({
    where: { tenantId },
    data: {
      usedUsers: userCount,
      usedAssets: assetCount,
      usedStorage: storageSum._sum.fileSize || BigInt(0),
    },
  });
}

/**
 * 获取租户配额信息
 */
export async function getQuotaInfo(tenantId: string) {
  const quota = await prisma.tenantQuota.findUnique({
    where: { tenantId },
  });

  if (!quota) return null;

  return {
    users: { used: quota.usedUsers, max: quota.maxUsers },
    assets: { used: quota.usedAssets, max: quota.maxAssets },
    storage: {
      used: Number(quota.usedStorage),
      max: Number(quota.maxStorage),
      usedFormatted: formatBytes(Number(quota.usedStorage)),
      maxFormatted: formatBytes(Number(quota.maxStorage)),
    },
  };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
