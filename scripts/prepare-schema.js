#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');

const sqliteSchema = `// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
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

model ExchangeRateHistory {
  id        Int      @id @default(autoincrement())
  codigo    String   // EUR o BRL
  tipo      String   // oficial, blue, tarjeta
  compra    Float
  venta     Float
  fecha     DateTime
  createdAt DateTime @default(now())

  @@index([codigo, tipo, fecha])
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

model PasswordResetToken {
  id        Int      @id @default(autoincrement())
  email     String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
}
`;

const postgresSchema = `// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "cockroachdb"
  url       = env("DATABASE_URL")
}

model DolarRate {
  id        Int      @id @default(sequence())
  casa      String
  nombre    String
  compra    Float
  venta     Float
  fecha     DateTime
  createdAt DateTime @default(now())

  @@index([casa, fecha])
}

model ExchangeRateHistory {
  id        Int      @id @default(sequence())
  codigo    String   // EUR o BRL
  tipo      String   // oficial, blue, tarjeta
  compra    Float
  venta     Float
  fecha     DateTime
  createdAt DateTime @default(now())

  @@index([codigo, tipo, fecha])
}

model User {
  id        Int      @id @default(sequence())
  email     String   @unique
  password  String
  createdAt DateTime @default(now())
  alerts    Alert[]
}

model Alert {
  id          Int      @id @default(sequence())
  userId      Int
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  casa        String
  condition   String   // "ABOVE" or "BELOW"
  value       Float
  isTriggered Boolean  @default(false)
  language    String   @default("es")
  createdAt   DateTime @default(now())
}

model PasswordResetToken {
  id        Int      @id @default(sequence())
  email     String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
}
`;

if (process.env.VERCEL || process.env.VERCEL_ENV) {
  console.log('🔄 Vercel detectado - preparando schema para PostgreSQL...');
  fs.writeFileSync(schemaPath, postgresSchema, 'utf-8');
  console.log('✅ Schema actualizado a PostgreSQL');
} else {
  console.log('📝 Desarrollo local - usando SQLite');
  fs.writeFileSync(schemaPath, sqliteSchema, 'utf-8');
}
