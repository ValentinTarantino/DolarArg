import { NextResponse } from 'next/server';
import { getClpUyuVariants } from '@/lib/exchange-rates';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rates = await getClpUyuVariants();
    if (rates.length === 0) {
      return NextResponse.json({ error: 'No se pudieron obtener cotizaciones' }, { status: 500 });
    }
    return NextResponse.json(rates);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
