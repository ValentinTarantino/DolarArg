import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';

// Configure Neon for serverless environments
neonConfig.useSecureWebSocket = true;

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  // Get the database URL from environment - try multiple variable names
  const connectionString = 
    process.env.DATABASE_URL || 
    process.env.NEON_DATABASE_URL || 
    '';
  
  if (!connectionString) {
    throw new Error('Database connection string not found. Please set DATABASE_URL or NEON_DATABASE_URL environment variable.');
  }

  // Create a Neon connection pool
  const pool = new Pool({ connectionString });
  
  // Create the Prisma adapter for Neon
  const adapter = new PrismaNeon(pool);
  
  // Create Prisma client with the Neon adapter
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
