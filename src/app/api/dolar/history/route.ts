import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const ARGENTINADATOS_BASE = 'https://api.argentinadatos.com/v1/cotizaciones/dolares';

const casaToEndpoint: Record<string, string> = {
  oficial: 'oficial',
  blue: 'blue',
  bolsa: 'bolsa',
  contadoconliqui: 'contadoconliqui',
  tarjeta: 'tarjeta',
  cripto: 'cripto',
  mayorista: 'mayorista',
};

function normalizeFromArgentinadatos(
  records: Array<{ compra: number; venta: number; fecha: string }>,
  cutoffDate: Date
) {
  return records
    .filter((r) => new Date(r.fecha) >= cutoffDate)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map((r) => ({
      compra: Number(r.compra),
      venta: Number(r.venta),
      fecha: new Date(r.fecha),
      fechaFormateada: new Date(r.fecha).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
      }),
    }));
}

function normalizeFromDb(records: Array<{ compra: number; venta: number; fecha: Date }>) {
  const byDay = new Map<string, { compra: number; venta: number; fecha: Date }>();
  for (const item of records) {
    const key = new Date(item.fecha).toISOString().slice(0, 10);
    byDay.set(key, item);
  }
  return Array.from(byDay.values())
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
    .map((item) => ({
      compra: Number(item.compra),
      venta: Number(item.venta),
      fecha: item.fecha,
      fechaFormateada: new Date(item.fecha).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
      }),
    }));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const casa = searchParams.get('type') || 'blue';
  const daysStr = searchParams.get('days') || '30';
  const days = parseInt(daysStr, 10) || 30;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  // 1. Primary: argentinadatos.com — real one-record-per-day historical data
  try {
    const endpoint = casaToEndpoint[casa] ?? casa;
    const res = await fetch(`${ARGENTINADATOS_BASE}/${endpoint}`, {
      cache: 'no-store',
      next: { revalidate: 0 },
    });

    if (res.ok) {
      const raw: Array<{ casa: string; compra: number; venta: number; fecha: string }> = await res.json();
      const formatted = normalizeFromArgentinadatos(raw, cutoffDate);
      if (formatted.length >= 2) {
        return NextResponse.json(formatted);
      }
    }
  } catch (e) {
    console.warn(`[HISTORY] ArgentinaDatos falló para ${casa}:`, e);
  }

  // 2. Fallback: local DB (deduplicated by day)
  try {
    const history = await prisma.dolarRate.findMany({
      where: { casa, fecha: { gte: cutoffDate } },
      orderBy: { fecha: 'asc' },
      select: { compra: true, venta: true, fecha: true },
    });
    const formatted = normalizeFromDb(history);
    if (formatted.length >= 2) {
      console.warn(`[HISTORY] Usando DB como respaldo para ${casa}.`);
      return NextResponse.json(formatted);
    }
  } catch (dbError) {
    console.error('[HISTORY] Error leyendo DB:', dbError);
  }

  // 3. Last resort: two identical points using the current live price
  try {
    const dolarRes = await fetch('https://dolarapi.com/v1/dolares', { cache: 'no-store' });
    if (dolarRes.ok) {
      const rates = await dolarRes.json();
      const current = rates.find((r: any) => r.casa === casa);
      if (current) {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        return NextResponse.json([
          {
            compra: current.compra,
            venta: current.venta,
            fecha: yesterday,
            fechaFormateada: yesterday.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }),
          },
          {
            compra: current.compra,
            venta: current.venta,
            fecha: today,
            fechaFormateada: today.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }),
          },
        ]);
      }
    }
  } catch (e) {
    console.error('[HISTORY] Error en último fallback:', e);
  }

  return NextResponse.json({ error: 'No se pudo cargar el historial' }, { status: 503 });
}
