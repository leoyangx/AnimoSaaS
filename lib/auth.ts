import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required. Please set it in your .env file.');
}

export async function createToken(payload: any) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export async function createSuperAdminToken(payload: { id: string; email: string }) {
  return jwt.sign({ ...payload, role: 'superadmin' }, JWT_SECRET, { expiresIn: '24h' });
}

export async function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return null;
  }
}

export async function getSession(type: 'user' | 'admin' | 'superadmin' = 'user') {
  const cookieStore = await cookies();

  if (type === 'superadmin') {
    const token = cookieStore.get('superadmin_token')?.value;
    if (!token) return null;
    const session = await verifyToken(token);
    if (!session || (session as any).role !== 'superadmin') return null;
    return session;
  }

  const cookieName = type === 'admin' ? 'admin_token' : 'auth_token';
  const token = cookieStore.get(cookieName)?.value;
  if (!token) return null;
  return verifyToken(token);
}
