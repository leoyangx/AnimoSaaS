import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorResponse, successResponse } from '@/lib/api-response';

// 获取所有租户列表
export async function GET() {
  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        quota: true,
        _count: {
          select: {
            users: true,
            assets: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = tenants.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      plan: t.plan,
      status: t.status,
      domain: t.domain,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      userCount: t._count.users,
      assetCount: t._count.assets,
      quota: t.quota
        ? {
            maxUsers: t.quota.maxUsers,
            maxAssets: t.quota.maxAssets,
            maxStorage: Number(t.quota.maxStorage),
            usedUsers: t.quota.usedUsers,
            usedAssets: t.quota.usedAssets,
            usedStorage: Number(t.quota.usedStorage),
          }
        : null,
    }));

    return successResponse(data);
  } catch (e) {
    console.error('Get tenants error:', e);
    return errorResponse('获取租户列表失败', 500, e);
  }
}

// 创建新租户
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, slug, plan, domain, maxUsers, maxAssets, maxStorage } = body;

    if (!name || !slug) {
      return errorResponse('租户名称和标识符不能为空', 400);
    }

    // 验证 slug 格式
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return errorResponse('标识符只能包含小写字母、数字和连字符', 400);
    }

    // 检查 slug 唯一性
    const existing = await prisma.tenant.findUnique({ where: { slug } });
    if (existing) {
      return errorResponse('该标识符已被使用', 400);
    }

    // 检查域名唯一性
    if (domain) {
      const existingDomain = await prisma.tenant.findUnique({ where: { domain } });
      if (existingDomain) {
        return errorResponse('该域名已被使用', 400);
      }
    }

    // 创建租户和配额
    const tenant = await prisma.tenant.create({
      data: {
        name,
        slug,
        plan: plan || 'free',
        domain: domain || null,
        quota: {
          create: {
            maxUsers: maxUsers || 10,
            maxAssets: maxAssets || 100,
            maxStorage: BigInt(maxStorage || 1073741824), // 默认 1GB
          },
        },
      },
      include: { quota: true },
    });

    // 创建默认站点配置
    await prisma.siteConfig.create({
      data: {
        tenantId: tenant.id,
        title: name,
        slogan: `${name} - 素材管理系统`,
        footer: `© ${new Date().getFullYear()} ${name}. All Rights Reserved.`,
      },
    });

    return successResponse(
      {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan,
      },
      '租户创建成功'
    );
  } catch (e) {
    console.error('Create tenant error:', e);
    return errorResponse('创建租户失败', 500, e);
  }
}
