const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

async function generateHistoricalData() {
  console.log('Generando datos históricos para los últimos 30 días...');
  
  const PUBLIC_API_URL = 'https://dolarapi.com/v1/dolares';
  const desiredTypes = ["oficial", "blue", "bolsa", "contadoconliqui", "tarjeta", "cripto", "mayorista"];
  
  try {
    // Obtener datos actuales de la API
    const response = await axios.get(PUBLIC_API_URL);
    const currentRates = response.data.filter((rate) => desiredTypes.includes(rate.casa));
    
    if (currentRates.length === 0) {
      throw new Error('No se obtuvieron cotizaciones válidas de la API');
    }
    
    console.log(`Obtenidas ${currentRates.length} cotizaciones actuales`);
    
    // Generar datos para los últimos 30 días
    const daysToGenerate = 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysToGenerate);
    
    let totalInserted = 0;
    
    for (let dayOffset = 0; dayOffset < daysToGenerate; dayOffset++) {
      const targetDate = new Date(startDate);
      targetDate.setDate(targetDate.getDate() + dayOffset);
      targetDate.setHours(12, 0, 0, 0); // Mediodía para evitar duplicados
      
      // Verificar si ya existen datos para este día
      const existingCount = await prisma.dolarRate.count({
        where: {
          fecha: {
            gte: new Date(targetDate.setHours(0, 0, 0, 0)),
            lt: new Date(targetDate.setHours(23, 59, 59, 999))
          }
        }
      });
      
      if (existingCount > 0) {
        console.log(`Día ${dayOffset + 1}/${daysToGenerate} (${targetDate.toISOString().slice(0, 10)}): ya tiene datos, saltando`);
        continue;
      }
      
      // Generar variación aleatoria pequeña para simular datos históricos
      const progress = dayOffset / daysToGenerate;
      const randomFactor = 0.98 + (Math.random() * 0.04); // ±2% variación
      
      const ratesToInsert = currentRates.map((rate) => {
        const baseCompra = Number(rate.compra);
        const baseVenta = Number(rate.venta);
        
        // Variación progresiva para simular tendencia
        const trend = 1 + (progress * 0.05); // 5% de tendencia total
        const noise = 0.98 + (Math.random() * 0.04); // ±2% ruido
        
        const compra = Number((baseCompra * trend * noise).toFixed(2));
        const venta = Number((baseVenta * trend * noise).toFixed(2));
        
        return {
          casa: rate.casa,
          nombre: rate.nombre,
          compra,
          venta,
          fecha: new Date(targetDate.setHours(12 + Math.floor(Math.random() * 8), 0, 0, 0)), // Horario aleatorio entre 12-20hs
        };
      });
      
      await prisma.dolarRate.createMany({
        data: ratesToInsert
      });
      
      totalInserted += ratesToInsert.length;
      console.log(`Día ${dayOffset + 1}/${daysToGenerate} (${targetDate.toISOString().slice(0, 10)}): insertados ${ratesToInsert.length} registros`);
    }
    
    console.log(`✅ Completado: ${totalInserted} registros históricos generados`);
    
    // Verificar resultado
    const totalCount = await prisma.dolarRate.count();
    const latestDate = await prisma.dolarRate.findFirst({
      orderBy: { fecha: 'desc' },
      select: { fecha: true }
    });
    
    console.log(`Total registros en BD: ${totalCount}`);
    console.log(`Fecha más reciente: ${latestDate?.fecha.toISOString()}`);
    
  } catch (error) {
    console.error('Error generando datos históricos:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

generateHistoricalData();
