import { prisma } from '@/lib/prisma';
import { errorResponse, successResponse } from '@/lib/api-response';

/**
 * GET /api/superadmin/users
 * 获取所有租户的用户列表
 */
export async function GET(req: Request) {
  try {
    const users = await prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        email: true,
        role: true,
        disabled: true,
        tenantId: true,
        lastLogin: true,
        createdAt: true,
        tenant: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedUsers = users.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      disabled: u.disabled,
      tenantId: u.tenantId,
      tenantName: u.tenant.name,
      tenantSlug: u.tenant.slug,
      lastLogin: u.lastLogin,
      createdAt: u.createdAt,
    }));

    return successResponse(formattedUsers);
  } catch (e) {
    console.error('Get all users error:', e);
    return errorResponse('获取用户列表失败', 500, e);
  }
}
