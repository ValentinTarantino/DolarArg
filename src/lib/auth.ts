import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET: string = process.env.JWT_SECRET ?? '';
if (!JWT_SECRET) throw new Error('JWT_SECRET no está definido (ver .env / variables de entorno)');

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: { userId: number; email: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): { userId: number; email: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
  } catch {
    return null;
  }
}
