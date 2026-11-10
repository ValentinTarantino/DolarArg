/*
 * Copia los datos de la base relacional a DynamoDB.
 *
 * Uso seguro:
 *   node scripts/migrate-rds-to-dynamo.cjs --dry-run
 *   MIGRATION_CONFIRM=YES node scripts/migrate-rds-to-dynamo.cjs
 *
 * El script no borra ni modifica RDS. Las tablas DynamoDB se escriben con
 * PutItem por lotes, por lo que puede ejecutarse nuevamente si fuera necesario.
 */

// Carga las mismas variables que usa Next.js al ejecutar la aplicación.
require('@next/env').loadEnvConfig(process.cwd());

const { PrismaClient } = require('@prisma/client');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  BatchWriteCommand,
  DynamoDBDocumentClient,
} = require('@aws-sdk/lib-dynamodb');

const prisma = new PrismaClient();
const region = process.env.DYNAMODB_REGION || process.env.AWS_REGION || 'us-east-2';
const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));

const tables = {
  rates: process.env.DYNAMO_DOLAR_RATES_TABLE || 'dolar-dev-rates',
  exchangeRates: process.env.DYNAMO_EXCHANGE_RATES_TABLE || 'dolar-dev-exchange-rates',
  users: process.env.DYNAMO_USERS_TABLE || 'dolar-dev-users',
  alerts: process.env.DYNAMO_ALERTS_TABLE || 'dolar-dev-alerts',
  passwordTokens: process.env.DYNAMO_PASSWORD_TOKENS_TABLE || 'dolar-dev-password-reset-tokens',
};

const dryRun = process.argv.includes('--dry-run');
const retentionSeconds = 45 * 24 * 60 * 60;

function iso(value) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function chunks(items, size = 25) {
  const result = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

async function batchPut(tableName, items) {
  if (dryRun || items.length === 0) return;

  for (const batch of chunks(items)) {
    let requestItems = {
      [tableName]: batch.map((Item) => ({ PutRequest: { Item } })),
    };

    // DynamoDB puede devolver elementos no procesados; reintentamos hasta que
    // la copia quede completa.
    for (let attempt = 1; Object.keys(requestItems).length > 0; attempt += 1) {
      const response = await dynamo.send(new BatchWriteCommand({ RequestItems: requestItems }));
      requestItems = response.UnprocessedItems || {};
      if (Object.keys(requestItems).length > 0) {
        if (attempt >= 8) throw new Error(`DynamoDB dejó elementos sin procesar en ${tableName}`);
        await new Promise((resolve) => setTimeout(resolve, Math.min(attempt * 250, 2000)));
      } else {
        break;
      }
    }
  }
}

async function main() {
  if (!dryRun && process.env.MIGRATION_CONFIRM !== 'YES') {
    throw new Error('Para escribir en DynamoDB ejecutá con MIGRATION_CONFIRM=YES. Primero podés usar --dry-run.');
  }

  console.log(`Región DynamoDB: ${region}`);
  console.log(`Modo: ${dryRun ? 'SIMULACIÓN (sin escrituras)' : 'MIGRACIÓN'}`);
  console.log('Tablas destino:', tables);

  const [rates, exchangeRates, users, alerts, passwordTokens] = await Promise.all([
    prisma.dolarRate.findMany(),
    prisma.exchangeRateHistory.findMany(),
    prisma.user.findMany(),
    prisma.alert.findMany(),
    prisma.passwordResetToken.findMany(),
  ]);

  const now = Math.floor(Date.now() / 1000);
  const expiry = now + retentionSeconds;

  const rateItems = rates.map((rate) => ({
    tipo_dolar: rate.casa,
    timestamp: new Date(rate.fecha).getTime(),
    nombre: rate.nombre,
    compra: rate.compra,
    venta: rate.venta,
    expira_en: expiry,
  }));

  const exchangeItems = exchangeRates.map((rate) => ({
    clave: `${rate.codigo}#${rate.tipo}`,
    timestamp: new Date(rate.fecha).getTime(),
    codigo: rate.codigo,
    tipo: rate.tipo,
    compra: rate.compra,
    venta: rate.venta,
    expira_en: expiry,
  }));

  const userItems = users.map((user) => ({
    email: user.email.toLowerCase(),
    id: user.id,
    password: user.password,
    createdAt: iso(user.createdAt),
  }));

  const alertItems = alerts.map((alert) => ({
    user_id: alert.userId,
    alert_id: alert.id,
    casa: alert.casa,
    condition: alert.condition,
    value: alert.value,
    isTriggered: alert.isTriggered,
    language: alert.language || 'es',
    createdAt: iso(alert.createdAt),
  }));

  const tokenItems = passwordTokens.map((token) => ({
    token: token.token,
    email: token.email.toLowerCase(),
    expiresAt: iso(token.expiresAt),
    expira_en: Math.floor(new Date(token.expiresAt).getTime() / 1000),
  }));

  const datasets = [
    ['rates', tables.rates, rateItems],
    ['exchange rates', tables.exchangeRates, exchangeItems],
    ['users', tables.users, userItems],
    ['alerts', tables.alerts, alertItems],
    ['password reset tokens', tables.passwordTokens, tokenItems],
  ];

  for (const [label, tableName, items] of datasets) {
    console.log(`${label}: ${items.length} registros${dryRun ? '' : ' para copiar'}`);
    await batchPut(tableName, items);
  }

  console.log(dryRun ? 'Simulación completada.' : 'Migración completada. RDS no fue modificado.');
}

main()
  .catch((error) => {
    console.error('Migración fallida:', error.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
