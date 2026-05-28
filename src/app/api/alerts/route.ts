import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { sendAlertEmail } from '@/lib/mail';

function getUserIdFromRequest(request: NextRequest): number | null {
  const token = request.cookies.get('token')?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  return payload ? payload.userId : null;
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const alerts = await prisma.alert.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(alerts);
  } catch (error) {
    console.error('Error al obtener alertas:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { casa, condition, value } = await request.json();

    if (!casa || !condition || !value) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    if (condition !== 'ABOVE' && condition !== 'BELOW') {
      return NextResponse.json({ error: 'Condición inválida' }, { status: 400 });
    }

    const normalizedValue = typeof value === 'string'
      ? value.includes(',')
        ? value.replace(/\./g, '').replace(',', '.')  // formato argentino: 1.500,50 → 1500.50
        : value.replace(/,/g, '')                      // formato inglés: 1482.90 → 1482.90 (sin cambios)
      : value;
    const numericValue = parseFloat(normalizedValue);
    if (isNaN(numericValue) || numericValue <= 0) {
      return NextResponse.json({ error: 'El valor debe ser un número positivo' }, { status: 400 });
    }

    // Obtener la cotización actual para esa casa en la base de datos
    const latestRate = await prisma.dolarRate.findFirst({
      where: { casa },
      orderBy: { fecha: 'desc' }
    });

    let isTriggered = false;
    if (latestRate) {
      const price = latestRate.venta;
      isTriggered =
        (condition === 'ABOVE' && price >= numericValue) ||
        (condition === 'BELOW' && price <= numericValue);
      
      if (isTriggered) {
        console.log(`[ALERTA INMEDIATA] Alerta creada ya cumple la condición. Dólar ${casa} está a $${price} (${condition} $${numericValue})`);
      }
    }

    const alert = await prisma.alert.create({
      data: {
        userId,
        casa,
        condition,
        value: numericValue,
        isTriggered
      }
    });

    // Si se disparó de forma inmediata, enviamos el correo electrónico
    if (isTriggered && latestRate) {
      // Buscar el correo del usuario para enviarle la alerta
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });
      if (user?.email) {
        try {
          await sendAlertEmail(user.email, casa, latestRate.venta, condition, numericValue);
        } catch (emailError) {
          console.error(`Error enviando email para nueva alerta:`, emailError);
        }
      }
    }

    return NextResponse.json(alert, { status: 201 });
  } catch (error) {
    console.error('Error al crear alerta:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const idStr = searchParams.get('id');
    if (!idStr) {
      return NextResponse.json({ error: 'ID de alerta es obligatorio' }, { status: 400 });
    }

    const alertId = parseInt(idStr, 10);
    if (isNaN(alertId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    // Verificar propiedad antes de borrar
    const alert = await prisma.alert.findUnique({
      where: { id: alertId }
    });

    if (!alert) {
      return NextResponse.json({ error: 'Alerta no encontrada' }, { status: 404 });
    }

    if (alert.userId !== userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    await prisma.alert.delete({
      where: { id: alertId }
    });

    return NextResponse.json({ message: 'Alerta eliminada con éxito' });
  } catch (error) {
    console.error('Error al borrar alerta:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
