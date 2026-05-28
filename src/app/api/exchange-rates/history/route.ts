import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// POST: Guardar nuevos registros de histórico EUR/BRL
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { codigo, tipo, compra, venta } = body;

    if (!codigo || !tipo || typeof compra !== 'number' || typeof venta !== 'number') {
      return NextResponse.json(
        { error: 'Parámetros inválidos: necesita codigo, tipo, compra, venta' },
        { status: 400 }
      );
    }

    const record = await prisma.exchangeRateHistory.create({
      data: {
        codigo,
        tipo,
        compra,
        venta,
        fecha: new Date()
      }
    });

    return NextResponse.json(record);
  } catch (error: any) {
    console.error('Error al guardar histórico:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}

// GET: Traer histórico de EUR/BRL (últimos 30 días por defecto)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const codigo = searchParams.get('codigo'); // EUR o BRL
    const tipo = searchParams.get('tipo'); // oficial, blue, tarjeta
    const days = searchParams.get('days') ? parseInt(searchParams.get('days')!) : 30;

    if (!codigo) {
      return NextResponse.json(
        { error: 'Parámetro requerido: codigo (EUR o BRL)' },
        { status: 400 }
      );
    }

    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    let where: any = {
      codigo,
      fecha: { gte: dateFrom }
    };

    if (tipo) {
      where.tipo = tipo;
    }

    const history = await prisma.exchangeRateHistory.findMany({
      where,
      orderBy: { fecha: 'asc' },
      take: 500
    });

    return NextResponse.json(history);
  } catch (error: any) {
    console.error('Error al traer histórico:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}
