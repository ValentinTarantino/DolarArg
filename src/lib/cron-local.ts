import cron from 'node-cron';
import { prisma } from './db';
import { sendAlertEmail } from './mail';

const PUBLIC_API_URL = 'https://dolarapi.com/v1/dolares';

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
            await sendAlertEmail(alert.user.email, alert.casa, price, alert.condition, alert.value);
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
