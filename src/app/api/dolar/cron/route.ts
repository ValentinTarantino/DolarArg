import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendAlertEmail } from '@/lib/mail';

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
            await sendAlertEmail(alert.user.email, alert.casa, price, alert.condition, alert.value);
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
 * Endpoint Vercel Cron que se ejecuta cada 10 minutos
 * Obtiene cotizaciones actuales y verifica alertas
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('[CRON] Iniciando verificación de cotizaciones y alertas...');

    // Obtener cotizaciones actuales de la API pública
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

    // Guardar las cotizaciones actuales en la BD
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
      console.log(`[CRON] Se guardaron ${ratesToInsert.length} cotizaciones en la BD`);
    } catch (dbError) {
      console.error('[CRON] Error guardando cotizaciones:', dbError);
    }

    // Verificar y disparar alertas
    const alertsTriggered = await checkAndTriggerAlerts(ratesToInsert);

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      ratesObtained: currentRates.length,
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
