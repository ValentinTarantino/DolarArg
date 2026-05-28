#!/bin/bash
# Script para preparar el schema para Vercel

if [ "$VERCEL_ENV" = "production" ] || [ "$VERCEL_ENV" = "preview" ]; then
  echo "🔄 Preparando schema para Vercel (PostgreSQL)..."
  
  # Reemplazar el schema para PostgreSQL
  cat > prisma/schema.prisma << 'EOF'
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

// Looking for ways to speed up your queries, or scale easily with your serverless or edge functions?
// Try Prisma Accelerate: https://pris.ly/cli/accelerate-init

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model DolarRate {
  id        Int      @id @default(autoincrement())
  casa      String
  nombre    String
  compra    Float
  venta     Float
  fecha     DateTime
  createdAt DateTime @default(now())

  @@index([casa, fecha])
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String
  createdAt DateTime @default(now())
  alerts    Alert[]
}

model Alert {
  id          Int      @id @default(autoincrement())
  userId      Int
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  casa        String
  condition   String   // "ABOVE" or "BELOW"
  value       Float
  isTriggered Boolean  @default(false)
  createdAt   DateTime @default(now())
}
EOF
  
  echo "✅ Schema actualizado a PostgreSQL"
else
  echo "📝 Schema en SQLite para desarrollo"
fi
