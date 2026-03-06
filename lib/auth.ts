import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required. Please set it in your .env file.');
}

export async function createToken(payload: any) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export async function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return null;
  }
}

export async function getSession(type: 'user' | 'admin' = 'user') {
  const cookieStore = await cookies();
  const cookieName = type === 'admin' ? 'admin_token' : 'auth_token';
  const token = cookieStore.get(cookieName)?.value;
  if (!token) return null;
  return verifyToken(token);
}
