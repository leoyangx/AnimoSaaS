import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTenantIdFromRequest } from '@/lib/tenant-context';
import { checkQuota, incrementQuota } from '@/lib/quota';
import { userCreateSchema } from '@/lib/validators';
import { errorResponse, successResponse, validationErrorResponse } from '@/lib/api-response';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const session = await getSession('admin');
    if (!session || session.role !== 'ADMIN') {
      return errorResponse('未授权访问', 401);
    }

    const tenantId = getTenantIdFromRequest(req);
    const body = await req.json();

    // Zod 输入验证
    const validationResult = userCreateSchema.safeParse(body);
    if (!validationResult.success) {
      return validationErrorResponse(validationResult.error);
    }

    const { email, password, role } = validationResult.data;

    // 配额检查
    const quotaCheck = await checkQuota(tenantId, 'users');
    if (!quotaCheck.allowed) {
      return errorResponse(quotaCheck.message || '配额已满', 403);
    }

    const existingUser = await db.users.getByEmail(email, tenantId);
    if (existingUser) {
      return errorResponse('用户已存在', 400);
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await db.users.create(tenantId, {
      email,
      password: hashedPassword,
      role: role || 'STUDENT',
    });

    // 更新配额
    await incrementQuota(tenantId, 'users');

    // Log action
    await db.logs.create('CREATE_USER', session.email, tenantId, `手动创建学员: ${email}`);

    return successResponse({ id: user.id, email: user.email, role: user.role }, '用户创建成功');
  } catch (error) {
    console.error('Create user error:', error);
    return errorResponse('创建用户失败', 500, error);
  }
}
