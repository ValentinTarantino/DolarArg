import { NextResponse } from 'next/server';

/**
 * API de Bandas Cambiarias del BCRA
 * 
 * El 11 de abril de 2025, el BCRA estableció las bandas cambiarias con:
 *   - Piso inicial: $1.000
 *   - Techo inicial: $1.400
 *   - Deslizamiento mensual: 1% (hasta diciembre 2025)
 *   - Desde 2026: se ajusta por IPC del INDEC con 2 meses de rezago
 * 
 * Aproximamos el ajuste 2026 con un 2.5% mensual (promedio IPC aproximado)
 * Los valores exactos de hoy se pueden corroborar en bcra.gob.ar
 */

const BAND_ORIGIN_DATE = new Date('2025-04-11');
const INITIAL_LOWER = 1000;
const INITIAL_UPPER = 1400;

// Monthly crawling rates by period
// 2025: 1% mensual fijo
// 2026+: estimado con base en IPC (ajustamos manualmente cuando hay datos)
const CRAWLING_RATE_2025 = 0.01; // 1% mensual fijo
const CRAWLING_RATE_2026 = 0.028; // ~2.8% mensual (promedio IPC feb/mar 2026 c/rezago T-2)

function calculateBands(referenceDate: Date): { lower: number; upper: number } {
  const origin = BAND_ORIGIN_DATE;
  
  let lower = INITIAL_LOWER;
  let upper = INITIAL_UPPER;
  
  // Iterate month by month from April 2025 to now
  let cursor = new Date(origin);
  
  while (cursor < referenceDate) {
    const year = cursor.getFullYear();
    const rate = year >= 2026 ? CRAWLING_RATE_2026 : CRAWLING_RATE_2025;
    
    lower = lower * (1 + rate);
    upper = upper * (1 + rate);
    
    // Advance one month
    cursor.setMonth(cursor.getMonth() + 1);
  }
  
  return { lower, upper };
}

export async function GET() {
  try {
    const today = new Date();
    const { lower, upper } = calculateBands(today);
    
    return NextResponse.json({
      lower: parseFloat(lower.toFixed(2)),
      upper: parseFloat(upper.toFixed(2)),
      date: today.toISOString().split('T')[0],
      source: 'BCRA - Cálculo por deslizamiento desde abril 2025',
    });
  } catch (error: any) {
    console.error('[BANDAS API] Error:', error);
    return NextResponse.json(
      { error: 'Error calculando bandas cambiarias' },
      { status: 500 }
    );
  }
}
