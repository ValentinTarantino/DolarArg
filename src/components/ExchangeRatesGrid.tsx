"use client";

import React, { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';

interface ExchangeRate {
  codigo: string;
  nombre: string;
  compra: number;
  venta: number;
  fecha: Date;
}

const ExchangeRatesGrid: React.FC = () => {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/exchange-rates');
        if (!response.ok) throw new Error('Error al obtener cotizaciones');
        
        const data = await response.json();
        setRates(data);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Error al cargar las cotizaciones');
      } finally {
        setLoading(false);
      }
    };

    fetchRates();
  }, []);

  const getCurrencyEmoji = (codigo: string): string => {
    const emojis: Record<string, string> = {
      'EUR': '🇪🇺',
      'BRL': '🇧🇷'
    };
    return emojis[codigo] || '💱';
  };

  const getCardColor = (codigo: string): string => {
    const colors: Record<string, string> = {
      'EUR': 'border-blue-500/50 bg-blue-500/10',
      'BRL': 'border-green-500/50 bg-green-500/10'
    };
    return colors[codigo] || 'border-slate-500/50 bg-slate-500/10';
  };

  if (loading) {
    return (
      <div className="panel" style={{ textAlign: 'center', padding: '40px' }}>
        <p style={{ color: '#94a3b8' }}>Cargando cotizaciones...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="panel" style={{ textAlign: 'center', padding: '40px', color: '#f43f5e' }}>
        <p>❌ {error}</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f1f5f9', fontSize: '1.3rem', margin: 0 }}>
        <Globe size={24} /> Cotizaciones Internacionales
      </h2>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '16px' 
      }}>
        {rates.map(rate => (
          <div
            key={rate.codigo}
            className={`border rounded-lg p-6 transition-all ${getCardColor(rate.codigo)}`}
            style={{ backdropFilter: 'blur(10px)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span style={{ fontSize: '32px' }}>{getCurrencyEmoji(rate.codigo)}</span>
              <div>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0, marginBottom: '4px' }}>
                  {rate.codigo}
                </p>
                <p style={{ fontSize: '1rem', color: '#f1f5f9', margin: 0, fontWeight: '700' }}>
                  {rate.nombre}
                </p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{
                padding: '16px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <p style={{ fontSize: '0.75rem', color: '#10b981', margin: 0, marginBottom: '6px', fontWeight: '600' }}>
                  COMPRA
                </p>
                <p style={{ fontSize: '1.4rem', color: '#10b981', margin: 0, fontWeight: '700' }}>
                  ${rate.compra.toFixed(2)}
                </p>
              </div>

              <div style={{
                padding: '16px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <p style={{ fontSize: '0.75rem', color: '#ef4444', margin: 0, marginBottom: '6px', fontWeight: '600' }}>
                  VENTA
                </p>
                <p style={{ fontSize: '1.4rem', color: '#ef4444', margin: 0, fontWeight: '700' }}>
                  ${rate.venta.toFixed(2)}
                </p>
              </div>
            </div>

            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
                Spread: ${(rate.venta - rate.compra).toFixed(2)} • 
                Brecha: {(((rate.venta - rate.compra) / rate.compra * 100)).toFixed(2)}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExchangeRatesGrid;
