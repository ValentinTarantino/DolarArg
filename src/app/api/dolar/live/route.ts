import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  let intervalId: NodeJS.Timeout;

  const responseStream = new ReadableStream({
    async start(controller) {
      const sendEvent = (type: string, data: any) => {
        const message = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(new TextEncoder().encode(message));
      };

      sendEvent('connected', { time: new Date().toISOString() });

      let lastChecked = new Date();

      intervalId = setInterval(async () => {
        try {
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
            sendEvent('rates_update', newRates);
            lastChecked = new Date();
          }
        } catch (error) {
          console.error('Error en SSE loop:', error);
          sendEvent('error', { message: 'Error interno leyendo cotizaciones' });
        }
      }, 5000); 

      request.signal.addEventListener('abort', () => {
        console.log('Cliente desconectado de SSE.');
        clearInterval(intervalId);
        try {
          controller.close();
        } catch (e) {
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
