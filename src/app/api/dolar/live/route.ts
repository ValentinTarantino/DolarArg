import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  let intervalId: NodeJS.Timeout | null = null;
  let heartbeatId: NodeJS.Timeout | null = null;

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

      heartbeatId = setInterval(() => {
        controller.enqueue(new TextEncoder().encode(': keepalive\n\n'));
      }, 25000);

      request.signal.addEventListener('abort', () => {
        console.log('Cliente desconectado de SSE.');
        if (intervalId) clearInterval(intervalId);
        if (heartbeatId) clearInterval(heartbeatId);
        try {
          controller.close();
        } catch (e) {
        }
      }, { once: true });
    },
    cancel() {
      if (intervalId) clearInterval(intervalId);
      if (heartbeatId) clearInterval(heartbeatId);
    }
  });

  return new Response(responseStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform, no-store, must-revalidate',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
