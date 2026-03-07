import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorResponse, successResponse } from '@/lib/api-response';
import { clearTenantCache } from '@/lib/tenant';
import { recalculateQuota } from '@/lib/quota';

// 获取单个租户详情
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        quota: true,
        _count: {
          select: {
            users: true,
            assets: true,
            downloadLogs: true,
            invitationCodes: true,
            apiKeys: true,
          },
        },
      },
    });

    if (!tenant) {
      return errorResponse('租户不存在', 404);
    }

    // 获取管理员列表
    const admins = await prisma.user.findMany({
      where: { tenantId: id, role: 'admin' },
      select: { id: true, email: true, lastLogin: true, createdAt: true },
    });

    // 最近活动
    const recentLogs = await prisma.adminLog.findMany({
      where: { tenantId: id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return successResponse({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      plan: tenant.plan,
      status: tenant.status,
      domain: tenant.domain,
      settings: tenant.settings,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
      counts: tenant._count,
      quota: tenant.quota
        ? {
            maxUsers: tenant.quota.maxUsers,
            maxAssets: tenant.quota.maxAssets,
            maxStorage: Number(tenant.quota.maxStorage),
            usedUsers: tenant.quota.usedUsers,
            usedAssets: tenant.quota.usedAssets,
            usedStorage: Number(tenant.quota.usedStorage),
          }
        : null,
      admins,
      recentLogs: recentLogs.map((l) => ({
        id: l.id,
        action: l.action,
        adminEmail: l.adminEmail,
        details: l.details,
        createdAt: l.createdAt,
      })),
    });
  } catch (e) {
    console.error('Get tenant detail error:', e);
    return errorResponse('获取租户详情失败', 500, e);
  }
}

// 更新租户信息
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const tenant = await prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      return errorResponse('租户不存在', 404);
    }

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.plan !== undefined) updateData.plan = body.plan;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.domain !== undefined) updateData.domain = body.domain || null;
    if (body.settings !== undefined) updateData.settings = body.settings;

    // 更新租户
    const updated = await prisma.tenant.update({
      where: { id },
      data: updateData,
    });

    // 更新配额
    if (body.maxUsers !== undefined || body.maxAssets !== undefined || body.maxStorage !== undefined) {
      const quotaUpdate: any = {};
      if (body.maxUsers !== undefined) quotaUpdate.maxUsers = body.maxUsers;
      if (body.maxAssets !== undefined) quotaUpdate.maxAssets = body.maxAssets;
      if (body.maxStorage !== undefined) quotaUpdate.maxStorage = BigInt(body.maxStorage);

      await prisma.tenantQuota.upsert({
        where: { tenantId: id },
        update: quotaUpdate,
        create: {
          tenantId: id,
          ...quotaUpdate,
        },
      });
    }

    // 如果请求重新计算配额
    if (body.recalculateQuota) {
      await recalculateQuota(id);
    }

    // 清除缓存
    clearTenantCache(tenant.slug);
    if (updated.slug !== tenant.slug) {
      clearTenantCache(updated.slug);
    }

    return successResponse({ id: updated.id, slug: updated.slug }, '租户更新成功');
  } catch (e) {
    console.error('Update tenant error:', e);
    return errorResponse('更新租户失败', 500, e);
  }
}

// 删除租户（软删除 — 设置 status 为 deleted）
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const tenant = await prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      return errorResponse('租户不存在', 404);
    }

    // 防止删除默认租户
    if (tenant.slug === 'default') {
      return errorResponse('不能删除默认租户', 400);
    }

    await prisma.tenant.update({
      where: { id },
      data: { status: 'deleted' },
    });

    clearTenantCache(tenant.slug);

    return successResponse({ id }, '租户已删除');
  } catch (e) {
    console.error('Delete tenant error:', e);
    return errorResponse('删除租户失败', 500, e);
  }
}
