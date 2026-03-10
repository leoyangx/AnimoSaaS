import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { errorResponse, successResponse, validationErrorResponse } from '@/lib/api-response';
import { userCreateSchema } from '@/lib/validators';

/**
 * POST /api/superadmin/tenants/[id]/admins
 * Create a new admin user for the specified tenant
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: tenantId } = await params;
    const body = await req.json();

    // Force role to ADMIN
    const input = { ...body, role: 'ADMIN' };

    const validationResult = userCreateSchema.safeParse(input);
    if (!validationResult.success) {
      return validationErrorResponse(validationResult.error);
    }

    const { email, password } = validationResult.data;

    // Verify tenant exists
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      return errorResponse('租户不存在', 404);
    }

    // Check for duplicate email within tenant
    const existing = await prisma.user.findUnique({
      where: { tenantId_email: { tenantId, email } },
    });
    if (existing) {
      return errorResponse('该邮箱已被使用', 400);
    }

    // Check quota
    const quota = await prisma.tenantQuota.findUnique({ where: { tenantId } });
    if (quota) {
      const currentCount = await prisma.user.count({
        where: { tenantId, deletedAt: null },
      });
      if (currentCount >= quota.maxUsers) {
        return errorResponse('已达到用户数量上限', 400);
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'ADMIN',
        tenantId,
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return successResponse(admin, '管理员创建成功');
  } catch (e) {
    console.error('Create tenant admin error:', e);
    return errorResponse('创建管理员失败', 500, e);
  }
}
