"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, TrendingDown, Search, RefreshCw, AlertTriangle } from 'lucide-react';

interface Coin {
  rank: number;
  id: string;
  symbol: string;
  name: string;
  image: string;
  price: number;
  change1h: number | null;
  change24h: number | null;
  change7d: number | null;
  change30d: number | null;
  marketCap: number;
  volume24h: number;
  circulatingSupply: number;
  updatedAt: string;
}

type SortKey = 'rank' | 'price' | 'change1h' | 'change24h' | 'change7d' | 'change30d' | 'marketCap' | 'volume24h';

const formatPrice = (n: number) => {
  if (n >= 1) return `U$S ${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (n >= 0.01) return `U$S ${n.toFixed(4)}`;
  return `U$S ${n.toFixed(6)}`;
};

const formatLarge = (n: number) => {
  if (n >= 1e12) return `U$S ${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `U$S ${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `U$S ${(n / 1e6).toFixed(2)}M`;
  return `U$S ${n.toLocaleString('es-AR')}`;
};

const formatSupply = (n: number, symbol: string) => {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B ${symbol}`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M ${symbol}`;
  return `${n.toLocaleString('es-AR')} ${symbol}`;
};

const PctCell: React.FC<{ value: number | null }> = ({ value }) => {
  if (value === null) return <span style={{ color: '#475569' }}>—</span>;
  const color = value >= 0 ? '#10b981' : '#ef4444';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color, fontWeight: 600 }}>
      {value >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {value >= 0 ? '+' : ''}{value.toFixed(2)}%
    </span>
  );
};

const CryptoTable: React.FC = () => {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const fetchCoins = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/criptos');
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCoins(data);
      setLastUpdated(new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCoins(); }, []);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'rank' ? 'asc' : 'desc');
    }
    setPage(1);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return coins
      .filter(c => !q || c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q))
      .sort((a, b) => {
        const av = a[sortKey] ?? (sortDir === 'asc' ? Infinity : -Infinity);
        const bv = b[sortKey] ?? (sortDir === 'asc' ? Infinity : -Infinity);
        return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
      });
  }, [coins, search, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const SortHeader: React.FC<{ label: string; k: SortKey }> = ({ label, k }) => (
    <th
      onClick={() => handleSort(k)}
      style={{ padding: '12px 14px', textAlign: k === 'rank' || k === 'price' ? 'left' : 'right', cursor: 'pointer', userSelect: 'none', color: sortKey === k ? '#3b82f6' : '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap', background: 'rgba(15,23,42,0.6)' }}
    >
      {label} {sortKey === k ? (sortDir === 'asc' ? '↑' : '↓') : ''}
    </th>
  );

  return (
    <div className="panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.4rem' }}></span>
          <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f1f5f9' }}>Cotizaciones de criptomonedas</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {lastUpdated && <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Act. {lastUpdated}</span>}
          <button onClick={fetchCoins} disabled={loading} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '6px', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
        <input
          type="text"
          placeholder="Buscar criptomoneda..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          style={{ width: '100%', padding: '10px 12px 10px 36px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#e2e8f0', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', padding: '16px', background: 'rgba(239,68,68,0.08)', borderRadius: '10px', marginBottom: '16px' }}>
          <AlertTriangle size={16} />
          <span>{error === 'Error 429' ? 'Límite de CoinGecko alcanzado. Reintentá en 1 minuto.' : error}</span>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>Cargando criptomonedas...</div>
      )}

      {!loading && !error && (
        <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <SortHeader label="#" k="rank" />
                <th style={{ padding: '12px 14px', textAlign: 'left', color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', background: 'rgba(15,23,42,0.6)' }}>Nombre</th>
                <SortHeader label="Precio" k="price" />
                <SortHeader label="1h %" k="change1h" />
                <SortHeader label="24h %" k="change24h" />
                <SortHeader label="7d %" k="change7d" />
                <SortHeader label="30d %" k="change30d" />
                <SortHeader label="Market cap" k="marketCap" />
                <SortHeader label="Volumen (24h)" k="volume24h" />
                <th style={{ padding: '12px 14px', textAlign: 'right', color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', background: 'rgba(15,23,42,0.6)' }}>Circulante</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((coin, i) => (
                <tr
                  key={coin.id}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.06)')}
                  onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)')}
                >
                  <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>{coin.rank}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img src={coin.image} alt={coin.name} width={28} height={28} style={{ borderRadius: '50%' }} />
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: '#f1f5f9' }}>{coin.name}</p>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>{coin.symbol}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#f1f5f9', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>{formatPrice(coin.price)}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right' }}><PctCell value={coin.change1h} /></td>
                  <td style={{ padding: '12px 14px', textAlign: 'right' }}><PctCell value={coin.change24h} /></td>
                  <td style={{ padding: '12px 14px', textAlign: 'right' }}><PctCell value={coin.change7d} /></td>
                  <td style={{ padding: '12px 14px', textAlign: 'right' }}><PctCell value={coin.change30d} /></td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', color: '#94a3b8', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{formatLarge(coin.marketCap)}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', color: '#94a3b8', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{formatLarge(coin.volume24h)}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', color: '#94a3b8', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{formatSupply(coin.circulatingSupply, coin.symbol)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>No se encontraron criptomonedas para "{search}"</p>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ padding: '8px 16px', background: page === 1 ? 'rgba(255,255,255,0.03)' : 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '8px', color: page === 1 ? '#475569' : '#3b82f6', cursor: page === 1 ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s' }}
              >
                ← Anterior
              </button>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                Página <strong style={{ color: '#f1f5f9' }}>{page}</strong> de <strong style={{ color: '#f1f5f9' }}>{totalPages}</strong>
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{ padding: '8px 16px', background: page === totalPages ? 'rgba(255,255,255,0.03)' : 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '8px', color: page === totalPages ? '#475569' : '#3b82f6', cursor: page === totalPages ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s' }}
              >
                Siguiente →
              </button>
            </div>
          )}
        </div>
      )}

      <p style={{ marginTop: '12px', fontSize: '0.72rem', color: '#475569', textAlign: 'right' }}>Fuente: CoinGecko · Top 50 por capitalización de mercado</p>
    </div>
  );
};

export default CryptoTable;
