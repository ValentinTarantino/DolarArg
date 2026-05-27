import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  let intervalId: NodeJS.Timeout;

  const responseStream = new ReadableStream({
    async start(controller) {
      // Función para enviar mensajes formateados para SSE
      const sendEvent = (type: string, data: any) => {
        const message = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(new TextEncoder().encode(message));
      };

      // Enviar confirmación de conexión
      sendEvent('connected', { time: new Date().toISOString() });

      let lastChecked = new Date();

      // Polling de la base de datos para detectar inserciones hechas por la API principal
      intervalId = setInterval(async () => {
        try {
          // Buscamos si hay cotizaciones creadas después de nuestra última marca de tiempo
          const newRates = await prisma.dolarRate.findMany({
            where: {
              createdAt: {
                gt: lastChecked
              }
            },
            orderBy: { id: 'desc' },
            take: 7
          });

          if (newRates.length > 0) {
            // Mandar cotizaciones actualizadas
            sendEvent('rates_update', newRates);
            // Actualizar la última fecha de revisión
            lastChecked = new Date();
          }
        } catch (error) {
          console.error('Error en SSE loop:', error);
          sendEvent('error', { message: 'Error interno leyendo cotizaciones' });
        }
      }, 5000); // Revisar cambios en la DB cada 5 segundos

      // Limpiar al desconectar
      request.signal.addEventListener('abort', () => {
        console.log('Cliente desconectado de SSE.');
        clearInterval(intervalId);
        try {
          controller.close();
        } catch (e) {
          // Ignorar si ya está cerrada
        }
      });
    },
    cancel() {
      if (intervalId) clearInterval(intervalId);
    }
  });

  return new Response(responseStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
