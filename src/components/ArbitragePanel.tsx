"use client";

import React, { useState, useEffect } from 'react';
import { Percent, ArrowRightLeft, TrendingUp, Info, HelpCircle, Coins, ShieldAlert } from 'lucide-react';
import { DolarRate } from '@/types/dolar';

interface ArbitragePanelProps {
  rates: DolarRate[];
}

export default function ArbitragePanel({ rates }: ArbitragePanelProps) {
  const [usdAmount, setUsdAmount] = useState<string>('500');
  const [pesosCost, setPesosCost] = useState<number>(0);
  const [pesosReturn, setPesosReturn] = useState<number>(0);
  const [profit, setProfit] = useState<number>(0);
  const [profitPercent, setProfitPercent] = useState<number>(0);

  const oficialRate = rates.find(r => r.casa === 'oficial');
  const blueRate = rates.find(r => r.casa === 'blue');
  const mepRate = rates.find(r => r.casa === 'bolsa');
  const cclRate = rates.find(r => r.casa === 'contadoconliqui');
  const criptoRate = rates.find(r => r.casa === 'cripto');

  useEffect(() => {
    if (!mepRate || !blueRate || !usdAmount || isNaN(Number(usdAmount))) {
      setPesosCost(0);
      setPesosReturn(0);
      setProfit(0);
      setProfitPercent(0);
      return;
    }

    const qty = Number(usdAmount);
    const cost = qty * mepRate.venta;
    const revenue = qty * blueRate.compra;
    const netProfit = revenue - cost;
    const percentage = cost > 0 ? (netProfit / cost) * 100 : 0;

    setPesosCost(cost);
    setPesosReturn(revenue);
    setProfit(netProfit);
    setProfitPercent(percentage);
  }, [usdAmount, mepRate, blueRate]);

  if (!oficialRate || !blueRate) return null;

  const calculateGap = (targetVenta: number) => {
    return (((targetVenta - oficialRate.venta) / oficialRate.venta) * 100).toFixed(1);
  };

  const blueGap = calculateGap(blueRate.venta);
  const mepGap = mepRate ? calculateGap(mepRate.venta) : '0';
  const cclGap = cclRate ? calculateGap(cclRate.venta) : '0';
  const criptoGap = criptoRate ? calculateGap(criptoRate.venta) : '0';

  return (
    <div className="panel" id="arbitrage-panel">
      <div className="panel-title" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '14px', marginBottom: '20px' }}>
        <div className="title-icon-wrapper" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
          <Percent size={20} />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#ffffff', fontWeight: '800' }}>Brechas & Arbitraje</h3>
          <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>Análisis del spread de brechas cambiarias y arbitraje financiero</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }} className="arbitrage-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#cbd5e1', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingUp size={16} style={{ color: '#6366f1' }} />
            Diferencia vs Dólar Oficial (${oficialRate.venta.toFixed(2)})
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="gap-bar-container">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                <span style={{ fontWeight: '600', color: '#a5b4fc' }}>Dólar Blue</span>
                <span style={{ fontWeight: '800', color: '#6366f1' }}>+{blueGap}%</span>
              </div>
              <div className="progress-bg" style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="progress-bar" style={{ width: `${Math.min(Number(blueGap), 150)}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #a855f7)', borderRadius: '4px' }}></div>
              </div>
            </div>

            {mepRate && (
              <div className="gap-bar-container">
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                  <span style={{ fontWeight: '600', color: '#fde047' }}>Dólar MEP</span>
                  <span style={{ fontWeight: '800', color: '#f59e0b' }}>+{mepGap}%</span>
                </div>
                <div className="progress-bg" style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="progress-bar" style={{ width: `${Math.min(Number(mepGap), 150)}%`, height: '100%', background: 'linear-gradient(90deg, #f59e0b, #eab308)', borderRadius: '4px' }}></div>
                </div>
              </div>
            )}

            {cclRate && (
              <div className="gap-bar-container">
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                  <span style={{ fontWeight: '600', color: '#67e8f9' }}>Dólar CCL</span>
                  <span style={{ fontWeight: '800', color: '#06b6d4' }}>+{cclGap}%</span>
                </div>
                <div className="progress-bg" style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="progress-bar" style={{ width: `${Math.min(Number(cclGap), 150)}%`, height: '100%', background: 'linear-gradient(90deg, #06b6d4, #0891b2)', borderRadius: '4px' }}></div>
                </div>
              </div>
            )}
            {criptoRate && (
              <div className="gap-bar-container">
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                  <span style={{ fontWeight: '600', color: '#d8b4fe' }}>Dólar Cripto</span>
                  <span style={{ fontWeight: '800', color: '#a855f7' }}>+{criptoGap}%</span>
                </div>
                <div className="progress-bg" style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="progress-bar" style={{ width: `${Math.min(Number(criptoGap), 150)}%`, height: '100%', background: 'linear-gradient(90deg, #a855f7, #c084fc)', borderRadius: '4px' }}></div>
                </div>
              </div>
            )}
          </div>

          <div style={{
            display: 'flex',
            gap: '8px',
            backgroundColor: 'rgba(99, 102, 241, 0.05)',
            border: '1px solid rgba(99, 102, 241, 0.15)',
            borderRadius: '8px',
            padding: '12px',
            marginTop: '6px'
          }}>
            <Info size={16} style={{ color: '#6366f1', flexShrink: 0, marginTop: '2px' }} />
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', lineHeight: '1.4' }}>
              La **Brecha Cambiaria** mide la diferencia porcentual entre el tipo de cambio oficial y los tipos de cambio libres/financieros. Brechas altas suelen reflejar mayores expectativas de devaluación o restricciones cambiarias.
            </p>
          </div>
        </div>

        <div style={{
          borderLeft: '1px solid rgba(255,255,255,0.06)',
          paddingLeft: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }} className="arbitrage-calc-column">
          <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#cbd5e1', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Coins size={16} style={{ color: '#10b981' }} />
            Arbitraje Cambiario ("Hacer Puré")
          </h4>

          {mepRate && blueRate ? (
            <>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', lineHeight: '1.3' }}>
                Operación que consiste en adquirir dólares de forma legal en el mercado **MEP** (${mepRate.venta.toFixed(2)}) y venderlos en el mercado informal **Blue** (${blueRate.compra.toFixed(2)}).
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600' }}>Cantidad a arbitrar (USD)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', color: '#cbd5e1', fontSize: '0.9rem', fontWeight: '700' }}>USD</span>
                  <input
                    type="number"
                    value={usdAmount}
                    onChange={(e) => setUsdAmount(e.target.value)}
                    placeholder="Cantidad"
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 48px',
                      backgroundColor: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '0.9rem',
                      fontWeight: '700',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: '#94a3b8' }}>1. Compras en MEP por:</span>
                  <span style={{ color: '#ffffff', fontWeight: '600' }}>${pesosCost.toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: '#94a3b8' }}>2. Vendes en Blue por:</span>
                  <span style={{ color: '#ffffff', fontWeight: '600' }}>${pesosReturn.toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS</span>
                </div>

                <div style={{
                  backgroundColor: profit > 0 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.08)',
                  border: `1px solid ${profit > 0 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)'}`,
                  borderRadius: '8px',
                  padding: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '6px'
                }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>Ganancia Neta</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: '800', color: profit > 0 ? '#10b981' : '#f43f5e' }}>
                      +${profit.toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>Retorno %</span>
                    <span style={{ fontSize: '1rem', fontWeight: '800', color: profit > 0 ? '#10b981' : '#f43f5e' }}>
                      +{profitPercent.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div style={{
              display: 'flex',
              gap: '8px',
              backgroundColor: 'rgba(244, 63, 94, 0.05)',
              border: '1px solid rgba(244, 63, 94, 0.15)',
              borderRadius: '8px',
              padding: '12px',
              color: '#f43f5e',
              fontSize: '0.8rem'
            }}>
              <ShieldAlert size={16} style={{ flexShrink: 0 }} />
              <span>No hay cotizaciones suficientes para calcular el arbitraje.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
