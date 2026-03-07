/**
 * 多租户迁移脚本
 *
 * 功能：
 * 1. 创建默认租户（slug: default）
 * 2. 将所有现有数据关联到默认租户
 * 3. 计算并更新配额使用量
 * 4. 创建超级管理员账户
 *
 * 使用方式：
 *   npx tsx scripts/migrate-to-multitenant.ts
 *
 * 前提条件：
 *   - 已运行 prisma migrate deploy 应用新 schema
 *   - DATABASE_URL 已正确配置
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEFAULT_TENANT_NAME = process.env.DEFAULT_TENANT_NAME || 'Default';
const DEFAULT_TENANT_SLUG = 'default';
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'superadmin@animosaas.com';
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'SuperAdmin123!';

async function main() {
  console.log('========================================');
  console.log('  AnimoSaaS 多租户迁移脚本');
  console.log('========================================\n');

  // 检查是否已存在默认租户（防止重复执行）
  const existingTenant = await prisma.tenant.findUnique({
    where: { slug: DEFAULT_TENANT_SLUG },
  });

  if (existingTenant) {
    console.log('⚠️  默认租户已存在，跳过创建步骤。');
    console.log(`   租户 ID: ${existingTenant.id}`);
    console.log(`   租户名称: ${existingTenant.name}`);
    await updateQuotaUsage(existingTenant.id);
    await ensureSuperAdmin();
    console.log('\n✅ 迁移完成（增量模式）');
    return;
  }

  // 步骤 1: 创建默认租户
  console.log('步骤 1/5: 创建默认租户...');
  const tenant = await prisma.tenant.create({
    data: {
      name: DEFAULT_TENANT_NAME,
      slug: DEFAULT_TENANT_SLUG,
      plan: 'enterprise', // 默认租户给予最高权限
      status: 'active',
      settings: JSON.stringify({
        isDefault: true,
        migratedAt: new Date().toISOString(),
      }),
    },
  });
  console.log(`   ✅ 默认租户已创建: ${tenant.id}`);

  // 步骤 2: 创建配额记录
  console.log('步骤 2/5: 创建配额记录...');
  await prisma.tenantQuota.create({
    data: {
      tenantId: tenant.id,
      maxUsers: 9999,
      maxStorage: BigInt(107374182400), // 100GB
      maxAssets: 99999,
    },
  });
  console.log('   ✅ 配额记录已创建');

  // 步骤 3: 迁移现有数据到默认租户
  console.log('步骤 3/5: 迁移现有数据...');
  await migrateExistingData(tenant.id);

  // 步骤 4: 计算配额使用量
  console.log('步骤 4/5: 更新配额使用量...');
  await updateQuotaUsage(tenant.id);

  // 步骤 5: 创建超级管理员
  console.log('步骤 5/5: 创建超级管理员...');
  await ensureSuperAdmin();

  console.log('\n========================================');
  console.log('  ✅ 多租户迁移完成！');
  console.log('========================================');
  console.log(`  默认租户: ${DEFAULT_TENANT_SLUG} (${tenant.id})`);
  console.log(`  超级管理员: ${SUPER_ADMIN_EMAIL}`);
  console.log('========================================\n');
}

async function migrateExistingData(tenantId: string) {
  // 迁移用户
  const userResult = await prisma.$executeRawUnsafe(
    `UPDATE "User" SET "tenantId" = $1 WHERE "tenantId" IS NULL`,
    tenantId
  );
  console.log(`   - 用户: ${userResult} 条记录已迁移`);

  // 迁移资产分类
  const categoryResult = await prisma.$executeRawUnsafe(
    `UPDATE "AssetCategory" SET "tenantId" = $1 WHERE "tenantId" IS NULL`,
    tenantId
  );
  console.log(`   - 资产分类: ${categoryResult} 条记录已迁移`);

  // 迁移资产
  const assetResult = await prisma.$executeRawUnsafe(
    `UPDATE "Asset" SET "tenantId" = $1 WHERE "tenantId" IS NULL`,
    tenantId
  );
  console.log(`   - 资产: ${assetResult} 条记录已迁移`);

  // 迁移下载日志
  const downloadLogResult = await prisma.$executeRawUnsafe(
    `UPDATE "DownloadLog" SET "tenantId" = $1 WHERE "tenantId" IS NULL`,
    tenantId
  );
  console.log(`   - 下载日志: ${downloadLogResult} 条记录已迁移`);

  // 迁移邀请码
  const codeResult = await prisma.$executeRawUnsafe(
    `UPDATE "InvitationCode" SET "tenantId" = $1 WHERE "tenantId" IS NULL`,
    tenantId
  );
  console.log(`   - 邀请码: ${codeResult} 条记录已迁移`);

  // 迁移站点配置
  const configResult = await prisma.$executeRawUnsafe(
    `UPDATE "SiteConfig" SET "tenantId" = $1 WHERE "tenantId" IS NULL`,
    tenantId
  );
  console.log(`   - 站点配置: ${configResult} 条记录已迁移`);

  // 迁移管理日志
  const logResult = await prisma.$executeRawUnsafe(
    `UPDATE "AdminLog" SET "tenantId" = $1 WHERE "tenantId" IS NULL`,
    tenantId
  );
  console.log(`   - 管理日志: ${logResult} 条记录已迁移`);

  // 迁移顶部导航
  const topNavResult = await prisma.$executeRawUnsafe(
    `UPDATE "TopNav" SET "tenantId" = $1 WHERE "tenantId" IS NULL`,
    tenantId
  );
  console.log(`   - 顶部导航: ${topNavResult} 条记录已迁移`);

  // 迁移导航
  const navResult = await prisma.$executeRawUnsafe(
    `UPDATE "Navigation" SET "tenantId" = $1 WHERE "tenantId" IS NULL`,
    tenantId
  );
  console.log(`   - 导航: ${navResult} 条记录已迁移`);

  console.log('   ✅ 所有数据已迁移到默认租户');
}

async function updateQuotaUsage(tenantId: string) {
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

  console.log(`   ✅ 配额已更新: ${userCount} 用户, ${assetCount} 资产, ${formatBytes(Number(storageSum._sum.fileSize || 0))} 存储`);
}

async function ensureSuperAdmin() {
  const existing = await prisma.superAdmin.findUnique({
    where: { email: SUPER_ADMIN_EMAIL },
  });

  if (existing) {
    console.log(`   ⚠️  超级管理员已存在: ${SUPER_ADMIN_EMAIL}`);
    return;
  }

  const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 12);
  await prisma.superAdmin.create({
    data: {
      email: SUPER_ADMIN_EMAIL,
      password: hashedPassword,
      name: 'Super Admin',
    },
  });
  console.log(`   ✅ 超级管理员已创建: ${SUPER_ADMIN_EMAIL}`);
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('\n❌ 迁移失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
