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
      color: '#EAB308',
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
      color: '#D52B1E',
      lightColor: 'rgba(245, 158, 11, 0.15)',
      gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(245, 158, 11, 0.05) 100%)'
    },
    UYU: {
      name: 'Peso Uruguayo',
      emoji: '🇺🇾',
      color: '#75AADB',
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
    <div className={`panel exchange-panel exchange-panel--${currency.toLowerCase()} font-standard`} style={{ padding: '0', overflow: 'hidden' }}>

      {/* Header */}
      <div className="exchange-panel__header" style={{
        padding: '20px 24px',
        background: 'rgba(255,255,255,0.015)',
        borderBottom: '1px solid rgba(148,163,184,0.12)',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
      }}>
        <div>
          <p style={{ margin: 0, fontSize: '1.18rem', fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.02em' }}>{info.name}</p>
          <span style={{ display: 'block', marginTop: '3px', color: info.color, fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.08em' }}>{currency === 'BRL' ? 'R$' : currency === 'UYU' ? 'UY' : currency}</span>
        </div>
      </div>

      {/* Nota aclaratoria para CLP/UYU */}
      {isRegionalCurrency && (
        <div style={{ margin: '12px 24px 0', padding: '10px 12px', background: 'rgba(148,163,184,0.035)', borderLeft: '2px solid rgba(148,163,184,0.35)', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <Info size={14} style={{ color: '#94a3b8', flexShrink: 0, marginTop: '1px' }} />
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.5 }}>
            No existe mercado paralelo (Blue) para esta moneda. Los consumos con tarjeta se liquidan al <strong style={{ color: '#cbd5e1' }}>tipo de cambio turista</strong> (oficial + 30% de recargos impositivos vigentes en Argentina).
          </p>
        </div>
      )}

      {/* Cards */}
      <div style={{ padding: '20px 24px' }} className={isRegionalCurrency ? 'exchange-cards-grid exchange-cards-grid--2' : 'exchange-cards-grid exchange-cards-grid--3'}>
        {rates.map((rate) => {
          const spread = (((rate.venta - rate.compra) / rate.compra) * 100).toFixed(1);
          const isHighlighted = activeTab === currency.toLowerCase() && highlightedCard?.currency === currency && highlightedCard?.tipo === rate.tipo;
          const tc = typeConfig[rate.tipo] ?? { label: rate.tipo, color: '#94a3b8', icon: '💱' };

          return (
            <div
              key={`${rate.codigo}-${rate.tipo}`}
              style={{
                padding: '18px',
                background: isHighlighted ? 'linear-gradient(145deg, rgba(59,130,246,0.08), rgba(255,255,255,0.018) 52%)' : 'linear-gradient(145deg, rgba(255,255,255,0.028), rgba(255,255,255,0.008))',
                border: isHighlighted ? '1px solid rgba(96,165,250,0.5)' : '1px solid rgba(148,163,184,0.13)',
                borderTop: `2px solid ${tc.color}`,
                borderRadius: '12px',
                transition: 'border-color 0.2s ease, background 0.2s ease',
              }}
            >
              {/* Tipo */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: tc.color, background: tc.bg, border: `1px solid ${tc.color}30`, padding: '4px 8px', borderRadius: '6px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{tc.label}</span>
                </div>
                {rate.variacion !== undefined && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '3px',
                    fontSize: '0.75rem', fontWeight: 700,
                    color: rate.variacion >= 0 ? '#10b981' : '#ef4444',
                    padding: '2px 0',
                  }}>
                    {rate.variacion >= 0 ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                    {Math.abs(rate.variacion).toFixed(2)}%
                  </div>
                )}
              </div>

              {/* Compra / Venta */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                <div>
                  <p style={{ margin: '0 0 6px', fontSize: '0.65rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.09em' }}>COMPRA</p>
                  <p className="exchange-rate-number" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#34d399', letterSpacing: '-0.025em' }}>${rate.compra.toFixed(2)}</p>
                </div>
                <div style={{ borderLeft: '1px solid rgba(148,163,184,0.12)', paddingLeft: '12px' }}>
                  <p style={{ margin: '0 0 6px', fontSize: '0.65rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.09em' }}>VENTA</p>
                  <p className="exchange-rate-number" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#fda4af', letterSpacing: '-0.025em' }}>${rate.venta.toFixed(2)}</p>
                </div>
              </div>

              {/* Spread */}
              <div style={{
                padding: '10px 0 0',
                borderTop: '1px solid rgba(148,163,184,0.12)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500 }}>Spread</span>
                <span className="exchange-rate-number" style={{ fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8' }}>{spread}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ExchangeRateSection;
