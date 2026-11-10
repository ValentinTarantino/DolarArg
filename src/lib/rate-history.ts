import { prisma } from '@/lib/db';
import { isDynamoEnabled, saveChangedDolarRates as saveDynamoDolarRates, saveChangedExchangeRates as saveDynamoExchangeRates } from '@/lib/dynamo';

const HISTORY_RETENTION_DAYS = 45;

type DolarRateInput = {
  casa: string;
  nombre: string;
  compra: number;
  venta: number;
};

type ExchangeRateInput = {
  codigo: string;
  tipo: string;
  compra: number;
  venta: number;
};

/** Store a snapshot only when its buy or sell price changed. */
export async function saveChangedDolarRates(rates: DolarRateInput[], fecha = new Date()) {
  if (isDynamoEnabled()) return saveDynamoDolarRates(rates, fecha);
  const snapshots = await Promise.all(rates.map(async (rate) => {
    const previous = await prisma.dolarRate.findFirst({
      where: { casa: rate.casa },
      orderBy: [{ fecha: 'desc' }, { id: 'desc' }],
      select: { compra: true, venta: true },
    });

    return !previous || previous.compra !== rate.compra || previous.venta !== rate.venta
      ? { ...rate, fecha }
      : null;
  }));
  const changed = snapshots.filter((rate): rate is DolarRateInput & { fecha: Date } => rate !== null);

  if (changed.length > 0) await prisma.dolarRate.createMany({ data: changed });
  return changed.length;
}

/** Store a snapshot only when its buy or sell price changed. */
export async function saveChangedExchangeRates(rates: ExchangeRateInput[], fecha = new Date()) {
  if (isDynamoEnabled()) return saveDynamoExchangeRates(rates, fecha);
  const snapshots = await Promise.all(rates.map(async (rate) => {
    const previous = await prisma.exchangeRateHistory.findFirst({
      where: { codigo: rate.codigo, tipo: rate.tipo },
      orderBy: [{ fecha: 'desc' }, { id: 'desc' }],
      select: { compra: true, venta: true },
    });

    return !previous || previous.compra !== rate.compra || previous.venta !== rate.venta
      ? {
          codigo: rate.codigo,
          tipo: rate.tipo,
          compra: rate.compra,
          venta: rate.venta,
          fecha,
        }
      : null;
  }));
  const changed = snapshots.filter((rate): rate is ExchangeRateInput & { fecha: Date } => rate !== null);

  if (changed.length > 0) await prisma.exchangeRateHistory.createMany({ data: changed });
  return changed.length;
}

/** Keep 30-day charts working and leave 15 days of outage margin. */
export async function pruneOldRateHistory(now = new Date()) {
  if (isDynamoEnabled()) {
    // DynamoDB tables use TTL; expired items are filtered by the read queries.
    return { cutoff: now.toISOString(), dolarRatesDeleted: 0, exchangeRatesDeleted: 0 };
  }
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - HISTORY_RETENTION_DAYS);

  const [dolarRates, exchangeRates] = await Promise.all([
    prisma.dolarRate.deleteMany({ where: { fecha: { lt: cutoff } } }),
    prisma.exchangeRateHistory.deleteMany({ where: { fecha: { lt: cutoff } } }),
  ]);

  return {
    cutoff: cutoff.toISOString(),
    dolarRatesDeleted: dolarRates.count,
    exchangeRatesDeleted: exchangeRates.count,
  };
}
