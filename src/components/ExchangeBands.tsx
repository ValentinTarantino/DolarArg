"use client";

import React, { useState, useEffect } from 'react';
import { Compass } from 'lucide-react';
import { DolarRate } from '@/types/dolar';

interface ExchangeBandsProps {
  rates: DolarRate[];
}

interface BandasData {
  lower: number;
  upper: number;
  date: string;
}

export default function ExchangeBands({ rates }: ExchangeBandsProps) {
  const [bandas, setBandas] = useState<BandasData | null>(null);
  const [loadingBandas, setLoadingBandas] = useState(true);

  useEffect(() => {
    const fetchBandas = async () => {
      try {
        const res = await fetch('/api/bandas');
        if (res.ok) {
          const data = await res.json();
          setBandas(data);
        }
      } catch (err) {
        console.error('Error fetching bandas:', err);
      } finally {
        setLoadingBandas(false);
      }
    };
    fetchBandas();
  }, []);

  const activeRate = rates.find(r => r.casa === 'mayorista') || rates[0];

  if (rates.length === 0 || !activeRate || loadingBandas || !bandas) {
    return (
      <div className="panel" style={{ marginTop: '24px', textAlign: 'center', padding: '40px' }}>
        <p style={{ color: '#94a3b8' }}>Cargando bandas cambiarias...</p>
      </div>
    );
  }

  const lowerBand = bandas.lower;
  const upperBand = bandas.upper;
  const currentPrice = activeRate.venta;
  const range = upperBand - lowerBand;

  const percentage = range > 0 ? ((currentPrice - lowerBand) / range) * 100 : 0;
  const clampedPercentage = Math.max(0, Math.min(percentage, 100));

  const needleRotation = -90 + (clampedPercentage / 100) * 180;

  let stateLabel = 'Favorable';
  let stateColor = '#10b981';
  let stateBg = 'rgba(16, 185, 129, 0.06)';
  let stateBorder = 'rgba(16, 185, 129, 0.25)';

  if (clampedPercentage > 20 && clampedPercentage <= 75) {
    stateLabel = 'Intermedio';
    stateColor = '#eab308';
    stateBg = 'rgba(234, 179, 8, 0.06)';
    stateBorder = 'rgba(234, 179, 8, 0.25)';
  } else if (clampedPercentage > 75 && clampedPercentage <= 90) {
    stateLabel = 'Precaución';
    stateColor = '#f97316';
    stateBg = 'rgba(249, 115, 22, 0.06)';
    stateBorder = 'rgba(249, 115, 22, 0.25)';
  } else if (clampedPercentage > 90) {
    stateLabel = 'Crítico';
    stateColor = '#f43f5e';
    stateBg = 'rgba(244, 63, 94, 0.06)';
    stateBorder = 'rgba(244, 63, 94, 0.25)';
  }

  const descArc = (cx: number, cy: number, r: number, startDeg: number, endDeg: number) => {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const x1 = cx + r * Math.cos(toRad(startDeg));
    const y1 = cy - r * Math.sin(toRad(startDeg));
    const x2 = cx + r * Math.cos(toRad(endDeg));
    const y2 = cy - r * Math.sin(toRad(endDeg));
    const largeArc = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  const getRangeValue = (pct: number) => lowerBand + (pct / 100) * range;
  const ranges = [
    { name: 'Favorable',  pct: '0-20%',   min: lowerBand,         max: getRangeValue(20), color: '#10b981' },
    { name: 'Intermedio', pct: '20-75%',  min: getRangeValue(20), max: getRangeValue(75), color: '#eab308' },
    { name: 'Precaución', pct: '75-90%',  min: getRangeValue(75), max: getRangeValue(90), color: '#f97316' },
    { name: 'Crítico',    pct: '90-100%', min: getRangeValue(90), max: upperBand,         color: '#f43f5e' },
  ];

  const diffToUpper  = upperBand - currentPrice;
  const pctToUpper   = (diffToUpper / currentPrice) * 100;
  const diffToLower  = currentPrice - lowerBand;
  const pctToLower   = (diffToLower / currentPrice) * 100;
  const midpoint     = lowerBand + range / 2;

  const fmt = (n: number) => n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="panel" id="bands-panel" style={{ marginTop: '24px' }}>

      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '14px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap' }}>
          <div className="title-icon-wrapper" style={{ backgroundColor: 'rgba(99,102,241,0.1)', color: '#6366f1', flexShrink: 0 }}>
            <Compass size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff', fontWeight: 800 }}>Banda Cambiaria BCRA</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.5 }}>
              Las bandas aplican oficialmente al <strong style={{ color: '#a5b4fc' }}>Dólar Mayorista</strong> (COM 3500). 
            </p>
          </div>
          <span style={{ fontSize: '0.7rem', color: '#475569', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>Actualizado: {bandas.date}</span>
        </div>
      </div>


      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.25fr', gap: '40px' }} className="bands-content-grid">

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>

          <svg width="100%" height="auto" viewBox="0 0 300 185" style={{ overflow: 'visible', maxWidth: '300px', display: 'block' }}>
            <defs>
              <filter id="gauge-shadow">
                <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.5" />
              </filter>
            </defs>


            <path d={descArc(150,150,108,180,145)} fill="none" stroke="#10b981" strokeWidth="18" strokeLinecap="round" />
            <path d={descArc(150,150,108,142, 47)} fill="none" stroke="#eab308" strokeWidth="18" />
            <path d={descArc(150,150,108, 44, 19)} fill="none" stroke="#f97316" strokeWidth="18" />
            <path d={descArc(150,150,108, 16,  0)} fill="none" stroke="#f43f5e" strokeWidth="18" strokeLinecap="round" />
            <line x1="150" y1="33" x2="150" y2="44" stroke="rgba(255,255,255,0.18)" strokeWidth="2"/>
            <text x="150" y="22" fill="#64748b" fontSize="10" fontWeight="700" textAnchor="middle">
              ${Math.round(midpoint).toLocaleString('es-AR')}
            </text>

            <g
              transform={`translate(150,150) rotate(${needleRotation})`}
              style={{ transition: 'transform 1s cubic-bezier(0.34,1.56,0.64,1)' }}
              filter="url(#gauge-shadow)"
            >
              <polygon points="-4,10 4,10 1,-102 -1,-102" fill="#cbd5e1" />
              <polygon points="-2,10 2,10 0.5,-100 -0.5,-100" fill="#94a3b8" />
            </g>

            <circle cx="150" cy="150" r="15" fill="#1e293b" stroke="#475569" strokeWidth="2" />
            <circle cx="150" cy="150" r="7"  fill="#ffffff" />

            <text x="5"  y="178" fill="#cbd5e1" fontSize="14" fontWeight="700" textAnchor="start">
              ${Math.round(lowerBand).toLocaleString('es-AR')}
            </text>
            <text x="295" y="178" fill="#cbd5e1" fontSize="14" fontWeight="700" textAnchor="end">
              ${Math.round(upperBand).toLocaleString('es-AR')}
            </text>
          </svg>

          <div style={{
            padding: '10px 24px',
            backgroundColor: '#0f172a',
            border: `2px solid ${stateColor}`,
            borderRadius: '10px',
            textAlign: 'center',
            boxShadow: `0 4px 20px ${stateColor}25`,
            width: '88%',
          }}>
            <span style={{ fontSize: '1rem', fontWeight: 800, color: stateColor, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Dólar {activeRate.nombre}: ${fmt(currentPrice)}
            </span>
          </div>

          <div style={{
            padding: '6px 18px',
            background: stateBg,
            border: `1px solid ${stateBorder}`,
            borderRadius: '8px',
            textAlign: 'center',
            width: '88%',
          }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: stateColor }}>
              {percentage >= 0 && percentage <= 100
                ? `Al ${percentage.toFixed(2)}% de la banda · ${stateLabel}`
                : percentage < 0
                  ? `Por debajo de la banda inferior`
                  : `Superó la banda superior`}
            </span>
          </div>

          {/* Mini glosario */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', width: '100%' }}>
            {[
              { color: '#6366f1', title: '¿Qué es la banda cambiaria?', desc: 'Rango de precios dentro del cual el BCRA permite que fluctúe el dólar mayorista sin intervenir.' },
              { color: '#10b981', title: 'Banda inferior', desc: 'Piso del rango. Si el dólar cae a este nivel, el BCRA compra divisas para sostener el precio.' },
              { color: '#f43f5e', title: 'Banda superior', desc: 'Techo del rango. Si el dólar sube a este nivel, el BCRA vende reservas para contener la suba.' },
              { color: '#f59e0b', title: 'COM 3500', desc: 'Comunicación del BCRA que establece las reglas del sistema de bandas cambiarias vigente.' },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: '8px',
                padding: '8px 10px',
                backgroundColor: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '8px',
              }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: item.color, flexShrink: 0, marginTop: 5 }} />
                <div>
                  <span style={{ fontWeight: 700, fontSize: '0.78rem', color: '#f1f5f9' }}>{item.title}: </span>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', minWidth: 0 }}>

          <div>
            <p style={{ margin: '0 0 10px', fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Valores actuales de las bandas cambiarias
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <th style={{ padding: '7px 10px', color: '#64748b', fontWeight: 700, textAlign: 'left' }}>BANDA CAMBIARIA</th>
                  <th style={{ padding: '7px 10px', color: '#64748b', fontWeight: 700, textAlign: 'right' }}>VALOR</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'USD banda inferior',  value: lowerBand, color: '#10b981' },
                  { label: 'USD banda superior',  value: upperBand, color: '#f43f5e' },
                ].map(row => (
                  <tr key={row.label} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '10px', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: row.color, display: 'inline-block', flexShrink: 0 }} />
                      {row.label}
                    </td>
                    <td style={{ padding: '10px', color: '#fff', fontWeight: 700, textAlign: 'right' }}>
                      ${fmt(row.value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <p style={{ margin: '0 0 10px', fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Rango de valores
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {ranges.map((rng, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.04)',
                  backgroundColor: stateLabel === rng.name ? `${rng.color}10` : 'rgba(255,255,255,0.01)',
                  flexWrap: 'wrap',
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: rng.color, display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ color: rng.color, fontWeight: 700, fontSize: '0.82rem', minWidth: '80px' }}>{rng.name}</span>
                  <span style={{ color: '#64748b', fontSize: '0.75rem' }}>{rng.pct}</span>
                  <span style={{ marginLeft: 'auto', color: '#cbd5e1', fontSize: '0.78rem', fontFamily: 'monospace' }}>
                    ${fmt(rng.min)} – ${fmt(rng.max)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            backgroundColor: 'rgba(255,255,255,0.01)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '10px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}>
            <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Diferencias con las bandas
            </p>
            <div style={{ fontSize: '0.84rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: '#cbd5e1' }}>
                <span style={{ color: '#f43f5e', fontWeight: 900, marginTop: 1 }}>▲</span>
                {diffToUpper > 0
                  ? <span>El dólar debería subir <strong style={{ color: '#f43f5e' }}>${fmt(diffToUpper)}</strong> ({pctToUpper.toFixed(2)}%) para llegar a la banda superior.</span>
                  : <span style={{ color: '#f43f5e', fontWeight: 700 }}>El dólar ha superado la banda superior.</span>
                }
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: '#cbd5e1' }}>
                <span style={{ color: '#10b981', fontWeight: 900, marginTop: 1 }}>▼</span>
                {diffToLower > 0
                  ? <span>El dólar debería bajar <strong style={{ color: '#10b981' }}>${fmt(diffToLower)}</strong> ({pctToLower.toFixed(2)}%) para llegar a la banda inferior.</span>
                  : <span style={{ color: '#10b981', fontWeight: 700 }}>El dólar está por debajo de la banda inferior.</span>
                }
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
