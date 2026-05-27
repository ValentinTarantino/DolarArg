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
import { LineChart as ChartIcon, Calendar, TrendingUp, TrendingDown, BarChart2, Activity, CircleDot } from 'lucide-react';

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
}

const DolarChart: React.FC<DolarChartProps> = ({ selectedCasa, selectedName }) => {
  const [historyData, setHistoryData] = useState<ChartDataPoint[]>([]);
  const [days, setDays] = useState<number>(30);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [ranking, setRanking] = useState<RankingItem[]>([]);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/dolar/history?type=${selectedCasa}&days=${days}`);
        if (!response.ok) {
          throw new Error('No se pudo cargar el historial');
        }
        const data = await response.json();
        setHistoryData(data);
      } catch (err: any) {
        setError(err.message || 'Error cargando datos del gráfico');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [selectedCasa, days]);

  // Fetch ranking data
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

  // Calcular estadísticas del período
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

  // Semáforo: posición del precio actual respecto al rango del período
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
      <div className="panel-title">
        <ChartIcon size={22} />
        <span>Evolución Histórica: Dólar {selectedName}</span>
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
        <div className="chart-wrapper">
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
                name="Compra"
                type="monotone" 
                dataKey="compra" 
                stroke="#10b981" 
                strokeWidth={3} 
                dot={false}
                activeDot={{ r: 6 }} 
              />
              <Line 
                name="Venta"
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

      {/* ── Estadísticas del período ── */}
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

      {/* ── Semáforo de Compra ── */}
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

      {/* ── Ranking de Rendimiento ── */}
      {ranking.length > 0 && !loading && !error && (
        <div className="ranking-panel">
          <h4 className="ranking-title">Ranking de Rendimiento ({days} días)</h4>
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
