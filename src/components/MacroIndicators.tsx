"use client";

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, RefreshCw } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, Tooltip, YAxis } from 'recharts';

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

const getRiesgoPaisLabel = (valor: number) => {
  if (valor < 600) return { label: 'Bajo', color: '#10b981' };
  if (valor < 1000) return { label: 'Moderado', color: '#f59e0b' };
  if (valor < 1500) return { label: 'Alto', color: '#f97316' };
  return { label: 'Crítico', color: '#ef4444' };
};

const formatMillones = (val: number) => {
  if (val >= 1000) return `U$S ${(val / 1000).toFixed(1)}B`;
  return `U$S ${val.toFixed(0)}M`;
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '6px 10px', fontSize: '0.75rem', color: '#e2e8f0' }}>
        {formatMillones(payload[0].value)}
      </div>
    );
  }
  return null;
};

const MacroIndicators: React.FC = () => {
  const [data, setData] = useState<MacroData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/macro');
      if (!res.ok) throw new Error('Error al cargar datos macro');
      const json = await res.json();
      setData(json);
      setLastUpdated(new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const rp = data?.riesgoPais;
  const res = data?.reservas;
  const infl = data?.inflacion;
  const rpStatus = rp ? getRiesgoPaisLabel(rp.valor) : null;

  return (
    <div className="panel">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '14px', marginBottom: '20px' }}>
        <div className="panel-title" style={{ border: 'none', padding: 0, margin: 0 }}>
          <span>Indicadores Macroeconómicos</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {lastUpdated && <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Act. {lastUpdated}</span>}
          <button onClick={fetchData} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '6px', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Cargando indicadores...</div>
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
          <div style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${rpStatus ? rpStatus.color + '33' : 'rgba(255,255,255,0.08)'}`, borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: rpStatus?.color || '#94a3b8', boxShadow: `0 0 8px ${rpStatus?.color || '#94a3b8'}` }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Riesgo País</span>
              </div>
              {rpStatus && (
                <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: rpStatus.color + '22', color: rpStatus.color, border: `1px solid ${rpStatus.color}44` }}>
                  {rpStatus.label}
                </span>
              )}
            </div>

            {rp ? (
              <>
                <div>
                  <p style={{ margin: 0, fontSize: '2.8rem', fontWeight: 800, color: rpStatus?.color || '#f1f5f9', lineHeight: 1 }}>
                    {rp.valor.toLocaleString('es-AR')}
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#64748b' }}>puntos básicos (EMBI+)</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {rp.variacion !== null && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', fontWeight: 600, color: rp.variacion >= 0 ? '#ef4444' : '#10b981' }}>
                      {rp.variacion >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      <span>{rp.variacion >= 0 ? '+' : ''}{rp.variacion.toFixed(2)}% vs día anterior</span>
                    </div>
                  )}
                </div>

                <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', fontSize: '0.78rem', color: '#64748b' }}>
                  <p style={{ margin: 0 }}>El <strong style={{ color: '#94a3b8' }}>Riesgo País</strong> (EMBI+) mide la sobretasa que paga Argentina sobre bonos del Tesoro de EE.UU. Menor valor = menor riesgo percibido por los mercados.</p>
                </div>

                <p style={{ margin: 0, fontSize: '0.72rem', color: '#475569' }}>Último dato: {new Date(rp.fecha).toLocaleDateString('es-AR')} · Fuente: ArgentinaDatos</p>
              </>
            ) : (
              <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Sin datos disponibles</p>
            )}
          </div>

          {/* Reservas BCRA */}
          <div style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 8px #3b82f6' }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Reservas BCRA</span>
            </div>

            {res ? (
              <>
                <div>
                  <p style={{ margin: 0, lineHeight: 1 }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.04em', marginRight: '6px' }}>USD</span>
                    <span style={{ fontSize: '2.8rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
                      {res.valor >= 1000 ? `${(res.valor / 1000).toFixed(1)}B` : `${res.valor.toFixed(0)}M`}
                    </span>
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#64748b' }}>reservas internacionales brutas</p>
                </div>

                {res.variacion !== null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', fontWeight: 600, color: res.variacion >= 0 ? '#10b981' : '#ef4444' }}>
                    {res.variacion >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    <span>{res.variacion >= 0 ? '+' : ''}{res.variacion.toFixed(2)}% vs día anterior</span>
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
                    <p style={{ margin: '6px 0 0', fontSize: '0.7rem', color: '#475569', textAlign: 'center' }}>Últimos 30 registros</p>
                  </div>
                )}

                <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', fontSize: '0.78rem', color: '#64748b' }}>
                  <p style={{ margin: 0 }}>Las <strong style={{ color: '#94a3b8' }}>reservas internacionales</strong> son los activos en moneda extranjera del BCRA. Indican la capacidad del banco central para intervenir en el mercado cambiario.</p>
                </div>
                <p style={{ margin: 0, fontSize: '0.72rem', color: '#475569' }}>Último dato: {new Date(res.fecha).toLocaleDateString('es-AR')} · Fuente: BCRA</p>
              </>
            ) : (
              <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Sin datos disponibles</p>
            )}
          </div>

          {/* Inflación mensual */}
          {infl && (
            <div style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,165,0,0.2)', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 8px #f59e0b' }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Inflación Mensual</span>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '2.8rem', fontWeight: 800, color: '#f59e0b', lineHeight: 1 }}>
                  {infl.valor.toFixed(1)}%
                </p>
                <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#64748b' }}>variación mensual del IPC (INDEC)</p>
              </div>
              <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', fontSize: '0.78rem', color: '#64748b' }}>
                <p style={{ margin: 0 }}>El <strong style={{ color: '#94a3b8' }}>Índice de Precios al Consumidor</strong> mide la variación de precios mensual. Su evolución impacta directamente en el tipo de cambio real.</p>
              </div>
              <p style={{ margin: 0, fontSize: '0.72rem', color: '#475569' }}>Período: {new Date(infl.fecha + 'T12:00:00').toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })} · Fuente: ArgentinaDatos / INDEC</p>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default MacroIndicators;
