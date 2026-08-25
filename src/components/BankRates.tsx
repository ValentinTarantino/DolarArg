"use client";

import React, { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import { useLanguage } from './LanguageProvider';

interface BankRate {
  banco: string;
  compra: number;
  venta: number;
  variacion: number;
  logo: string;
  logoUrl?: string;
}

const BankRates: React.FC = () => {
  const { t } = useLanguage();
  const [rates, setRates] = useState<BankRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'cards' | 'comparador'>('cards');
  const [sortBy, setSortBy] = useState<'compra' | 'venta'>('venta');

  useEffect(() => {
    const fetchBankRates = async () => {
      try {
        const response = await fetch('/api/bank-rates');
        if (response.ok) {
          const data = await response.json();
          setRates(data);
        }
      } catch (error) {
        console.error('Error fetching bank rates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBankRates();
    // Refresh every 5 minutes
    const interval = setInterval(fetchBankRates, 300000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
        {t('Cargando cotizaciones de bancos...')}
      </div>
    );
  }

  const sorted = [...rates].sort((a, b) =>
    sortBy === 'venta' ? a.venta - b.venta : b.compra - a.compra
  );
  const best = sorted[0];

  return (
    <div className="panel" id="bank-rates-panel">
      {/* Header con toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '14px', marginBottom: '20px' }}>
        <div className="panel-title" style={{ border: 'none', padding: 0, margin: 0 }}>
          <span>{t('Cotizaciones Bancos y Casas de Cambio')}</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['cards', 'comparador'] as const).map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: view === v ? '1px solid rgba(59,130,246,0.5)' : '1px solid rgba(255,255,255,0.1)',
              backgroundColor: view === v ? 'rgba(59,130,246,0.15)' : 'transparent',
              color: view === v ? '#3b82f6' : '#94a3b8',
              fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
            }}>
              {v === 'cards' ? t('Cotizaciones') : t('Comparador')}
            </button>
          ))}
        </div>
      </div>

      {view === 'cards' ? (
        <div className="bank-cards-grid">
          {rates.map((rate, index) => (
            <div key={index} style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', transition: 'all 0.25s ease' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px', height: '60px', alignItems: 'center' }}>
                {rate.logoUrl
                  ? <img
                      src={rate.logoUrl}
                      alt={rate.banco}
                      style={{
                        maxHeight: (rate.banco === 'Banco Nación' || rate.banco === 'Banco Provincia' || rate.banco === 'Banco Hipotecario') ? '72px' : '56px',
                        maxWidth: (rate.banco === 'Banco Nación' || rate.banco === 'Banco Provincia' || rate.banco === 'Banco Hipotecario') ? '140px' : '110px',
                        objectFit: 'contain'
                      }}
                    />
                  : <span style={{ fontSize: '2.5rem' }}>{rate.logo}</span>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: '0 0 3px', fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>{t('COMPRA')}</p>
                  <p style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#10b981' }}>${rate.compra.toFixed(2)}</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: '0 0 3px', fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>{t('VENTA')}</p>
                  <p style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#ef4444' }}>${rate.venta.toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Selector compra/venta */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>{t('Ordenar por:')}</span>
            {(['venta', 'compra'] as const).map(s => (
              <button key={s} onClick={() => setSortBy(s)} style={{
                padding: '5px 14px', borderRadius: '16px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                border: sortBy === s ? '1px solid rgba(59,130,246,0.5)' : '1px solid rgba(255,255,255,0.1)',
                backgroundColor: sortBy === s ? 'rgba(59,130,246,0.15)' : 'transparent',
                color: sortBy === s ? '#3b82f6' : '#94a3b8',
              }}>
                {s === 'venta' ? t('Menor venta (para comprar)') : t('Mayor compra (para vender)')}
              </button>
            ))}
          </div>

          {/* Banner del mejor */}
          {best && (
            <div style={{ padding: '14px 18px', background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.04))', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <Trophy size={20} color="#10b981" />
              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#10b981', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{sortBy === 'venta' ? t('Mejor opción para comprar') : t('Mejor opción para vender')}</p>
                <p style={{ margin: '2px 0 0', fontSize: '1rem', fontWeight: 800, color: '#f1f5f9' }}>
                  {best.banco} — {sortBy === 'venta' ? `${t('Venta')} $${best.venta.toFixed(2)}` : `${t('Compra')} $${best.compra.toFixed(2)}`}
                </p>
              </div>
            </div>
          )}

          {/* Tabla comparativa */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <th style={{ padding: '10px 12px', color: '#64748b', fontWeight: 700, textAlign: 'left' }}>#</th>
                  <th style={{ padding: '10px 12px', color: '#64748b', fontWeight: 700, textAlign: 'left' }}>{t('BANCO')}</th>
                  <th style={{ padding: '10px 12px', color: '#64748b', fontWeight: 700, textAlign: 'right' }}>{t('COMPRA')}</th>
                  <th style={{ padding: '10px 12px', color: '#64748b', fontWeight: 700, textAlign: 'right' }}>{t('VENTA')}</th>
                  <th style={{ padding: '10px 12px', color: '#64748b', fontWeight: 700, textAlign: 'right' }}>{t('SPREAD')}</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((rate, i) => {
                  const spread = (((rate.venta - rate.compra) / rate.compra) * 100).toFixed(1);
                  const isBest = i === 0;
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', backgroundColor: isBest ? 'rgba(16,185,129,0.05)' : 'transparent' }}>
                      <td style={{ padding: '10px 12px', color: isBest ? '#10b981' : '#475569', fontWeight: 700 }}>
                        {isBest ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#e2e8f0', fontWeight: 600 }}>{rate.banco}</td>
                      <td style={{ padding: '10px 12px', color: '#10b981', fontWeight: 700, textAlign: 'right' }}>${rate.compra.toFixed(2)}</td>
                      <td style={{ padding: '10px 12px', color: '#ef4444', fontWeight: 700, textAlign: 'right' }}>${rate.venta.toFixed(2)}</td>
                      <td style={{ padding: '10px 12px', color: '#94a3b8', textAlign: 'right' }}>{spread}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{ marginTop: '20px', padding: '12px 16px', backgroundColor: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '10px' }}>
        <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>
          {t('💡 Cotizaciones referenciales. Verificar con el banco antes de operar.')}
        </p>
      </div>
    </div>
  );
};

export default BankRates;
