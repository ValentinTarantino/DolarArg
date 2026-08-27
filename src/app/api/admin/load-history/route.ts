import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

async function getCasaNombre(casa: string): Promise<string> {
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

export async function POST() {
  try {
    console.log('[LOAD HISTORY] Obteniendo datos históricos REALES de ArgentinaDatos API...');
    
    const API_BASE = 'https://api.argentinadatos.com/v1/cotizaciones/dolares';
    const casas = ["oficial", "blue", "bolsa", "contadoconliqui", "tarjeta", "cripto", "mayorista"];
    const daysToFetch = 30;
    
    // Calcular fecha de inicio (30 días atrás)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysToFetch);
    
    let totalInserted = 0;
    let totalErrors = 0;
    
    for (const casa of casas) {
      try {
        console.log(`[LOAD HISTORY] Obteniendo historial para ${casa}...`);
        
        const response = await fetch(`${API_BASE}/${casa}`, {
          cache: 'no-store'
        });
        
        if (!response.ok) {
          console.error(`[LOAD HISTORY] Error fetching ${casa}:`, response.statusText);
          totalErrors++;
          continue;
        }
        
        const historicalData = await response.json();
        
        // Filtrar datos de los últimos 30 días
        const recentData = historicalData.filter((item: any) => {
          const itemDate = new Date(item.fecha);
          return itemDate >= startDate && item.compra !== null && item.venta !== null;
        });
        
        console.log(`[LOAD HISTORY] ${recentData.length} registros encontrados para ${casa}`);
        
        // Insertar datos
        for (const item of recentData) {
          try {
            // Verificar si ya existe
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
              await prisma.dolarRate.create({
                data: {
                  casa: casa,
                  nombre: await getCasaNombre(casa),
                  compra: Number(item.compra),
                  venta: Number(item.venta),
                  fecha: new Date(item.fecha)
                }
              });
              totalInserted++;
            }
          } catch (error: any) {
            if (error.code !== 'P2002') {
              throw error;
            }
          }
        }
        
        console.log(`[LOAD HISTORY] ✅ ${casa} completado`);
        
      } catch (error) {
        console.error(`[LOAD HISTORY] Error procesando ${casa}:`, error);
        totalErrors++;
      }
    }
    
    console.log(`[LOAD HISTORY] Resumen: ${totalInserted} insertados, ${totalErrors} errores`);
    
    // Verificar resultado final
    const totalCount = await prisma.dolarRate.count();
    const latestDate = await prisma.dolarRate.findFirst({
      orderBy: { fecha: 'desc' },
      select: { fecha: true }
    });
    
    return NextResponse.json({
      success: true,
      message: `Datos históricos cargados: ${totalInserted} registros insertados`,
      totalInserted,
      totalErrors,
      totalCount,
      latestDate: latestDate?.fecha
    });
    
  } catch (error: any) {
    console.error('[LOAD HISTORY] Error general:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Error cargando datos históricos'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Use POST para cargar datos históricos' 
  }, { status: 405 });
}
