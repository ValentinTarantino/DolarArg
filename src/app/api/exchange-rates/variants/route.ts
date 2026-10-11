import { NextResponse } from 'next/server';
import { getEurBrlVariants } from '@/lib/exchange-rates';
import { saveChangedExchangeRates } from '@/lib/rate-history';

export async function GET() {
  try {
    const rates = await getEurBrlVariants();

    if (rates.length === 0) {
      return NextResponse.json(
        { error: 'No se pudieron obtener cotizaciones' },
        { status: 500 }
      );
    }

    try {
      const savedCount = await saveChangedExchangeRates(rates);
      console.log(`[EXCHANGE RATES] Se guardaron ${savedCount} cotizaciones con cambios`);
    } catch (dbError) {
      // The live rates are still useful if optional history storage fails.
      console.warn('Error guardando historico EUR/BRL:', dbError);
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
