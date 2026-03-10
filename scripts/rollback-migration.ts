/**
 * 多租户迁移回滚脚本
 *
 * 功能：
 * 在迁移失败时，清理多租户相关数据，恢复到单租户状态。
 *
 * ⚠️ 警告：此脚本会删除所有租户、配额、超级管理员、API 密钥等多租户数据。
 *          不会删除用户、资产等业务数据（仅清除 tenantId 关联）。
 *
 * 使用方式：
 *   npx tsx scripts/rollback-migration.ts
 *
 * 加 --confirm 参数跳过确认提示：
 *   npx tsx scripts/rollback-migration.ts --confirm
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('========================================');
  console.log('  AnimoSaaS 多租户迁移回滚脚本');
  console.log('========================================\n');

  const skipConfirm = process.argv.includes('--confirm');

  if (!skipConfirm) {
    console.log('⚠️  此操作将清除所有多租户相关数据：');
    console.log('   - 删除所有租户记录');
    console.log('   - 删除所有配额记录');
    console.log('   - 删除所有超级管理员');
    console.log('   - 删除所有 API 密钥');
    console.log('   - 删除所有权限和角色权限记录');
    console.log('   - 清除业务数据中的 tenantId（不删除数据本身）');
    console.log('\n   业务数据（用户、资产等）不会被删除。\n');
    console.log('   请在命令后添加 --confirm 参数确认执行。');
    console.log('   例如: npx tsx scripts/rollback-migration.ts --confirm\n');
    process.exit(0);
  }

  console.log('开始回滚...\n');

  // 步骤 1: 清除业务表中的 tenantId
  console.log('步骤 1/4: 清除业务表的租户关联...');

  const tables = [
    'User',
    'Asset',
    'AssetCategory',
    'DownloadLog',
    'InvitationCode',
    'SiteConfig',
    'AdminLog',
    'TopNav',
    'Navigation',
  ];

  for (const table of tables) {
    try {
      const count = await prisma.$executeRawUnsafe(`UPDATE "${table}" SET "tenantId" = NULL`);
      console.log(`   - ${table}: ${count} 条记录已清除 tenantId`);
    } catch (e: any) {
      console.log(`   - ${table}: 跳过 (${e.message?.substring(0, 50)}...)`);
    }
  }

  // 步骤 2: 删除 API 密钥
  console.log('\n步骤 2/4: 删除 API 密钥...');
  try {
    const apiKeyCount = await prisma.apiKey.deleteMany({});
    console.log(`   ✅ 已删除 ${apiKeyCount.count} 个 API 密钥`);
  } catch (e) {
    console.log('   ⚠️  API 密钥表不存在或已清空');
  }

  // 步骤 3: 删除权限数据
  console.log('\n步骤 3/4: 删除权限数据...');
  try {
    const rolePermCount = await prisma.rolePermission.deleteMany({});
    console.log(`   - 已删除 ${rolePermCount.count} 条角色权限`);
    const permCount = await prisma.permission.deleteMany({});
    console.log(`   - 已删除 ${permCount.count} 条权限定义`);
  } catch (e) {
    console.log('   ⚠️  权限表不存在或已清空');
  }

  // 步骤 4: 删除租户和超级管理员
  console.log('\n步骤 4/4: 删除租户和超级管理员...');
  try {
    const quotaCount = await prisma.tenantQuota.deleteMany({});
    console.log(`   - 已删除 ${quotaCount.count} 条配额记录`);
    const superAdminCount = await prisma.superAdmin.deleteMany({});
    console.log(`   - 已删除 ${superAdminCount.count} 个超级管理员`);
    const tenantCount = await prisma.tenant.deleteMany({});
    console.log(`   - 已删除 ${tenantCount.count} 个租户`);
  } catch (e) {
    console.log('   ⚠️  租户表不存在或已清空');
  }

  console.log('\n========================================');
  console.log('  ✅ 回滚完成！');
  console.log('========================================');
  console.log('  如需恢复到旧 schema，请运行：');
  console.log('  npx prisma migrate resolve --rolled-back <migration_name>');
  console.log('========================================\n');
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('\n❌ 回滚失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
