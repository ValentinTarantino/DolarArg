import { NextResponse } from 'next/server';
import { getEurBrlRates } from '@/lib/exchange-rates';

export async function GET() {
  try {
    const rates = await getEurBrlRates();

    if (rates.length === 0) {
      return NextResponse.json(
        { error: 'No se pudieron obtener cotizaciones' },
        { status: 500 }
      );
    }

    return NextResponse.json(rates);
  } catch (error: any) {
    console.error('Error en API exchange-rates:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}
