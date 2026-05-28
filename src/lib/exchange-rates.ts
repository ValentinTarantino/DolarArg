

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

export async function getEurBrlVariants(): Promise<ExchangeRateVariant[]> {
  try {
    const currencies = ['EUR', 'BRL'];
    const rates: ExchangeRateVariant[] = [];

    const dolarResponse = await fetch(DOLARAPI_URL, { cache: 'no-store' });
    if (!dolarResponse.ok) throw new Error('Error fetching dolar rates');
    
    const dolarData = await dolarResponse.json();
    const dolarOficial = dolarData.find((d: any) => d.casa === 'oficial');
    const dolarBlue = dolarData.find((d: any) => d.casa === 'blue');
    const dolarTarjeta = dolarData.find((d: any) => d.casa === 'tarjeta');
    
    const usdOficial = dolarOficial?.venta || 1000;
    const usdBlue = dolarBlue?.venta || 1200;
    const usdTarjeta = dolarTarjeta?.venta || (usdOficial * 1.30);

    for (const currency of currencies) {
      try {
        const response = await fetch(`${EXCHANGERATE_API}${currency}`, { cache: 'no-store' });
        if (!response.ok) continue;
        
        const data = await response.json();
        const usdRate = data.rates.USD;
        
        const currencyNames: Record<string, string> = {
          'EUR': 'Euro',
          'BRL': 'Real Brasileño'
        };

        const oficialRate = usdRate * usdOficial;
        rates.push({
          codigo: currency,
          casa: currency,
          tipo: 'oficial',
          nombre: currencyNames[currency] || currency,
          compra: oficialRate * 0.98,
          venta: oficialRate,
          fecha: new Date()
        });

        const blueRate = usdRate * usdBlue;
        rates.push({
          codigo: currency,
          casa: currency,
          tipo: 'blue',
          nombre: currencyNames[currency] || currency,
          compra: blueRate * 0.98,
          venta: blueRate,
          fecha: new Date()
        });
        const tarjetaRate = usdRate * usdTarjeta;
        rates.push({
          codigo: currency,
          casa: currency,
          tipo: 'tarjeta',
          nombre: currencyNames[currency] || currency,
          compra: tarjetaRate * 0.98,
          venta: tarjetaRate,
          fecha: new Date()
        });
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

