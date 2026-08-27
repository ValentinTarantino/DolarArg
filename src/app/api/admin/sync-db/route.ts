import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST() {
  // Verificar autenticación básica (opcional, para seguridad)
  const authHeader = process.env.ADMIN_SYNC_SECRET;
  
  try {
    console.log('[SYNC DB] Intentando agregar columna language a Alert...');
    
    // Intentar agregar la columna si no existe
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Alert" 
      ADD COLUMN IF NOT EXISTS "language" TEXT NOT NULL DEFAULT 'es'
    `);
    
    console.log('[SYNC DB] ✅ Columna language agregada exitosamente');
    
    // Verificar que la columna existe
    const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Alert' AND column_name = 'language'
    `;
    
    if (Array.isArray(result) && result.length > 0) {
      console.log('[SYNC DB] ✅ Verificación exitosa: columna language existe');
      return NextResponse.json({ 
        success: true, 
        message: 'Base de datos sincronizada exitosamente',
        columnExists: true 
      });
    } else {
      console.error('[SYNC DB] ❌ Error: columna language no fue creada');
      return NextResponse.json({ 
        success: false, 
        message: 'Columna no fue creada',
        columnExists: false 
      }, { status: 500 });
    }
    
  } catch (error: any) {
    console.error('[SYNC DB] Error:', error);
    
    // Si el error es que la columna ya existe, es un éxito
    if (error.message?.includes('already exists') || error.code === '42701') {
      console.log('[SYNC DB] ℹ️ Columna ya existe');
      return NextResponse.json({ 
        success: true, 
        message: 'Columna ya existe en la base de datos',
        columnExists: true 
      });
    }
    
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Error sincronizando base de datos',
      columnExists: false 
    }, { status: 500 });
  }
}

// Solo permitir POST
export async function GET() {
  return NextResponse.json({ 
    message: 'Use POST para sincronizar la base de datos' 
  }, { status: 405 });
}
