import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendAlertEmail } from '@/lib/mail';

const PUBLIC_API_URL = 'https://dolarapi.com/v1/dolares';
const REVALIDATION_TIMEOUT_MS = 10 * 60 * 1000; 

async function checkAndTriggerAlerts(rates: any[]) {
  try {
    const activeAlerts = await prisma.alert.findMany({
      where: { isTriggered: false },
      include: { user: true }
    });

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
          console.log(`[ALERTA DETECTADA] Alerta #${alert.id} para ${alert.user.email} se ha disparado. Dólar ${alert.casa} está a $${price} (${alert.condition} $${alert.value})`);
          
          try {
            await sendAlertEmail(alert.user.email, alert.casa, price, alert.condition, alert.value, alert.language);
          } catch (emailError) {
            console.error(`Error enviando email para alerta #${alert.id}:`, emailError);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error al verificar alertas:', error);
  }
}

export async function GET() {
  try {
    let latestRatesInDb: any[] = [];
    let databaseAvailable = true;

    try {
      latestRatesInDb = await prisma.dolarRate.findMany({
        orderBy: { fecha: 'desc' },
        take: 7,
      });
    } catch (databaseError) {
      databaseAvailable = false;
      console.error('Base de datos no disponible; usando DolarAPI como fallback:', databaseError);
    }

    const now = new Date();
    let shouldFetch = !databaseAvailable;

    if (databaseAvailable && latestRatesInDb.length < 7) {
      shouldFetch = true;
    } else if (databaseAvailable) {
      const latestDate = new Date(latestRatesInDb[0].fecha);
      if (now.getTime() - latestDate.getTime() > REVALIDATION_TIMEOUT_MS) {
        shouldFetch = true;
      }
    }

    if (shouldFetch) {
      console.log('Cotizaciones obsoletas o incompletas. Obteniendo datos frescos de la API pública...');
      const response = await fetch(PUBLIC_API_URL, { cache: 'no-store' });
      
      if (response.ok) {
        const externalData = await response.json();
        
        const desiredTypes = ["oficial", "blue", "bolsa", "contadoconliqui", "tarjeta", "cripto", "mayorista"];
        const ratesToInsert = [];
        const currentBatch: any[] = [];

        for (const rate of externalData) {
          if (desiredTypes.includes(rate.casa)) {
            ratesToInsert.push({
              casa: rate.casa,
              nombre: rate.nombre,
              compra: rate.compra,
              venta: rate.venta,
              fecha: now,
            });
            currentBatch.push(rate);
          }
        }

        if (ratesToInsert.length > 0) {
          try {
            await prisma.dolarRate.createMany({
              data: ratesToInsert
            });
            console.log(`Se guardaron ${ratesToInsert.length} nuevas cotizaciones en la base de datos.`);
          } catch (databaseError) {
            console.error('No se pudieron guardar las cotizaciones; se devuelven igualmente desde DolarAPI:', databaseError);
          }
          
          await checkAndTriggerAlerts(ratesToInsert);

          return NextResponse.json(ratesToInsert);
        }
      } else {
        console.error('Error fetching from DolarAPI.com:', response.statusText);
      }
    }

    
    
    const desiredTypes = ["oficial", "blue", "bolsa", "contadoconliqui", "tarjeta", "cripto", "mayorista"];
    const latestUniqueRates: Array<{
      id: number;
      casa: string;
      nombre: string;
      compra: number;
      venta: number;
      fecha: Date;
      createdAt: Date;
    }> = [];

    if (!databaseAvailable) {
      return NextResponse.json(latestUniqueRates);
    }

    for (const casa of desiredTypes) {
      try {
        const latestRate = await prisma.dolarRate.findFirst({
          where: { casa },
          orderBy: { id: 'desc' }
        });
        if (latestRate) {
          latestUniqueRates.push(latestRate);
        }
      } catch (databaseError) {
        console.error('Error leyendo cotizaciones guardadas:', databaseError);
        break;
      }
    }

    
    const orderMap: Record<string, number> = {
      oficial: 0,
      blue: 1,
      bolsa: 2,
      contadoconliqui: 3,
      tarjeta: 4,
      cripto: 5,
      mayorista: 6
    };

    latestUniqueRates.sort((a: { casa: string }, b: { casa: string }) => (orderMap[a.casa] ?? 99) - (orderMap[b.casa] ?? 99));

    return NextResponse.json(latestUniqueRates);
  } catch (error: any) {
    console.error('Error en API dolar:', error);
    return NextResponse.json({ error: 'Error interno del servidor', details: error.message }, { status: 500 });
  }
}
