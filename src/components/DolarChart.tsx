"use client";

import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { LineChart as ChartIcon, Calendar, TrendingUp, TrendingDown, BarChart2, Activity, CircleDot, ChevronDown } from 'lucide-react';
import { useLanguage } from './LanguageProvider';

interface ChartDataPoint {
  compra: number;
  venta: number;
  fechaFormateada: string;
}

interface RankingItem {
  casa: string;
  nombre: string;
  variacion: number;
  actual: number;
}

interface DolarChartProps {
  selectedCasa: string;
  selectedName: string;
  onSelectCasa?: (casa: string) => void;
}

const DolarChart: React.FC<DolarChartProps> = ({ selectedCasa, selectedName, onSelectCasa }) => {
  const { t, language } = useLanguage();
  const [historyData, setHistoryData] = useState<ChartDataPoint[]>([]);
  const [days, setDays] = useState<number>(30);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/dolar/history?type=${selectedCasa}&days=${days}`, {
          cache: 'no-store'
        });
        if (!response.ok) {
          throw new Error('No se pudo cargar el historial');
        }
        const data = await response.json();
        console.log('[DolarChart] Datos recibidos:', data.length, 'registros');
        setHistoryData(data);
      } catch (err: any) {
        setError(err.message || 'Error cargando datos del gráfico');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [selectedCasa, days]);

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const res = await fetch(`/api/dolar/ranking?days=${days}`);
        if (res.ok) {
          const data = await res.json();
          setRanking(data);
        }
      } catch (err) {
        console.error('Error fetching ranking:', err);
      }
    };
    fetchRanking();
  }, [days]);

  const getStrokeColor = (casa: string) => {
    switch (casa) {
      case 'blue': return '#6366f1'; // Indigo
      case 'oficial': return '#3b82f6'; // Celeste / Azul
      case 'bolsa': return '#f59e0b'; // Amber
      case 'contadoconliqui': return '#06b6d4'; // Cyan
      case 'tarjeta': return '#f43f5e'; // Rose
      case 'cripto': return '#a855f7'; // Purple
      default: return '#64748b'; // Slate
    }
  };

  const color = getStrokeColor(selectedCasa);

  const dolarTypes = [
    { casa: 'oficial', nombre: 'Oficial' },
    { casa: 'blue', nombre: 'Blue' },
    { casa: 'bolsa', nombre: 'MEP' },
    { casa: 'contadoconliqui', nombre: 'Contado con Liqui' },
    { casa: 'tarjeta', nombre: 'Tarjeta' },
    { casa: 'cripto', nombre: 'Cripto' },
    { casa: 'mayorista', nombre: 'Mayorista' }
  ];

  const stats = React.useMemo(() => {
    if (historyData.length < 2) return null;
    const ventas = historyData.map(d => d.venta).filter(v => v > 0);
    if (ventas.length === 0) return null;
    const max = Math.max(...ventas);
    const min = Math.min(...ventas);
    const avg = ventas.reduce((a, b) => a + b, 0) / ventas.length;
    const first = ventas[0];
    const last = ventas[ventas.length - 1];
    const variacion = ((last - first) / first) * 100;
    return { max, min, avg, variacion, first, last };
  }, [historyData]);

  const semaphore = React.useMemo(() => {
    if (!stats) return null;
    const { max, min, last } = stats;
    const range = max - min;
    if (range === 0) return { color: '#f59e0b', label: 'Neutral', desc: 'Sin variación en el período' };
    const position = (last - min) / range; // 0 = mínimo, 1 = máximo
    if (position <= 0.33) {
      return { color: '#10b981', label: 'Buen momento', desc: 'Precio cerca del mínimo del período. Puede ser buen momento para comprar.' };
    } else if (position <= 0.66) {
      return { color: '#f59e0b', label: 'Zona neutra', desc: 'Precio en rango medio. Evaluar con cuidado.' };
    } else {
      return { color: '#ef4444', label: 'Precio alto', desc: 'Precio cerca del máximo del período. Considerar esperar.' };
    }
  }, [stats]);

  return (
    <div className="panel">
      <div className="panel-title" style={{ position: 'relative' }}>
        <span>Evolución del Dolar: </span>
        {onSelectCasa ? (
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                padding: '4px 12px',
                color: '#f1f5f9',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.9rem',
                fontWeight: '600'
              }}
            >
              {t(selectedName)}
              <ChevronDown size={16} style={{ transition: 'transform 0.2s', transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
            </button>
            {dropdownOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: '0',
                marginTop: '8px',
                background: '#1e293b',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                zIndex: 1000,
                minWidth: '200px'
              }}>
                {dolarTypes.map((tipo) => (
                  <button
                    key={tipo.casa}
                    onClick={() => {
                      onSelectCasa(tipo.casa);
                      setDropdownOpen(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      background: 'transparent',
                      border: 'none',
                      color: selectedCasa === tipo.casa ? '#3b82f6' : '#cbd5e1',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '0.9rem',
                      fontWeight: selectedCasa === tipo.casa ? '600' : '400',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {t(tipo.nombre)}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <span>{selectedName}</span>
        )}
      </div>

      <div className="chart-controls">
        <div className="btn-group">
          <button 
            className={`tab-btn ${days === 7 ? 'active' : ''}`} 
            onClick={() => setDays(7)}
          >
            7 Días
          </button>
          <button 
            className={`tab-btn ${days === 30 ? 'active' : ''}`} 
            onClick={() => setDays(30)}
          >
            30 Días
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '0.85rem' }}>
          <Calendar size={16} />
          <span>Frecuencia: Diaria</span>
        </div>
      </div>

      {loading ? (
        <div style={{ height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
          Cargando datos históricos...
        </div>
      ) : error ? (
        <div style={{ height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f43f5e', fontWeight: 'bold' }}>
          {error}
        </div>
      ) : historyData.length === 0 ? (
        <div style={{ height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
          No hay datos históricos disponibles para este período.
        </div>
      ) : (
        <div className="chart-wrapper" style={{ height: '400px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="compraGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="ventaGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.2}/>
                  <stop offset="95%" stopColor={color} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
              <XAxis 
                dataKey="fechaFormateada" 
                stroke="#64748b" 
                tickLine={false} 
                style={{ fontSize: '0.75rem' }} 
              />
              <YAxis 
                stroke="#64748b" 
                tickLine={false} 
                domain={['auto', 'auto']}
                style={{ fontSize: '0.75rem' }} 
              />
              <Tooltip 
                content={({ active, payload, label }: any) => {
                  if (!active || !payload || payload.length === 0) return null;

                  const compra = payload.find((item: any) => item.dataKey === 'compra');
                  const venta = payload.find((item: any) => item.dataKey === 'venta');
                  const formatValue = (value: number) => value.toLocaleString(language === 'en' ? 'en-US' : 'es-AR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  });

                  return (
                    <div style={{
                      backgroundColor: '#12131c',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      padding: '12px',
                      color: '#f8fafc'
                    }}>
                      <p style={{ margin: '0 0 10px', fontWeight: 600 }}>{label}</p>
                      {venta && (
                        <p style={{ margin: '0 0 8px', color: color }}>
                          {`${t('Venta')}: ${formatValue(Number(venta.value))}`}
                        </p>
                      )}
                      {compra && (
                        <p style={{ margin: 0, color: '#10b981' }}>
                          {`${t('Compra')}: ${formatValue(Number(compra.value))}`}
                        </p>
                      )}
                    </div>
                  );
                }}
                contentStyle={{ 
                  backgroundColor: '#12131c', 
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  color: '#f8fafc' 
                }} 
              />
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconType="circle" 
                style={{ fontSize: '0.85rem' }}
              />
              <Line 
                name={t('Compra')}
                type="monotone" 
                dataKey="compra" 
                stroke="#10b981" 
                strokeWidth={3} 
                dot={false}
                activeDot={{ r: 6 }} 
              />
              <Line 
                name={t('Venta')}
                type="monotone" 
                dataKey="venta" 
                stroke={color} 
                strokeWidth={3} 
                dot={false}
                activeDot={{ r: 6 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {stats && !loading && !error && (
        <div className="chart-stats-grid">
          <div className="chart-stat-card">
            <TrendingUp size={16} className="stat-icon green" />
            <span className="stat-label">Máximo</span>
            <span className="stat-value">${stats.max.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="chart-stat-card">
            <TrendingDown size={16} className="stat-icon red" />
            <span className="stat-label">Mínimo</span>
            <span className="stat-value">${stats.min.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="chart-stat-card">
            <Activity size={16} className="stat-icon blue" />
            <span className="stat-label">Promedio</span>
            <span className="stat-value">${stats.avg.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="chart-stat-card">
            <BarChart2 size={16} className={stats.variacion >= 0 ? 'stat-icon green' : 'stat-icon red'} />
            <span className="stat-label">Variación {days}d</span>
            <span className={`stat-value ${stats.variacion >= 0 ? 'positive' : 'negative'}`}>
              {stats.variacion >= 0 ? '+' : ''}{stats.variacion.toFixed(2)}%
            </span>
          </div>
        </div>
      )}

      {semaphore && stats && !loading && !error && (
        <div className="semaphore-panel">
          <div className="semaphore-light" style={{ backgroundColor: semaphore.color, boxShadow: `0 0 20px ${semaphore.color}40` }}>
            <CircleDot size={20} color="#fff" />
          </div>
          <div className="semaphore-info">
            <span className="semaphore-label" style={{ color: semaphore.color }}>{semaphore.label}</span>
            <span className="semaphore-desc">{semaphore.desc}</span>
          </div>
        </div>
      )}

      {ranking.length > 0 && !loading && !error && (
        <div className="ranking-panel">
          <h4 className="ranking-title">{`Ranking de Rendimiento (${days} días)`}</h4>
          <div className="ranking-list">
            {ranking.map((item, i) => (
              <div key={item.casa} className={`ranking-row ${item.casa === selectedCasa ? 'active' : ''}`}>
                <span className="ranking-pos">#{i + 1}</span>
                <span className="ranking-name">{item.nombre}</span>
                <span className="ranking-price">${item.actual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                <span className={`ranking-var ${item.variacion >= 0 ? 'positive' : 'negative'}`}>
                  {item.variacion >= 0 ? '▲' : '▼'} {Math.abs(item.variacion).toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DolarChart;
