import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';

const RETENTION_DAYS = 45;
const region = process.env.DYNAMODB_REGION || process.env.AWS_REGION || 'us-east-2';
const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));

export const DYNAMO_TABLES = {
  dolarRates: process.env.DYNAMO_DOLAR_RATES_TABLE || 'dolar-dev-rates',
  exchangeRates: process.env.DYNAMO_EXCHANGE_RATES_TABLE || 'dolar-dev-exchange-rates',
  users: process.env.DYNAMO_USERS_TABLE || 'dolar-dev-users',
  alerts: process.env.DYNAMO_ALERTS_TABLE || 'dolar-dev-alerts',
  passwordTokens: process.env.DYNAMO_PASSWORD_TOKENS_TABLE || 'dolar-dev-password-reset-tokens',
};

export function isDynamoEnabled() {
  return process.env.DB_PROVIDER === 'dynamo';
}

function expiry(now: Date) {
  return Math.floor((now.getTime() + RETENTION_DAYS * 24 * 60 * 60 * 1000) / 1000);
}

export type StoredDolarRate = {
  id: number;
  casa: string;
  nombre: string;
  compra: number;
  venta: number;
  fecha: Date;
  createdAt: Date;
};

export async function getLatestDolarRate(casa: string): Promise<StoredDolarRate | null> {
  const result = await client.send(new QueryCommand({
    TableName: DYNAMO_TABLES.dolarRates,
    KeyConditionExpression: 'tipo_dolar = :casa',
    ExpressionAttributeValues: { ':casa': casa },
    ScanIndexForward: false,
    Limit: 1,
  }));
  const item = result.Items?.[0];
  return item ? toDolarRate(item) : null;
}

export async function getLatestDolarRates(casas: string[]) {
  return (await Promise.all(casas.map((casa) => getLatestDolarRate(casa)))).filter(
    (rate): rate is StoredDolarRate => rate !== null,
  );
}

export async function getDolarRatesSince(casas: string[], from: Date) {
  const records = await Promise.all(casas.map(async (casa) => {
    const result = await client.send(new QueryCommand({
      TableName: DYNAMO_TABLES.dolarRates,
      KeyConditionExpression: 'tipo_dolar = :casa AND #ts > :from',
      ExpressionAttributeNames: { '#ts': 'timestamp' },
      ExpressionAttributeValues: { ':casa': casa, ':from': from.getTime() },
      ScanIndexForward: true,
    }));
    return (result.Items || []).map(toDolarRate);
  }));
  return records.flat().sort((a, b) => a.id - b.id);
}

export async function getDolarHistory(casa: string, from: Date) {
  const result = await client.send(new QueryCommand({
    TableName: DYNAMO_TABLES.dolarRates,
    KeyConditionExpression: 'tipo_dolar = :casa AND #ts >= :from',
    ExpressionAttributeNames: { '#ts': 'timestamp' },
    ExpressionAttributeValues: { ':casa': casa, ':from': from.getTime() },
    ScanIndexForward: true,
  }));
  return (result.Items || []).map(toDolarRate);
}

export async function saveChangedDolarRates(rates: Array<{
  casa: string;
  nombre: string;
  compra: number;
  venta: number;
}>, fecha = new Date()) {
  let saved = 0;
  for (const rate of rates) {
    const previous = await getLatestDolarRate(rate.casa);
    if (previous && previous.compra === rate.compra && previous.venta === rate.venta) continue;
    await client.send(new PutCommand({
      TableName: DYNAMO_TABLES.dolarRates,
      Item: {
        tipo_dolar: rate.casa,
        timestamp: fecha.getTime(),
        nombre: rate.nombre,
        compra: rate.compra,
        venta: rate.venta,
        expira_en: expiry(fecha),
      },
    }));
    saved++;
  }
  return saved;
}

export type StoredExchangeRate = {
  codigo: string;
  tipo: string;
  compra: number;
  venta: number;
  fecha: Date;
  createdAt: Date;
};

export async function getLatestExchangeRate(codigo: string, tipo: string) {
  const result = await client.send(new QueryCommand({
    TableName: DYNAMO_TABLES.exchangeRates,
    KeyConditionExpression: 'clave = :clave',
    ExpressionAttributeValues: { ':clave': `${codigo}#${tipo}` },
    ScanIndexForward: false,
    Limit: 1,
  }));
  const item = result.Items?.[0];
  return item ? toExchangeRate(item) : null;
}

export async function saveChangedExchangeRates(rates: Array<{
  codigo: string;
  tipo: string;
  compra: number;
  venta: number;
}>, fecha = new Date()) {
  let saved = 0;
  for (const rate of rates) {
    const previous = await getLatestExchangeRate(rate.codigo, rate.tipo);
    if (previous && previous.compra === rate.compra && previous.venta === rate.venta) continue;
    await client.send(new PutCommand({
      TableName: DYNAMO_TABLES.exchangeRates,
      Item: {
        clave: `${rate.codigo}#${rate.tipo}`,
        timestamp: fecha.getTime(),
        codigo: rate.codigo,
        tipo: rate.tipo,
        compra: rate.compra,
        venta: rate.venta,
        expira_en: expiry(fecha),
      },
    }));
    saved++;
  }
  return saved;
}

export async function getExchangeHistory(codigo: string, tipo: string | undefined, from: Date) {
  const types = tipo ? [tipo] : ['oficial', 'blue', 'tarjeta'];
  const records = await Promise.all(types.map(async (currentType) => {
    const result = await client.send(new QueryCommand({
      TableName: DYNAMO_TABLES.exchangeRates,
      KeyConditionExpression: 'clave = :clave AND #ts >= :from',
      ExpressionAttributeNames: { '#ts': 'timestamp' },
      ExpressionAttributeValues: { ':clave': `${codigo}#${currentType}`, ':from': from.getTime() },
      ScanIndexForward: true,
      Limit: 500,
    }));
    return (result.Items || []).map(toExchangeRate);
  }));
  return records.flat().sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
}

export async function getDynamoUserByEmail(email: string) {
  const result = await client.send(new GetCommand({
    TableName: DYNAMO_TABLES.users,
    Key: { email: email.toLowerCase() },
  }));
  return result.Item || null;
}

export async function putDynamoUser(user: { email: string; password: string; id: number; createdAt: Date }) {
  await client.send(new PutCommand({
    TableName: DYNAMO_TABLES.users,
    Item: { ...user, email: user.email.toLowerCase(), createdAt: user.createdAt.toISOString() },
  }));
}

export async function getDynamoUserById(id: number) {
  const result = await client.send(new ScanCommand({
    TableName: DYNAMO_TABLES.users,
    FilterExpression: '#id = :id',
    ExpressionAttributeNames: { '#id': 'id' },
    ExpressionAttributeValues: { ':id': id },
    Limit: 1,
  }));
  return result.Items?.[0] || null;
}

export async function updateDynamoUserPassword(email: string, password: string) {
  await client.send(new UpdateCommand({
    TableName: DYNAMO_TABLES.users,
    Key: { email: email.toLowerCase() },
    UpdateExpression: 'SET #password = :password',
    ExpressionAttributeNames: { '#password': 'password' },
    ExpressionAttributeValues: { ':password': password },
  }));
}

export async function getDynamoPasswordToken(token: string) {
  const result = await client.send(new GetCommand({
    TableName: DYNAMO_TABLES.passwordTokens,
    Key: { token },
  }));
  return result.Item || null;
}

export async function putDynamoPasswordToken(token: string, email: string, expiresAt: Date) {
  await client.send(new PutCommand({
    TableName: DYNAMO_TABLES.passwordTokens,
    Item: { token, email: email.toLowerCase(), expiresAt: expiresAt.toISOString(), expira_en: Math.floor(expiresAt.getTime() / 1000) },
  }));
}

export async function deleteDynamoPasswordToken(token: string) {
  await client.send(new DeleteCommand({ TableName: DYNAMO_TABLES.passwordTokens, Key: { token } }));
}

export type DynamoAlert = {
  id: number;
  userId: number;
  casa: string;
  condition: string;
  value: number;
  isTriggered: boolean;
  language: string;
  createdAt: Date;
  user: { email: string };
};

export async function getDynamoAlerts(userId: number) {
  const result = await client.send(new QueryCommand({
    TableName: DYNAMO_TABLES.alerts,
    KeyConditionExpression: 'user_id = :userId',
    ExpressionAttributeValues: { ':userId': userId },
    ScanIndexForward: false,
  }));
  return (result.Items || []).map(toAlert);
}

export async function getDynamoActiveAlerts() {
  const result = await client.send(new ScanCommand({
    TableName: DYNAMO_TABLES.alerts,
    FilterExpression: 'isTriggered = :false',
    ExpressionAttributeValues: { ':false': false },
  }));
  return (result.Items || []).map(toAlert);
}

export async function createDynamoAlert(alert: Omit<DynamoAlert, 'createdAt' | 'user'> & { createdAt?: Date }) {
  const createdAt = alert.createdAt || new Date();
  await client.send(new PutCommand({
    TableName: DYNAMO_TABLES.alerts,
    Item: {
      user_id: alert.userId,
      alert_id: alert.id,
      casa: alert.casa,
      condition: alert.condition,
      value: alert.value,
      isTriggered: alert.isTriggered,
      language: alert.language,
      createdAt: createdAt.toISOString(),
    },
  }));
  return { ...alert, createdAt };
}

export async function getDynamoAlert(id: number, userId?: number) {
  if (userId !== undefined) {
    const result = await client.send(new GetCommand({ TableName: DYNAMO_TABLES.alerts, Key: { user_id: userId, alert_id: id } }));
    return result.Item ? toAlert(result.Item) : null;
  }
  const result = await client.send(new ScanCommand({
    TableName: DYNAMO_TABLES.alerts,
    FilterExpression: 'alert_id = :id',
    ExpressionAttributeValues: { ':id': id },
    Limit: 1,
  }));
  return result.Items?.[0] ? toAlert(result.Items[0]) : null;
}

export async function deleteDynamoAlert(id: number, userId: number) {
  await client.send(new DeleteCommand({ TableName: DYNAMO_TABLES.alerts, Key: { user_id: userId, alert_id: id } }));
}

export async function markDynamoAlertTriggered(id: number, userId: number) {
  await client.send(new UpdateCommand({
    TableName: DYNAMO_TABLES.alerts,
    Key: { user_id: userId, alert_id: id },
    UpdateExpression: 'SET isTriggered = :true',
    ExpressionAttributeValues: { ':true': true },
  }));
}

function toDolarRate(item: Record<string, any>): StoredDolarRate {
  const date = new Date(Number(item.timestamp));
  return { id: Number(item.timestamp), casa: item.tipo_dolar, nombre: item.nombre, compra: Number(item.compra), venta: Number(item.venta), fecha: date, createdAt: date };
}

function toExchangeRate(item: Record<string, any>): StoredExchangeRate {
  const date = new Date(Number(item.timestamp));
  return { codigo: item.codigo, tipo: item.tipo, compra: Number(item.compra), venta: Number(item.venta), fecha: date, createdAt: date };
}

function toAlert(item: Record<string, any>): DynamoAlert {
  return {
    id: Number(item.alert_id),
    userId: Number(item.user_id),
    casa: item.casa,
    condition: item.condition,
    value: Number(item.value),
    isTriggered: Boolean(item.isTriggered),
    language: item.language || 'es',
    createdAt: new Date(item.createdAt),
    user: { email: '' },
  };
}
