const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

async function fetchRealHistoricalData() {
  console.log('Obteniendo datos históricos REALES de ArgentinaDatos API...');
  
  const API_BASE = 'https://api.argentinadatos.com/v1/cotizaciones/dolares';
  const casas = ["oficial", "blue", "bolsa", "contadoconliqui", "tarjeta", "cripto", "mayorista"];
  const daysToFetch = 30;
  
  try {
    // Calcular fecha de inicio (30 días atrás)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysToFetch);
    
    let totalInserted = 0;
    let totalErrors = 0;
    
    for (const casa of casas) {
      try {
        console.log(`\n📊 Obteniendo historial para ${casa}...`);
        
        const response = await axios.get(`${API_BASE}/${casa}`, {
          timeout: 30000
        });
        
        if (!response.data || !Array.isArray(response.data)) {
          console.error(`❌ Error: respuesta inválida para ${casa}`);
          totalErrors++;
          continue;
        }
        
        // Filtrar datos de los últimos 30 días
        const recentData = response.data.filter(item => {
          const itemDate = new Date(item.fecha);
          return itemDate >= startDate;
        });
        
        console.log(`   📥 ${recentData.length} registros encontrados (últimos 30 días)`);
        
        // Mapear al formato de la base de datos
        const ratesToInsert = [];
        
        for (const item of recentData) {
          // Verificar si ya existe un registro para esta fecha y casa
          const existing = await prisma.dolarRate.findFirst({
            where: {
              casa: casa,
              fecha: {
                gte: new Date(new Date(item.fecha).setHours(0, 0, 0, 0)),
                lt: new Date(new Date(item.fecha).setHours(23, 59, 59, 999))
              }
            }
          });
          
          if (existing) {
            // Actualizar si existe
            await prisma.dolarRate.update({
              where: { id: existing.id },
              data: {
                compra: item.compra !== null ? Number(item.compra) : existing.compra,
                venta: item.venta !== null ? Number(item.venta) : existing.venta
              }
            });
          } else {
            // Insertar si no existe
            ratesToInsert.push({
              casa: casa,
              nombre: getCasaNombre(casa),
              compra: item.compra !== null ? Number(item.compra) : 0,
              venta: item.venta !== null ? Number(item.venta) : 0,
              fecha: new Date(item.fecha)
            });
          }
        }
        
        if (ratesToInsert.length > 0) {
          // Insertar registros uno por uno para evitar duplicados
          for (const rate of ratesToInsert) {
            try {
              await prisma.dolarRate.create({
                data: rate
              });
              totalInserted++;
            } catch (error) {
              // Ignorar errores de duplicados (unique constraint)
              if (error.code !== 'P2002') {
                throw error;
              }
            }
          }
          console.log(`   ✅ Insertados ${ratesToInsert.length} nuevos registros`);
        } else {
          console.log(`   ℹ️  No hay nuevos registros para insertar`);
        }
        
      } catch (error) {
        console.error(`❌ Error procesando ${casa}:`, error.message);
        totalErrors++;
      }
    }
    
    console.log(`\n📊 Resumen:`);
    console.log(`   ✅ Total insertados: ${totalInserted}`);
    console.log(`   ❌ Total errores: ${totalErrors}`);
    
    // Verificar resultado final
    const totalCount = await prisma.dolarRate.count();
    const latestDate = await prisma.dolarRate.findFirst({
      orderBy: { fecha: 'desc' },
      select: { fecha: true }
    });
    
    console.log(`   📊 Total registros en BD: ${totalCount}`);
    console.log(`   📅 Fecha más reciente: ${latestDate?.fecha.toISOString()}`);
    
    // Verificar distribución por casa
    for (const casa of casas) {
      const count = await prisma.dolarRate.count({
        where: {
          casa: casa,
          fecha: { gte: startDate }
        }
      });
      console.log(`   ${casa}: ${count} registros (últimos 30 días)`);
    }
    
  } catch (error) {
    console.error('Error general:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

function getCasaNombre(casa) {
  const nombres = {
    oficial: 'Oficial',
    blue: 'Blue',
    bolsa: 'Bolsa',
    contadoconliqui: 'Contado con Liqui',
    tarjeta: 'Tarjeta',
    cripto: 'Cripto',
    mayorista: 'Mayorista'
  };
  return nombres[casa] || casa;
}

fetchRealHistoricalData();
