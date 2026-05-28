import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const RIESGO_PAIS_URL = 'https://api.argentinadatos.com/v1/finanzas/indices/riesgo-pais';
const INFLACION_URL   = 'https://api.argentinadatos.com/v1/finanzas/indices/inflacion';

function getBcraReservasUrl() {
  const to   = new Date().toISOString().split('T')[0];
  const from = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  return `https://api.bcra.gob.ar/estadisticas/v4.0/Monetarias/1?desde=${from}&hasta=${to}`;
}

function fetchWithTimeout(url: string, options: RequestInit = {}, ms = 8000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(id));
}

// Cache en memoria del proceso — persiste entre requests mientras el servidor corre
let cachedReservas: { valor: number; fecha: string; variacion: number | null; history: { fecha: string; valor: number }[] } | null = null;
let cachedReservasAt = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hora

type ReservasData = { valor: number; fecha: string; variacion: number | null; history: { fecha: string; valor: number }[] };

function parseReservasBcra(json: any): ReservasData | null {
  const items: { fecha: string; valor: number }[] = json?.results?.[0]?.detalle ?? [];
  if (items.length < 2) return null;
  const sorted = [...items].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const last = sorted[sorted.length - 1];
  const prev = sorted[sorted.length - 2];
  return {
    valor: last.valor,
    fecha: last.fecha,
    variacion: prev ? ((last.valor - prev.valor) / prev.valor) * 100 : null,
    history: sorted.slice(-30).map(d => ({ fecha: d.fecha, valor: d.valor })),
  };
}

export async function GET() {
  try {
    const [riesgoRes, reservasBcraRes, inflacionRes] = await Promise.allSettled([
      fetchWithTimeout(RIESGO_PAIS_URL, { cache: 'no-store' }),
      fetchWithTimeout(getBcraReservasUrl(), { cache: 'no-store', headers: { 'Accept': 'application/json' } }),
      fetchWithTimeout(INFLACION_URL, { cache: 'no-store' }),
    ]);

    // Riesgo país
    let riesgoPais: { valor: number; fecha: string; variacion: number | null } | null = null;
    if (riesgoRes.status === 'fulfilled' && riesgoRes.value.ok) {
      const data: { fecha: string; valor: number }[] = await riesgoRes.value.json();
      if (Array.isArray(data) && data.length >= 2) {
        const last = data[data.length - 1];
        const prev = data[data.length - 2];
        riesgoPais = { valor: last.valor, fecha: last.fecha, variacion: prev ? ((last.valor - prev.valor) / prev.valor) * 100 : null };
      }
    }

    // Reservas BCRA con cache en memoria
    let reservas: ReservasData | null = null;

    if (reservasBcraRes.status === 'fulfilled' && reservasBcraRes.value.ok) {
      try {
        const json = await reservasBcraRes.value.json();
        const parsed = parseReservasBcra(json);
        if (parsed) {
          reservas = parsed;
          cachedReservas = parsed;
          cachedReservasAt = Date.now();
        }
      } catch (_) {}
    }

    // Si BCRA falló, usar cache si no expiró (1 hora)
    if (!reservas && cachedReservas && Date.now() - cachedReservasAt < CACHE_TTL_MS) {
      reservas = cachedReservas;
    }

    // Inflación mensual
    let inflacion: { valor: number; fecha: string } | null = null;
    if (inflacionRes.status === 'fulfilled' && inflacionRes.value.ok) {
      const data: { fecha: string; valor: number }[] = await inflacionRes.value.json();
      if (Array.isArray(data) && data.length > 0) {
        const last = data[data.length - 1];
        inflacion = { valor: last.valor, fecha: last.fecha };
      }
    }

    return NextResponse.json({ riesgoPais, reservas, inflacion });
  } catch (error: any) {
    // Si todo falla, devolver cache si existe
    if (cachedReservas) {
      return NextResponse.json({ riesgoPais: null, reservas: cachedReservas, inflacion: null });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
