import cron from 'node-cron';
import { prisma } from './db';
import { sendAlertEmail } from './mail';

const PUBLIC_API_URL = 'https://dolarapi.com/v1/dolares';
const HISTORICAL_API_BASE = 'https://api.argentinadatos.com/v1/cotizaciones/dolares';

async function checkAndTriggerAlerts(rates: any[]) {
  try {
    const activeAlerts = await prisma.alert.findMany({
      where: { isTriggered: false },
      include: { user: true }
    });

    let alertsTriggered = 0;

    for (const alert of activeAlerts) {
      const rate = rates.find(r => r.casa === alert.casa);
      if (rate) {
        const price = rate.venta;
        const conditionMet =
          (alert.condition === 'ABOVE' && price >= alert.value) ||
          (alert.condition === 'BELOW' && price <= alert.value);

        if (conditionMet) {
          await prisma.alert.update({
            where: { id: alert.id },
            data: { isTriggered: true }
          });
          alertsTriggered++;

          console.log(`[LOCAL CRON] ✅ Alerta #${alert.id} disparada para ${alert.user.email} - Dólar ${alert.casa} a $${price}`);
          try {
            await sendAlertEmail(alert.user.email, alert.casa, price, alert.condition, alert.value, alert.language);
          } catch (emailError) {
            console.error(`[LOCAL CRON] ❌ Error enviando email para alerta #${alert.id}:`, emailError);
          }
        }
      }
    }

    console.log(`[LOCAL CRON] Ciclo completado - ${alertsTriggered} alertas disparadas`);
    return alertsTriggered;
  } catch (error) {
    console.error('[LOCAL CRON] Error al verificar alertas:', error);
    return 0;
  }
}


async function fillMissingHistoricalData() {
  try {
    console.log('[LOCAL CRON] 📊 Verificando datos históricos faltantes...');
    
    const casas = ["oficial", "blue", "bolsa", "contadoconliqui", "tarjeta", "cripto", "mayorista"];
    const daysToCheck = 7; // Verificar últimos 7 días
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysToCheck);
    
    let totalFilled = 0;
    
    for (const casa of casas) {
      try {
        const response = await fetch(`${HISTORICAL_API_BASE}/${casa}`, { cache: 'no-store' });
        
        if (!response.ok) {
          console.warn(`[LOCAL CRON] No se pudo obtener historial para ${casa}`);
          continue;
        }
        
        const historicalData = await response.json();
        
        // Filtrar datos faltantes de los últimos días
        const missingData = historicalData.filter((item: any) => {
          const itemDate = new Date(item.fecha);
          return itemDate >= startDate && item.compra !== null && item.venta !== null;
        });
        
        if (missingData.length === 0) continue;
        
        // Verificar cuáles faltan en la BD
        for (const item of missingData) {
          const existing = await prisma.dolarRate.findFirst({
            where: {
              casa: casa,
              fecha: {
                gte: new Date(new Date(item.fecha).setHours(0, 0, 0, 0)),
                lt: new Date(new Date(item.fecha).setHours(23, 59, 59, 999))
              }
            }
          });
          
          if (!existing) {
            try {
              await prisma.dolarRate.create({
                data: {
                  casa: casa,
                  nombre: getCasaNombre(casa),
                  compra: Number(item.compra),
                  venta: Number(item.venta),
                  fecha: new Date(item.fecha)
                }
              });
              totalFilled++;
            } catch (error: any) {
              if (error.code !== 'P2002') {
                console.error(`[LOCAL CRON] Error insertando dato histórico ${casa}:`, error.message);
              }
            }
          }
        }
        
      } catch (error) {
        console.warn(`[LOCAL CRON] Error verificando historial ${casa}:`, error);
      }
    }
    
    if (totalFilled > 0) {
      console.log(`[LOCAL CRON] ✅ Completados ${totalFilled} datos históricos faltantes`);
    }
    
  } catch (error) {
    console.error('[LOCAL CRON] Error en fillMissingHistoricalData:', error);
  }
}

function getCasaNombre(casa: string): string {
  const nombres: Record<string, string> = {
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

async function runCronCycle() {
  try {
    console.log(`[LOCAL CRON] 🔄 Ejecutando ciclo a las ${new Date().toLocaleTimeString('es-AR')}`);

    const response = await fetch(PUBLIC_API_URL, { cache: 'no-store' });

    if (!response.ok) {
      console.error('[LOCAL CRON] Error fetching from DolarAPI.com:', response.statusText);
      return;
    }

    const externalData = await response.json();
    const desiredTypes = ["oficial", "blue", "bolsa", "contadoconliqui", "tarjeta", "cripto", "mayorista"];
    const currentRates = externalData.filter((rate: any) => desiredTypes.includes(rate.casa));

    if (currentRates.length === 0) {
      console.error('[LOCAL CRON] No se obtuvieron cotizaciones válidas');
      return;
    }
    const now = new Date();
    const ratesToInsert = currentRates.map((rate: any) => ({
      casa: rate.casa,
      nombre: rate.nombre,
      compra: rate.compra,
      venta: rate.venta,
      fecha: now,
    }));

    try {
      await prisma.dolarRate.createMany({
        data: ratesToInsert
      });
      console.log(`[LOCAL CRON] 💾 ${ratesToInsert.length} cotizaciones guardadas en BD`);
    } catch (dbError) {
      console.error('[LOCAL CRON] Error guardando cotizaciones:', dbError);
    }

    await checkAndTriggerAlerts(ratesToInsert);
    
    // Completar datos históricos faltantes (cada 6 horas aprox)
    const hour = now.getHours();
    if (hour % 6 === 0) {
      await fillMissingHistoricalData();
    }
  } catch (error: any) {
    console.error('[LOCAL CRON] Error general:', error.message);
  }
}

export async function startLocalCron() {
  if (process.env.NODE_ENV !== 'development') {
    console.log('[LOCAL CRON] 🚫 No es ambiente de desarrollo - cron desactivado');
    return null;
  }

  console.log('[LOCAL CRON] ⏰ Iniciando cron local (cada 10 minutos)...');

  await runCronCycle().catch(console.error);

  const task = cron.schedule('*/10 * * * *', () => {
    runCronCycle().catch(console.error);
  });

  console.log('[LOCAL CRON] ✅ Cron local iniciado exitosamente');

  return task;
}
