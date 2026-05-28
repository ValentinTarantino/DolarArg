const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Comprobando base de datos...');

  console.log('Limpiando cotizaciones anteriores...');
  await prisma.dolarRate.deleteMany({});

  console.log('Iniciando el sembrado de datos históricos del dólar...');

  let currentRates = [
    { casa: 'oficial', nombre: 'Oficial', compra: 1380, venta: 1430 },
    { casa: 'blue', nombre: 'Blue', compra: 1420, venta: 1440 },
    { casa: 'bolsa', nombre: 'Bolsa', compra: 1429, venta: 1435 },
    { casa: 'contadoconliqui', nombre: 'CCL', compra: 1484, venta: 1486 },
    { casa: 'tarjeta', nombre: 'Tarjeta', compra: 1794, venta: 1859 },
    { casa: 'cripto', nombre: 'Cripto', compra: 1487, venta: 1487 },
    { casa: 'mayorista', nombre: 'Mayorista', compra: 1392, venta: 1411 },
  ];

  try {
    console.log('Intentando obtener cotizaciones en tiempo real para calibrar el historial...');
    const response = await fetch('https://dolarapi.com/v1/dolares');
    if (response.ok) {
      const data = await response.json();
      const desiredTypes = ["oficial", "blue", "bolsa", "contadoconliqui", "tarjeta", "cripto", "mayorista"];
      const filtered = data.filter(r => desiredTypes.includes(r.casa));
      if (filtered.length > 0) {
        currentRates = filtered.map(r => ({
          casa: r.casa,
          nombre: r.nombre === 'Bolsa' ? 'Bolsa (MEP)' : r.nombre === 'Contado con liquidación' ? 'CCL' : r.nombre,
          compra: r.compra,
          venta: r.venta
        }));
        console.log('Calibración exitosa usando cotizaciones reales actuales.');
      }
    }
  } catch (error) {
    console.log('No se pudo conectar a la API. Usando valores predeterminados actualizados.');
  }

  const trends = {
    oficial: 0.8,
    blue: 1.5,
    bolsa: 1.2,
    contadoconliqui: 1.3,
    tarjeta: 1.6,
    cripto: 1.4,
    mayorista: 0.7,
  };

  const now = new Date();
  const ratesToInsert = [];

  for (let i = 29; i >= 0; i--) {
    const fecha = new Date(now);
    fecha.setDate(now.getDate() - i);
    fecha.setHours(12, 0, 0, 0);

    for (const rate of currentRates) {
      const trend = trends[rate.casa] || 1.0;

      const dayFactor = i * trend;
      const randomNoise = (Math.random() - 0.5) * 15;

      const compra = Math.round(Math.max(10, rate.compra - dayFactor + randomNoise) * 100) / 100;
      const venta = Math.round(Math.max(10, rate.venta - dayFactor + randomNoise) * 100) / 100;

      ratesToInsert.push({
        casa: rate.casa,
        nombre: rate.nombre,
        compra,
        venta,
        fecha,
      });
    }
  }

  const count = await prisma.dolarRate.createMany({
    data: ratesToInsert,
  });

  console.log(`Sembrado completado. Se insertaron ${count.count} cotizaciones históricas.`);

  // Agregar histórico de EUR/BRL basado en datos reales actuales
  console.log('\n📈 Generando histórico de EUR/BRL basado en datos reales...');

  try {
    // Obtener rates de exchangerate-api (1 USD = X moneda)
    const exchangeResponse = await fetch('https://v6.exchangerate-api.com/v6/free/latest/USD');
    if (!exchangeResponse.ok) throw new Error('No se pudo obtener rates de exchangerate-api');
    
    const exchangeData = await exchangeResponse.json();
    const eurRate = exchangeData.conversion_rates.EUR;     // 1 USD = X EUR
    const brlRate = exchangeData.conversion_rates.BRL;     // 1 USD = X BRL
    
    // Obtener rates del dólar argentino para calcular en ARS
    const dolarResponse = await fetch('https://dolarapi.com/v1/dolares');
    if (!dolarResponse.ok) throw new Error('No se pudo obtener rates del dólar');
    
    const dolarData = await dolarResponse.json();
    const oficial = dolarData.find(r => r.casa === 'oficial');
    const blue = dolarData.find(r => r.casa === 'blue');
    const tarjeta = dolarData.find(r => r.casa === 'tarjeta');

    if (!oficial || !blue || !tarjeta) throw new Error('No se encontraron rates del dólar');

    // Calcular rates en ARS (EUR y BRL en pesos)
    // Calcular rates en ARS (invertir tasas porque la API devuelve 1 USD = X moneda)
    const eurOficial = (1 / eurRate) * oficial.venta;  // 1 EUR en ARS
    const eurBlue = (1 / eurRate) * blue.venta;
    const eurTarjeta = (1 / eurRate) * tarjeta.venta;

    const brlOficial = (1 / brlRate) * oficial.venta;  // 1 BRL en ARS
    const brlBlue = (1 / brlRate) * blue.venta;
    const brlTarjeta = (1 / brlRate) * tarjeta.venta;

    const historicalData = [];
    const nowDate = new Date();

    // Generar 30 días de histórico
    for (let i = 29; i >= 0; i--) {
      const fecha = new Date(nowDate);
      fecha.setDate(nowDate.getDate() - i);
      fecha.setHours(12, 0, 0, 0);

      // Variación realista ±1%
      const eurVar = (Math.random() - 0.5) * 0.02;
      const brlVar = (Math.random() - 0.5) * 0.02;

      // EUR
      historicalData.push({
        codigo: 'EUR',
        tipo: 'oficial',
        compra: Math.round(eurOficial * (1 + eurVar) * 0.98 * 100) / 100,
        venta: Math.round(eurOficial * (1 + eurVar) * 100) / 100,
        fecha
      },
      {
        codigo: 'EUR',
        tipo: 'blue',
        compra: Math.round(eurBlue * (1 + eurVar) * 0.98 * 100) / 100,
        venta: Math.round(eurBlue * (1 + eurVar) * 100) / 100,
        fecha
      },
      {
        codigo: 'EUR',
        tipo: 'tarjeta',
        compra: Math.round(eurTarjeta * (1 + eurVar) * 0.98 * 100) / 100,
        venta: Math.round(eurTarjeta * (1 + eurVar) * 100) / 100,
        fecha
      },
      {
        codigo: 'BRL',
        tipo: 'oficial',
        compra: Math.round(brlOficial * (1 + brlVar) * 0.98 * 100) / 100,
        venta: Math.round(brlOficial * (1 + brlVar) * 100) / 100,
        fecha
      },
      {
        codigo: 'BRL',
        tipo: 'blue',
        compra: Math.round(brlBlue * (1 + brlVar) * 0.98 * 100) / 100,
        venta: Math.round(brlBlue * (1 + brlVar) * 100) / 100,
        fecha
      },
      {
        codigo: 'BRL',
        tipo: 'tarjeta',
        compra: Math.round(brlTarjeta * (1 + brlVar) * 0.98 * 100) / 100,
        venta: Math.round(brlTarjeta * (1 + brlVar) * 100) / 100,
        fecha
      });
    }

    const historyResult = await prisma.exchangeRateHistory.createMany({
      data: historicalData,
      skipDuplicates: true
    });

    console.log(`✅ Histórico EUR/BRL: ${historyResult.count} registros guardados`);
  } catch (error) {
    console.log('⚠️ No se pudo generar histórico EUR/BRL:', error.message);
    console.log('Los datos se acumularán automáticamente con el tiempo.');
  }
}

main()
  .catch((e) => {
    console.error('Error durante el sembrado:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
