"use client";

import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface ExchangeRateSectionProps {
  currency: 'EUR' | 'BRL';
  highlightedCard?: { currency: string; tipo: string } | null;
  activeTab?: string;
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

const ExchangeRateSection: React.FC<ExchangeRateSectionProps> = ({ currency, highlightedCard, activeTab }) => {
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
    }
  };

  const info = currencyInfo[currency];

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const response = await fetch('/api/exchange-rates/variants');
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{
        padding: '20px',
        background: info.gradient,
        border: `1px solid ${info.color}30`,
        borderRadius: '16px',
        boxShadow: `0 4px 16px ${info.color}20`,
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          background: `linear-gradient(135deg, ${info.color}40 0%, ${info.color}20 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
          boxShadow: `0 4px 12px ${info.color}30`
        }}>
          {info.emoji}
        </div>
        <div>
          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: '#f1f5f9' }}>
            {info.name}
          </p>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
            {currency}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {rates.map((rate) => {
          const spread = (((rate.venta - rate.compra) / rate.compra) * 100).toFixed(1);
          const isHighlighted = activeTab === currency.toLowerCase() && highlightedCard?.currency === currency && highlightedCard?.tipo === rate.tipo;
          
          return (
            <div
              key={`${rate.codigo}-${rate.tipo}`}
              style={{
                padding: '20px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                transition: 'all 0.3s ease-out',
                ...(isHighlighted && {
                  transform: 'scale(1.05)',
                  boxShadow: '0 0 40px rgba(59, 130, 246, 0.8), 0 0 80px rgba(59, 130, 246, 0.5)',
                  border: '2px solid #3b82f6'
                })
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ fontSize: '1rem', fontWeight: '700', color: '#f1f5f9' }}>
                  {rate.tipo === 'oficial' ? 'Oficial' : rate.tipo === 'blue' ? 'Blue' : 'Tarjeta'}
                </span>
                {rate.variacion !== undefined && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    color: rate.variacion >= 0 ? '#10b981' : '#ef4444'
                  }}>
                    {rate.variacion >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                    <span>{rate.variacion >= 0 ? `+${rate.variacion.toFixed(2)}%` : `${rate.variacion.toFixed(2)}%`}</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600' }}>
                    COMPRA
                  </p>
                  <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: '700', color: '#10b981' }}>
                    ${rate.compra.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600' }}>
                    VENTA
                  </p>
                  <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: '700', color: '#ef4444' }}>
                    ${rate.venta.toFixed(2)}
                  </p>
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.85rem',
                fontWeight: '600',
                color: '#94a3b8'
              }}>
                <span>Brecha: <span style={{ color: '#3b82f6' }}>{spread}%</span></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ExchangeRateSection;
