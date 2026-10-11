import { NextRequest, NextResponse } from 'next/server';

const ARGENTINADATOS_URL = 'https://api.argentinadatos.com/v1/cotizaciones/dolares';
const DOLARAPI_URL = 'https://dolarapi.com/v1/dolares';

const nombres: Record<string, string> = {
  oficial: 'Oficial',
  blue: 'Blue',
  bolsa: 'MEP',
  contadoconliqui: 'CCL',
  tarjeta: 'Tarjeta',
  cripto: 'Cripto',
  mayorista: 'Mayorista',
};

const casas = ['oficial', 'blue', 'bolsa', 'contadoconliqui', 'tarjeta', 'cripto', 'mayorista'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const daysStr = searchParams.get('days') || '1';
    const days = parseInt(daysStr, 10) || 1;

    // Fetch real historical data from argentinadatos.com and current from dolarapi in parallel
    const [histRes, currentRes] = await Promise.all([
      fetch(ARGENTINADATOS_URL, { cache: 'no-store', next: { revalidate: 0 } }),
      fetch(DOLARAPI_URL, { cache: 'no-store', next: { revalidate: 0 } }),
    ]);

    if (!histRes.ok) {
      throw new Error(`ArgentinaDatos error: ${histRes.status}`);
    }

    const allHistory: { casa: string; compra: number; venta: number; fecha: string }[] = await histRes.json();
    const currentRates: { casa: string; compra: number; venta: number }[] = currentRes.ok
      ? await currentRes.json()
      : [];

    // Determine the cutoff date for the period
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().slice(0, 10); // "YYYY-MM-DD"

    const rankings = [];

    for (const casa of casas) {
      // All records for this casa within the requested period, sorted ascending
      const history = allHistory
        .filter((r) => r.casa === casa && r.fecha >= cutoffStr)
        .sort((a, b) => a.fecha.localeCompare(b.fecha));

      // Current price: prefer live dolarapi, fall back to latest historical
      const currentRate = currentRates.find((r) => r.casa === casa);
      const currentVenta = currentRate?.venta ?? history[history.length - 1]?.venta;

      // Reference price: earliest record in the period (= price at start of window)
      const refVenta = history[0]?.venta;

      if (currentVenta != null && refVenta != null && refVenta !== 0) {
        const variacion = ((currentVenta - refVenta) / refVenta) * 100;
        rankings.push({
          casa,
          nombre: nombres[casa] || casa,
          variacion: parseFloat(variacion.toFixed(2)),
          actual: currentVenta,
        });
      } else if (currentVenta != null) {
        // No historical reference available — return 0 variation but real price
        rankings.push({
          casa,
          nombre: nombres[casa] || casa,
          variacion: 0,
          actual: currentVenta,
        });
      }
    }

    // Sort by variation descending (biggest winners first)
    rankings.sort((a, b) => b.variacion - a.variacion);

    return NextResponse.json(rankings);
  } catch (error: any) {
    console.error('Error en API ranking:', error);
    // Fallback: return empty so UI keeps whatever it had
    return NextResponse.json([], { status: 200 });
  }
}
