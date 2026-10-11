"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, RefreshCw } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, Tooltip, YAxis } from 'recharts';
import { useLanguage } from './LanguageProvider';

interface RiesgoPais {
  valor: number;
  fecha: string;
  variacion: number | null;
}

interface Reservas {
  valor: number;
  fecha: string;
  variacion: number | null;
  history: { fecha: string; valor: number }[];
}

interface Inflacion {
  valor: number;
  fecha: string;
}

interface MacroData {
  riesgoPais: RiesgoPais | null;
  reservas: Reservas | null;
  inflacion: Inflacion | null;
}

const getRiesgoPaisColor = (valor: number) => {
  if (valor < 600) return '#00c878';
  if (valor < 1000) return '#f59e0b';
  if (valor < 1500) return '#f97316';
  return '#ef4444';
};

const formatMillones = (val: number) => {
  if (val >= 1000) return `U$S ${(val / 1000).toFixed(1)}B`;
  return `U$S ${val.toFixed(0)}M`;
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    return (
      <div className="macro-indicators__tooltip" style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '6px 10px', fontSize: '0.75rem', color: '#e2e8f0' }}>
        {formatMillones(payload[0].value)}
      </div>
    );
  }
  return null;
};

const MacroIndicators: React.FC = () => {
  const { t, language } = useLanguage();
  const [data, setData] = useState<MacroData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const res = await fetch('/api/macro', { cache: 'no-store' });
      if (!res.ok) throw new Error('Error al cargar datos macro');
      const json = await res.json();
      setData(current => ({
        riesgoPais: json.riesgoPais ?? current?.riesgoPais ?? null,
        reservas: json.reservas ?? current?.reservas ?? null,
        inflacion: json.inflacion ?? current?.inflacion ?? null,
      }));
      setLastUpdated(new Date().toLocaleTimeString(language === 'en' ? 'en-US' : 'es-AR', { hour: '2-digit', minute: '2-digit' }));
    } catch (e: any) {
      if (!silent) setError(e.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [language]);

  useEffect(() => {
    void fetchData();
    const refreshInterval = window.setInterval(() => void fetchData(true), 5 * 60 * 1000);
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void fetchData(true);
    };
    document.addEventListener('visibilitychange', refreshWhenVisible);

    return () => {
      window.clearInterval(refreshInterval);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [fetchData]);

  const rp = data?.riesgoPais;
  const res = data?.reservas;
  const infl = data?.inflacion;
  const rpColor = rp ? getRiesgoPaisColor(rp.valor) : null;

  return (
    <div className="panel macro-indicators">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '14px', marginBottom: '20px' }}>
        <div className="panel-title" style={{ border: 'none', padding: 0, margin: 0 }}>
          <span>{t('Indicadores Macroeconómicos')}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {lastUpdated && <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{t('Act.')} {lastUpdated}</span>}
          <button onClick={() => void fetchData(true)} aria-label={t('Actualizar indicadores macroeconómicos')} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '6px', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>{t('Cargando indicadores...')}</div>
      )}

      {error && (
        <div style={{ textAlign: 'center', padding: '24px', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>

          {/* Riesgo País */}
          <div style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${rpColor ? rpColor + '33' : 'rgba(255,255,255,0.08)'}`, borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('Riesgo País')}</span>
              </div>
            </div>

            {rp ? (
              <>
                <div>
                  <p className="macro-indicators__value" style={{ margin: 0, fontSize: '2.8rem', fontWeight: 800, color: rpColor || '#f1f5f9', lineHeight: 1 }}>
                    {rp.valor.toLocaleString('es-AR')}
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#64748b' }}>{t('puntos básicos (EMBI+)')}</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {rp.variacion !== null && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', fontWeight: 600, color: rp.variacion >= 0 ? '#ef4444' : '#00c878' }}>
                      {rp.variacion >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      <span>{rp.variacion >= 0 ? '+' : ''}{rp.variacion.toFixed(2)}% {t('vs día anterior')}</span>
                    </div>
                  )}
                </div>

                <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', fontSize: '0.78rem', color: '#64748b' }}>
                  <p style={{ margin: 0 }}>{t('El Riesgo País (EMBI+) mide la sobretasa que paga Argentina sobre bonos del Tesoro de EE.UU. Menor valor = menor riesgo percibido por los mercados.')}</p>
                </div>

                <p style={{ margin: 0, fontSize: '0.72rem', color: '#475569' }}>{t('Último dato')}: {new Date(rp.fecha).toLocaleDateString(language === 'en' ? 'en-US' : 'es-AR')} · {t('Fuente')}: ArgentinaDatos</p>
              </>
            ) : (
              <p style={{ color: '#64748b', fontSize: '0.85rem' }}>{t('Sin datos disponibles')}</p>
            )}
          </div>

          {/* Reservas BCRA */}
          <div style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('Reservas BCRA')}</span>
            </div>

            {res ? (
              <>
                <div>
                  <p style={{ margin: 0, lineHeight: 1 }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.04em', marginRight: '6px' }}>USD</span>
                    <span className="macro-indicators__value" style={{ fontSize: '2.8rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
                      {res.valor >= 1000 ? `${(res.valor / 1000).toFixed(1)}B` : `${res.valor.toFixed(0)}M`}
                    </span>
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#64748b' }}>{t('reservas internacionales brutas')}</p>
                </div>

                {res.variacion !== null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', fontWeight: 600, color: res.variacion >= 0 ? '#00c878' : '#ef4444' }}>
                    {res.variacion >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    <span>{res.variacion >= 0 ? '+' : ''}{res.variacion.toFixed(2)}% {t('vs día anterior')}</span>
                  </div>
                )}

                {res.history && res.history.length > 0 && (
                  <div style={{ height: '70px', marginTop: '4px', marginBottom: '8px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={res.history}>
                        <YAxis domain={['auto', 'auto']} hide />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="valor" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 3, fill: '#3b82f6' }} />
                      </LineChart>
                    </ResponsiveContainer>
                    <p style={{ margin: '6px 0 0', fontSize: '0.7rem', color: '#475569', textAlign: 'center' }}>{t('Últimos 30 registros')}</p>
                  </div>
                )}

                <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', fontSize: '0.78rem', color: '#64748b' }}>
                  <p style={{ margin: 0 }}>{t('Las reservas internacionales son los activos en moneda extranjera del BCRA. Indican la capacidad del banco central para intervenir en el mercado cambiario.')}</p>
                </div>
                <p style={{ margin: 0, fontSize: '0.72rem', color: '#475569' }}>{t('Último dato')}: {new Date(res.fecha).toLocaleDateString(language === 'en' ? 'en-US' : 'es-AR')} · {t('Fuente')}: BCRA</p>
              </>
            ) : (
              <p style={{ color: '#64748b', fontSize: '0.85rem' }}>{t('Sin datos disponibles')}</p>
            )}
          </div>

          {/* Inflación mensual */}
          {infl && (
            <div style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,165,0,0.2)', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('Inflación Mensual')}</span>
              </div>
              <div>
                <p className="macro-indicators__value" style={{ margin: 0, fontSize: '2.8rem', fontWeight: 800, color: '#f59e0b', lineHeight: 1 }}>
                  {infl.valor.toFixed(1)}%
                </p>
                <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#64748b' }}>{t('variación mensual del IPC (INDEC)')}</p>
              </div>
              <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', fontSize: '0.78rem', color: '#64748b' }}>
                <p style={{ margin: 0 }}>{t('El Índice de Precios al Consumidor mide la variación de precios mensual. Su evolución impacta directamente en el tipo de cambio real.')}</p>
              </div>
              <p style={{ margin: 0, fontSize: '0.72rem', color: '#475569' }}>{t('Período')}: {new Date(infl.fecha + 'T12:00:00').toLocaleDateString(language === 'en' ? 'en-US' : 'es-AR', { month: 'long', year: 'numeric' })} · {t('Fuente')}: ArgentinaDatos / INDEC</p>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default MacroIndicators;
