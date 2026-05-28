import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const casa = searchParams.get('type') || 'blue';
    const daysStr = searchParams.get('days') || '30';
    const days = parseInt(daysStr, 10) || 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Obtener cotizaciones del tipo seleccionado en el rango de días
    const history = await prisma.dolarRate.findMany({
      where: {
        casa: casa,
        fecha: {
          gte: startDate
        }
      },
      orderBy: {
        fecha: 'asc'
      },
      select: {
        compra: true,
        venta: true,
        fecha: true
      }
    });

    // Agrupar por día tomando el último registro de cada día
    const byDay = new Map<string, { compra: number; venta: number; fecha: Date }>();
    for (const item of history) {
      const dayKey = new Date(item.fecha).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      byDay.set(dayKey, item);
    }

    const formattedHistory = Array.from(byDay.values()).map((item) => ({
      compra: item.compra,
      venta: item.venta,
      fecha: item.fecha,
      fechaFormateada: new Date(item.fecha).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit'
      })
    }));

    return NextResponse.json(formattedHistory);
  } catch (error: any) {
    console.error('Error en API history:', error);
    return NextResponse.json({ error: 'Error interno del servidor', details: error.message }, { status: 500 });
  }
}
