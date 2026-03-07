/**
 * API Key 管理工具库
 *
 * 功能：生成密钥、哈希存储、验证密钥、权限检查
 * 密钥格式：ak_<32位随机hex>
 * 存储方式：SHA-256 哈希（数据库只存哈希，完整密钥仅创建时展示一次）
 */

import crypto from 'crypto';
import { prisma } from './prisma';

// ============================================================
// 可用权限定义
// ============================================================

export const API_PERMISSIONS = {
  'assets:read': '读取资产列表和详情',
  'assets:write': '创建和更新资产',
  'assets:delete': '删除资产',
  'categories:read': '读取分类信息',
  'categories:write': '创建和更新分类',
  'users:read': '读取用户列表',
  'download:read': '下载资产文件',
  'logs:read': '读取下载日志',
} as const;

export type ApiPermission = keyof typeof API_PERMISSIONS;

// ============================================================
// 密钥生成与哈希
// ============================================================

/**
 * 生成新的 API Key
 * 返回完整密钥（仅此一次可见）和前缀
 */
export function generateApiKey(): { fullKey: string; prefix: string } {
  const randomPart = crypto.randomBytes(32).toString('hex');
  const fullKey = `ak_${randomPart}`;
  const prefix = `ak_${randomPart.substring(0, 8)}...`;
  return { fullKey, prefix };
}

/**
 * 将 API Key 转为 SHA-256 哈希
 */
export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

// ============================================================
// 数据库操作
// ============================================================

/**
 * 创建 API Key 记录
 */
export async function createApiKey(params: {
  tenantId: string;
  name: string;
  permissions: string[];
  expiresAt?: Date | null;
  createdById?: string;
}) {
  const { fullKey, prefix } = generateApiKey();
  const keyHash = hashApiKey(fullKey);

  const apiKey = await prisma.apiKey.create({
    data: {
      name: params.name,
      keyHash,
      keyPrefix: prefix,
      permissions: params.permissions,
      tenantId: params.tenantId,
      createdById: params.createdById || null,
      expiresAt: params.expiresAt || null,
    },
  });

  return {
    id: apiKey.id,
    name: apiKey.name,
    fullKey, // 仅创建时返回，之后不可再获取
    prefix: apiKey.keyPrefix,
    permissions: apiKey.permissions,
    expiresAt: apiKey.expiresAt,
    createdAt: apiKey.createdAt,
  };
}

/**
 * 通过 API Key 字符串验证并获取对应记录
 * 返回 null 表示无效或已禁用
 */
export async function verifyApiKey(key: string) {
  const keyHash = hashApiKey(key);

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
  });

  if (!apiKey) return null;
  if (!apiKey.isActive) return null;
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null;

  // 更新最后使用时间（异步，不阻塞）
  prisma.apiKey
    .update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    })
    .catch(() => {});

  return apiKey;
}

/**
 * 检查 API Key 是否拥有指定权限
 */
export function checkApiKeyPermission(
  keyPermissions: string[],
  requiredPermission: ApiPermission
): boolean {
  // 通配符：如有 assets:* 则匹配 assets:read, assets:write 等
  const [scope] = requiredPermission.split(':');
  if (keyPermissions.includes(`${scope}:*`)) return true;
  // 全局通配符
  if (keyPermissions.includes('*')) return true;
  return keyPermissions.includes(requiredPermission);
}

/**
 * 列出租户的所有 API Key（不含哈希）
 */
export async function listApiKeys(tenantId: string) {
  return prisma.apiKey.findMany({
    where: { tenantId },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      permissions: true,
      isActive: true,
      lastUsedAt: true,
      expiresAt: true,
      createdById: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * 更新 API Key
 */
export async function updateApiKey(
  id: string,
  tenantId: string,
  data: { name?: string; permissions?: string[]; isActive?: boolean; expiresAt?: Date | null }
) {
  return prisma.apiKey.update({
    where: { id },
    data: {
      ...data,
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.permissions !== undefined ? { permissions: data.permissions } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      ...(data.expiresAt !== undefined ? { expiresAt: data.expiresAt } : {}),
    },
  });
}

/**
 * 删除 API Key
 */
export async function deleteApiKey(id: string, tenantId: string) {
  return prisma.apiKey.delete({
    where: { id },
  });
}

/**
 * 获取单个 API Key 详情（校验租户归属）
 */
export async function getApiKey(id: string, tenantId: string) {
  return prisma.apiKey.findFirst({
    where: { id, tenantId },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      permissions: true,
      isActive: true,
      lastUsedAt: true,
      expiresAt: true,
      createdById: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}
