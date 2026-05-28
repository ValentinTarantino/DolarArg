import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const COINGECKO_URL =
  'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=1h%2C24h%2C7d%2C30d&locale=es';

export async function GET() {
  try {
    const res = await fetch(COINGECKO_URL, {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `CoinGecko error: ${res.status}` }, { status: res.status });
    }

    const data = await res.json();

    const coins = data.map((c: any, index: number) => ({
      rank: index + 1,
      id: c.id,
      symbol: c.symbol.toUpperCase(),
      name: c.name,
      image: c.image,
      price: c.current_price,
      change1h: c.price_change_percentage_1h_in_currency ?? null,
      change24h: c.price_change_percentage_24h_in_currency ?? null,
      change7d: c.price_change_percentage_7d_in_currency ?? null,
      change30d: c.price_change_percentage_30d_in_currency ?? null,
      marketCap: c.market_cap,
      volume24h: c.total_volume,
      circulatingSupply: c.circulating_supply,
      updatedAt: c.last_updated,
    }));

    return NextResponse.json(coins);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
