import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const daysStr = searchParams.get('days') || '30';
    const days = parseInt(daysStr, 10) || 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const casas = ['oficial', 'blue', 'bolsa', 'contadoconliqui', 'tarjeta', 'cripto', 'mayorista'];
    const nombres: Record<string, string> = {
      oficial: 'Oficial',
      blue: 'Blue',
      bolsa: 'MEP',
      contadoconliqui: 'CCL',
      tarjeta: 'Tarjeta',
      cripto: 'Cripto',
      mayorista: 'Mayorista',
    };

    const rankings = [];

    for (const casa of casas) {
      const history = await prisma.dolarRate.findMany({
        where: { casa, fecha: { gte: startDate } },
        orderBy: { fecha: 'asc' },
        select: { venta: true },
      });

      if (history.length >= 2) {
        const first = history[0].venta;
        const last = history[history.length - 1].venta;
        const variacion = ((last - first) / first) * 100;
        rankings.push({
          casa,
          nombre: nombres[casa] || casa,
          variacion: parseFloat(variacion.toFixed(2)),
          actual: last,
        });
      }
    }

    // Ordenar por variación descendente (el que más subió primero)
    rankings.sort((a, b) => b.variacion - a.variacion);

    return NextResponse.json(rankings);
  } catch (error: any) {
    console.error('Error en API ranking:', error);
    return NextResponse.json({ error: 'Error interno', details: error.message }, { status: 500 });
  }
}
