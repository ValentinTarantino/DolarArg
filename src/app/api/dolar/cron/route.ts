import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendAlertEmail } from '@/lib/mail';
import { pruneOldRateHistory, saveChangedDolarRates } from '@/lib/rate-history';

const PUBLIC_API_URL = 'https://dolarapi.com/v1/dolares';

/**
 * Verifica y dispara alertas basadas en cotizaciones actuales
 */
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

          console.log(`[ALERTA DISPARADA] Alerta #${alert.id} para ${alert.user.email} - Dólar ${alert.casa} a $${price} (${alert.condition} $${alert.value})`);

          // Enviar email
          try {
            await sendAlertEmail(alert.user.email, alert.casa, price, alert.condition, alert.value, alert.language);
          } catch (emailError) {
            console.error(`Error enviando email para alerta #${alert.id}:`, emailError);
          }
        }
      }
    }

    console.log(`[CRON] Se dispararon ${alertsTriggered} alertas`);
    return alertsTriggered;
  } catch (error) {
    console.error('[CRON] Error al verificar alertas:', error);
    return 0;
  }
}

/**
 * Endpoint de actualizacion programada de cotizaciones y alertas.
 */
export async function GET() {
  try {
    console.log('[CRON] Iniciando verificación de cotizaciones y alertas...');

    // Obtener cotizaciones actuales de la API pública
    try {
      const pruned = await pruneOldRateHistory();
      console.log(`[CRON] Limpieza: ${pruned.dolarRatesDeleted} cotizaciones y ${pruned.exchangeRatesDeleted} registros EUR/BRL anteriores a ${pruned.cutoff}`);
    } catch (cleanupError) {
      console.error('[CRON] Error limpiando historial vencido:', cleanupError);
    }

    const response = await fetch(PUBLIC_API_URL, { cache: 'no-store' });

    if (!response.ok) {
      console.error('[CRON] Error fetching from DolarAPI.com:', response.statusText);
      return NextResponse.json(
        { error: 'Error fetching rates', details: response.statusText },
        { status: 500 }
      );
    }

    const externalData = await response.json();
    const desiredTypes = ["oficial", "blue", "bolsa", "contadoconliqui", "tarjeta", "cripto", "mayorista"];

    // Filtrar solo los tipos deseados
    const currentRates = externalData.filter((rate: any) => desiredTypes.includes(rate.casa));

    if (currentRates.length === 0) {
      console.error('[CRON] No se obtuvieron cotizaciones válidas');
      return NextResponse.json(
        { error: 'No valid rates obtained' },
        { status: 400 }
      );
    }

    console.log(`[CRON] Obtenidas ${currentRates.length} cotizaciones actuales`);

    // Guardar solo cambios reales y mantener acotado el historial local.
    const now = new Date();
    const ratesToSave = currentRates.map((rate: any) => ({
      casa: rate.casa,
      nombre: rate.nombre,
      compra: rate.compra,
      venta: rate.venta,
    }));

    let ratesSaved = 0;
    try {
      ratesSaved = await saveChangedDolarRates(ratesToSave, now);
      console.log(`[CRON] Se guardaron ${ratesSaved} cotizaciones con cambios`);
    } catch (dbError) {
      console.error('[CRON] Error guardando cotizaciones:', dbError);
    }

    // Verificar y disparar alertas
    const alertsTriggered = await checkAndTriggerAlerts(ratesToSave);

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      ratesObtained: currentRates.length,
      ratesSaved,
      alertsTriggered: alertsTriggered,
      message: 'Cron job completado exitosamente'
    });
  } catch (error: any) {
    console.error('[CRON] Error general:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
