import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/mail';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'El email es obligatorio' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      await prisma.passwordResetToken.deleteMany({ where: { email } });

      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

      await prisma.passwordResetToken.create({
        data: { email, token, expiresAt }
      });

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const resetUrl = `${baseUrl}?reset_token=${token}`;

      const language = request.headers.get('cookie')?.match(/(?:^|;\s*)dolararg-language=(en|es)/)?.[1] === 'en' ? 'en' : 'es';
      await sendPasswordResetEmail(email, resetUrl, language);
    }

    return NextResponse.json({
      message: 'Si ese email está registrado, recibirás un enlace para restablecer tu contraseña.'
    });
  } catch (error: any) {
    console.error('Error en forgot-password:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
