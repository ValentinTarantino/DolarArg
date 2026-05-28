

const DOLARAPI_URL = 'https://dolarapi.com/v1/dolares';
const EXCHANGERATE_API = 'https://api.exchangerate-api.com/v4/latest/';

export interface ExchangeRate {
  codigo: string;
  nombre: string;
  compra: number;
  venta: number;
  fecha: Date;
}

export interface ExchangeRateVariant extends ExchangeRate {
  casa: string;
  tipo: string;
  variacion?: number;
}

export async function getDolarRates(): Promise<ExchangeRate[]> {
  try {
    const response = await fetch(DOLARAPI_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error('Error fetching dolar rates');
    
    const data = await response.json();
    return data.map((rate: any) => ({
      codigo: rate.casa,
      nombre: rate.nombre,
      compra: rate.compra,
      venta: rate.venta,
      fecha: new Date()
    }));
  } catch (error) {
    console.error('Error en getDolarRates:', error);
    return [];
  }
}

export async function getEurBrlRates(): Promise<ExchangeRate[]> {
  try {
    const currencies = ['EUR', 'BRL'];
    const rates: ExchangeRate[] = [];

    const dolarResponse = await fetch(DOLARAPI_URL, { cache: 'no-store' });
    if (!dolarResponse.ok) throw new Error('Error fetching dolar rates');
    
    const dolarData = await dolarResponse.json();
    const usdToArs = dolarData.reduce((sum: number, r: any) => sum + r.venta, 0) / dolarData.length;

    for (const currency of currencies) {
      try {
        const response = await fetch(`${EXCHANGERATE_API}${currency}`, { cache: 'no-store' });
        if (!response.ok) continue;
        
        const data = await response.json();
        const usdRate = data.rates.USD;
        
        const arsRate = usdRate * usdToArs;

        const currencyNames: Record<string, string> = {
          'EUR': 'Euro',
          'BRL': 'Real Brasileño'
        };

        rates.push({
          codigo: currency,
          nombre: currencyNames[currency] || currency,
          compra: arsRate * 0.99, 
          venta: arsRate,
          fecha: new Date()
        });
      } catch (error) {
        console.error(`Error fetching ${currency}:`, error);
      }
    }

    return rates;
  } catch (error) {
    console.error('Error en getEurBrlRates:', error);
    return [];
  }
}

export async function getClpUyuVariants(): Promise<ExchangeRateVariant[]> {
  try {
    const cotizRes = await fetch('https://dolarapi.com/v1/cotizaciones', { cache: 'no-store' });
    if (!cotizRes.ok) throw new Error('Error fetching cotizaciones');
    const cotizData: any[] = await cotizRes.json();

    const currencyNames: Record<string, string> = { CLP: 'Peso Chileno', UYU: 'Peso Uruguayo' };
    const TARJETA_MULTIPLIER = 1.30;
    const rates: ExchangeRateVariant[] = [];

    for (const code of ['CLP', 'UYU']) {
      const oficial = cotizData.find((c: any) => c.moneda === code);
      if (!oficial) continue;

      rates.push({
        codigo: code, casa: code, tipo: 'oficial',
        nombre: currencyNames[code],
        compra: oficial.compra,
        venta: oficial.venta,
        fecha: new Date(),
      });

      rates.push({
        codigo: code, casa: code, tipo: 'tarjeta',
        nombre: currencyNames[code],
        compra: oficial.compra * TARJETA_MULTIPLIER,
        venta: oficial.venta * TARJETA_MULTIPLIER,
        fecha: new Date(),
      });
    }

    return rates;
  } catch (error) {
    console.error('Error en getClpUyuVariants:', error);
    return [];
  }
}

export async function getEurBrlVariants(): Promise<ExchangeRateVariant[]> {
  try {
    const currencies = ['EUR', 'BRL'];
    const rates: ExchangeRateVariant[] = [];

    // 1. Obtener todas las cotizaciones de dolarapi (USD oficial/blue/tarjeta + EUR/BRL oficial directo)
    const [dolarRes, cotizRes] = await Promise.all([
      fetch(DOLARAPI_URL, { cache: 'no-store' }),
      fetch('https://dolarapi.com/v1/cotizaciones', { cache: 'no-store' }),
    ]);

    if (!dolarRes.ok) throw new Error('Error fetching dolar rates');
    const dolarData = await dolarRes.json();

    const dolarOficial  = dolarData.find((d: any) => d.casa === 'oficial');
    const dolarBlue     = dolarData.find((d: any) => d.casa === 'blue');
    const dolarTarjeta  = dolarData.find((d: any) => d.casa === 'tarjeta');

    const usdOficial  = dolarOficial?.venta  || 1435;
    const usdBlue     = dolarBlue?.venta     || 1440;
    const usdTarjeta  = dolarTarjeta?.venta  || (usdOficial * 1.30);

    // cotizaciones directas EUR/BRL en ARS del oficial de dolarapi
    let directCotiz: any[] = [];
    if (cotizRes.ok) directCotiz = await cotizRes.json();

    const currencyNames: Record<string, string> = { EUR: 'Euro', BRL: 'Real Brasileño' };

    for (const currency of currencies) {
      try {
        // Oficial directo desde dolarapi (más preciso)
        const directOficial = directCotiz.find((c: any) => c.moneda === currency && c.casa === 'oficial');

        // Cross rate: cuántos USD vale 1 EUR/BRL (usando el oficial directo si está disponible)
        const currencyToUsd = directOficial
          ? directOficial.venta / usdOficial   // EUR_ARS / USD_ARS = EUR/USD
          : null;

        // Si no hay cross rate, pedimos a exchangerate-api como fallback
        let crossRate = currencyToUsd;
        if (!crossRate) {
          const xRes = await fetch(`${EXCHANGERATE_API}${currency}`, { cache: 'no-store' });
          if (xRes.ok) {
            const xData = await xRes.json();
            crossRate = xData.rates.USD;
          }
        }

        if (!crossRate) continue;

        // Oficial: usar valores directos de dolarapi si están disponibles
        const oficialCompra = directOficial?.compra ?? (crossRate * usdOficial * 0.98);
        const oficialVenta  = directOficial?.venta  ?? (crossRate * usdOficial);
        rates.push({ codigo: currency, casa: currency, tipo: 'oficial', nombre: currencyNames[currency], compra: oficialCompra, venta: oficialVenta, fecha: new Date() });

        // Blue: cruce con blue
        const blueVenta  = crossRate * usdBlue;
        const blueCompra = crossRate * (dolarBlue?.compra || usdBlue * 0.98);
        rates.push({ codigo: currency, casa: currency, tipo: 'blue', nombre: currencyNames[currency], compra: blueCompra, venta: blueVenta, fecha: new Date() });

        // Tarjeta: cruce con tarjeta
        const tarjetaVenta  = crossRate * usdTarjeta;
        const tarjetaCompra = crossRate * (dolarTarjeta?.compra || usdTarjeta * 0.98);
        rates.push({ codigo: currency, casa: currency, tipo: 'tarjeta', nombre: currencyNames[currency], compra: tarjetaCompra, venta: tarjetaVenta, fecha: new Date() });

      } catch (error) {
        console.error(`Error fetching ${currency}:`, error);
      }
    }

    return rates;
  } catch (error) {
    console.error('Error en getEurBrlVariants:', error);
    return [];
  }
}

