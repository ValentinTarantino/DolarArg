"use client";

import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, Info } from 'lucide-react';

interface ExchangeRateSectionProps {
  currency: 'EUR' | 'BRL' | 'CLP' | 'UYU';
  highlightedCard?: { currency: string; tipo: string } | null;
  activeTab?: string;
  apiEndpoint?: string;
}

interface RateData {
  codigo: string;
  casa: string;
  tipo: string;
  nombre: string;
  compra: number;
  venta: number;
  fecha: Date;
  variacion?: number; // Porcentaje de cambio
}

const ExchangeRateSection: React.FC<ExchangeRateSectionProps> = ({ currency, highlightedCard, activeTab, apiEndpoint }) => {
  const [rates, setRates] = useState<RateData[]>([]);
  const [loading, setLoading] = useState(true);

  const currencyInfo = {
    EUR: {
      name: 'Euro',
      emoji: '🇪🇺',
      color: '#3b82f6',
      lightColor: 'rgba(59, 130, 246, 0.15)',
      gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.05) 100%)'
    },
    BRL: {
      name: 'Real Brasileño',
      emoji: '🇧🇷',
      color: '#10b981',
      lightColor: 'rgba(16, 185, 129, 0.15)',
      gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.05) 100%)'
    },
    CLP: {
      name: 'Peso Chileno',
      emoji: '🇨🇱',
      color: '#f59e0b',
      lightColor: 'rgba(245, 158, 11, 0.15)',
      gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(245, 158, 11, 0.05) 100%)'
    },
    UYU: {
      name: 'Peso Uruguayo',
      emoji: '🇺🇾',
      color: '#a855f7',
      lightColor: 'rgba(168, 85, 247, 0.15)',
      gradient: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(168, 85, 247, 0.05) 100%)'
    }
  };

  const info = currencyInfo[currency];

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const response = await fetch(apiEndpoint || '/api/exchange-rates/variants');
        if (response.ok) {
          const data = await response.json();
          const currencyRates = data.filter((r: RateData) => r.codigo === currency);
          setRates(currencyRates);
        }
      } catch (error) {
        console.error('Error fetching rates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRates();
  }, [currency]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
        Cargando datos de {info.name}...
      </div>
    );
  }

  if (rates.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#f43f5e' }}>
        No se pudieron cargar los datos de {info.name}
      </div>
    );
  }

  const typeConfig: Record<string, { label: string; color: string; bg: string }> = {
    oficial:  { label: 'Oficial',  color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
    blue:     { label: 'Blue',     color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
    tarjeta:  { label: 'Tarjeta',  color: '#f43f5e', bg: 'rgba(244,63,94,0.12)'  },
  };

  const isRegionalCurrency = currency === 'CLP' || currency === 'UYU';

  return (
    <div className="panel" style={{ padding: '0', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{
        padding: '20px 24px',
        background: info.gradient,
        borderBottom: `1px solid ${info.color}25`,
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
      }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '12px',
          background: `linear-gradient(135deg, ${info.color}50, ${info.color}20)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.6rem', flexShrink: 0,
          boxShadow: `0 4px 12px ${info.color}30`,
        }}>
          {info.emoji}
        </div>
        <div>
          <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#f1f5f9' }}>{info.name}</p>
          <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: `${info.color}cc`, fontWeight: 600, letterSpacing: '0.06em' }}>{currency}</p>
        </div>
        {rates[0]?.fecha && (
          <div style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#475569', textAlign: 'right' }}>
            <span>Actualizado</span><br />
            <span style={{ fontWeight: 600, color: '#64748b' }}>{(() => { try { const d = new Date(rates[0].fecha); return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}hs`; } catch { return ''; } })()}</span>
          </div>
        )}
      </div>

      {/* Nota aclaratoria para CLP/UYU */}
      {isRegionalCurrency && (
        <div style={{ margin: '12px 24px 0', padding: '10px 14px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '8px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <Info size={14} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '1px' }} />
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.5 }}>
            No existe mercado paralelo (Blue) para esta moneda. Los consumos con tarjeta se liquidan al <strong style={{ color: '#f59e0b' }}>tipo de cambio turista</strong> (oficial + 30% de recargos impositivos vigentes en Argentina).
          </p>
        </div>
      )}

      {/* Cards */}
      <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: isRegionalCurrency ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: '14px' }}>
        {rates.map((rate) => {
          const spread = (((rate.venta - rate.compra) / rate.compra) * 100).toFixed(1);
          const isHighlighted = activeTab === currency.toLowerCase() && highlightedCard?.currency === currency && highlightedCard?.tipo === rate.tipo;
          const tc = typeConfig[rate.tipo] ?? { label: rate.tipo, color: '#94a3b8', icon: '💱' };

          return (
            <div
              key={`${rate.codigo}-${rate.tipo}`}
              style={{
                padding: '16px',
                background: 'rgba(255,255,255,0.03)',
                border: isHighlighted ? `2px solid #3b82f6` : `1px solid ${tc.color}30`,
                borderTop: `3px solid ${tc.color}`,
                borderRadius: '12px',
                transition: 'all 0.3s ease-out',
                ...(isHighlighted && {
                  transform: 'scale(1.03)',
                  boxShadow: '0 0 30px rgba(59,130,246,0.5)',
                })
              }}
            >
              {/* Tipo */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: tc.color, background: tc.bg, padding: '3px 10px', borderRadius: '20px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{tc.label}</span>
                </div>
                {rate.variacion !== undefined && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '3px',
                    fontSize: '0.75rem', fontWeight: 700,
                    color: rate.variacion >= 0 ? '#10b981' : '#ef4444',
                    backgroundColor: rate.variacion >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                    padding: '2px 7px', borderRadius: '20px',
                  }}>
                    {rate.variacion >= 0 ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                    {Math.abs(rate.variacion).toFixed(2)}%
                  </div>
                )}
              </div>

              {/* Compra / Venta */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <p style={{ margin: '0 0 3px', fontSize: '0.68rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>COMPRA</p>
                  <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#10b981' }}>${rate.compra.toFixed(2)}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 3px', fontSize: '0.68rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>VENTA</p>
                  <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#ef4444' }}>${rate.venta.toFixed(2)}</p>
                </div>
              </div>

              {/* Spread */}
              <div style={{
                padding: '5px 10px',
                backgroundColor: 'rgba(59,130,246,0.07)',
                border: '1px solid rgba(59,130,246,0.15)',
                borderRadius: '6px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Spread</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#3b82f6' }}>{spread}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ExchangeRateSection;
