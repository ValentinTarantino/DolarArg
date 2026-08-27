const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function syncProductionDatabase() {
  console.log('🔄 Sincronizando schema con base de datos de producción...');
  
  try {
    // Usar db push para sincronizar el schema con la BD
    // Esto es más seguro que migraciones manuales en producción
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Alert" 
      ADD COLUMN IF NOT EXISTS "language" TEXT NOT NULL DEFAULT 'es'
    `);
    
    console.log('✅ Columna "language" agregada exitosamente a la tabla Alert');
    
    // Verificar que la columna existe
    const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Alert' AND column_name = 'language'
    `;
    
    if (result.length > 0) {
      console.log('✅ Verificación exitosa: columna "language" existe');
    } else {
      console.error('❌ Error: columna "language" no fue creada');
    }
    
  } catch (error) {
    console.error('❌ Error sincronizando base de datos:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

syncProductionDatabase()
  .then(() => {
    console.log('✅ Sincronización completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Sincronización fallida:', error);
    process.exit(1);
  });
