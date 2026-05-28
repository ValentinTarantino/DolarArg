-- CreateTable
CREATE TABLE "DolarRate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "casa" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "compra" REAL NOT NULL,
    "venta" REAL NOT NULL,
    "fecha" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ExchangeRateHistory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "compra" REAL NOT NULL,
    "venta" REAL NOT NULL,
    "fecha" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "casa" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "isTriggered" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Alert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "DolarRate_casa_fecha_idx" ON "DolarRate"("casa", "fecha");

-- CreateIndex
CREATE INDEX "ExchangeRateHistory_codigo_tipo_fecha_idx" ON "ExchangeRateHistory"("codigo", "tipo", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
