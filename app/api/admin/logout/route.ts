import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();

    // 删除 admin_token cookie
    cookieStore.delete('admin_token');

    return NextResponse.json({ success: true, message: '退出登录成功' });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: '退出登录失败' },
      { status: 500 }
    );
  }
}
