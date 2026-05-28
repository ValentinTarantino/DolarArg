import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Token y contraseña son obligatorios' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
    }

    const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });

    if (!resetToken) {
      return NextResponse.json({ error: 'El enlace no es válido' }, { status: 400 });
    }

    if (new Date() > resetToken.expiresAt) {
      await prisma.passwordResetToken.delete({ where: { token } });
      return NextResponse.json({ error: 'El enlace expiró. Solicitá uno nuevo.' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);

    await prisma.user.update({
      where: { email: resetToken.email },
      data: { password: hashedPassword }
    });

    await prisma.passwordResetToken.delete({ where: { token } });

    return NextResponse.json({ message: 'Contraseña actualizada con éxito. Ya podés iniciar sesión.' });
  } catch (error: any) {
    console.error('Error en reset-password:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
