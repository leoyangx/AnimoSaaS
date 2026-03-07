import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTenantIdFromRequest } from '@/lib/tenant-context';
import { decrementQuota } from '@/lib/quota';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession('admin');
  if (!session || (session as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const tenantId = getTenantIdFromRequest(req);
  const { disabled, password } = await req.json();

  const updateData: any = {};
  if (disabled !== undefined) updateData.disabled = disabled;
  if (password) {
    const bcrypt = await import('bcryptjs');
    updateData.password = await bcrypt.hash(password, 10);
  }

  await db.users.update(id, updateData);

  // Log action
  const action = password ? 'CHANGE_PASSWORD' : 'TOGGLE_USER_STATUS';
  const details = password
    ? `修改学员 ID: ${id} 的密码`
    : `修改学员 ID: ${id} 的状态为: ${disabled ? '禁用' : '启用'}`;
  await db.logs.create(action, (session as any).email, tenantId, details);

  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession('admin');
  if (!session || (session as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const tenantId = getTenantIdFromRequest(req);
  await db.users.delete(id);

  // 更新配额
  await decrementQuota(tenantId, 'users');

  // Log action
  await db.logs.create('DELETE_USER', (session as any).email, tenantId, `删除学员 ID: ${id}`);

  return NextResponse.json({ success: true });
}
