import { NextResponse } from 'next/server';


const BAND_ORIGIN_DATE = new Date('2025-04-11');
const INITIAL_LOWER = 1000;
const INITIAL_UPPER = 1400;


const CRAWLING_RATE_2025 = 0.01; 
const CRAWLING_RATE_2026 = 0.028; 
function calculateBands(referenceDate: Date): { lower: number; upper: number } {
  const origin = BAND_ORIGIN_DATE;
  
  let lower = INITIAL_LOWER;
  let upper = INITIAL_UPPER;
  
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
