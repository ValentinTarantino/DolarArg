import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_API_URL = 'https://dolarapi.com/v1/dolares';

export async function GET() {
  try {
    const response = await fetch(PUBLIC_API_URL, { cache: 'no-store' });
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Error fetching rates' },
        { status: 500 }
      );
    }

    const data = await response.json();
    
    return NextResponse.json({
      availableCurrencies: data.map((r: any) => ({
        casa: r.casa,
        nombre: r.nombre,
        compra: r.compra,
        venta: r.venta
      }))
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
