import { NextResponse } from 'next/server';
import { getEurBrlVariants } from '@/lib/exchange-rates';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const rates = await getEurBrlVariants();

    if (rates.length === 0) {
      return NextResponse.json(
        { error: 'No se pudieron obtener cotizaciones' },
        { status: 500 }
      );
    }

    // Guardar histórico en BD automáticamente
    const now = new Date();
    for (const rate of rates) {
      try {
        await prisma.exchangeRateHistory.create({
          data: {
            codigo: rate.codigo,
            tipo: rate.tipo,
            compra: rate.compra,
            venta: rate.venta,
            fecha: now
          }
        });
      } catch (dbError) {
        // Si falla al guardar un registro, continuar con los demás
        console.warn(`Error guardando histórico para ${rate.codigo} ${rate.tipo}:`, dbError);
      }
    }

    return NextResponse.json(rates);
  } catch (error: any) {
    console.error('Error en API exchange-rates/variants:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}
