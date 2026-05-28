"use client";

import React, { useState, useEffect } from 'react';
import DolarCard from '@/components/DolarCard';
import DolarChart from '@/components/DolarChart';
import Calculator from '@/components/Calculator';
import AlertSettings from '@/components/AlertSettings';
import NewsFeed from '@/components/NewsFeed';
import Navbar from '@/components/Navbar';
import ExchangeBands from '@/components/ExchangeBands';
import UniversalConverter from '@/components/UniversalConverter';
import CurrencyNavbar from '@/components/CurrencyNavbar';
import ExchangeRateSection from '@/components/ExchangeRateSection';
import BankRates from '@/components/BankRates';
import MacroIndicators from '@/components/MacroIndicators';
import CryptoTable from '@/components/CryptoTable';
import Footer from '@/components/Footer';
import { DollarSign } from 'lucide-react';
import { DolarRate } from '@/types/dolar';
export default function Home() {
  const [rates, setRates] = useState<DolarRate[]>([]);
  const [selectedCasa, setSelectedCasa] = useState<string>('blue');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('dolar');
  const [rankingData, setRankingData] = useState<any[]>([]);
  const [highlightedCard, setHighlightedCard] = useState<{ currency: string; tipo: string } | null>(null);
  const [splashVisible, setSplashVisible] = useState<boolean>(true);
  const [splashFading, setSplashFading] = useState<boolean>(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setSplashFading(true), 4600);
    const hideTimer = setTimeout(() => setSplashVisible(false), 5200);
    return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer); };
  }, []);

  // Carga inicial
  useEffect(() => {
    const fetchInitialRates = async () => {
      try {
        const response = await fetch('/api/dolar');
        if (!response.ok) {
          throw new Error('Error al cargar cotizaciones');
        }
        const data = await response.json();
        setRates(data);
        if (data.length > 0) {
          setLastUpdated(new Date(data[0].fecha).toLocaleString('es-AR', { hour12: false }));
        }
      } catch (err: any) {
        setError(err.message || 'Error cargando cotizaciones');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialRates();
  }, []);
  useEffect(() => {
    const eventSource = new EventSource('/api/dolar/live');

    eventSource.addEventListener('connected', () => {
      console.log('Conexión en tiempo real SSE establecida.');
      setIsLiveConnected(true);
    });

    eventSource.addEventListener('rates_update', (event: MessageEvent) => {
      try {
        const newRates = JSON.parse(event.data) as DolarRate[];
        console.log('Actualización en tiempo real recibida:', newRates);

        setRates(prevRates => {
          const updatedRates = [...prevRates];
          newRates.forEach(newRate => {
            const index = updatedRates.findIndex(r => r.casa === newRate.casa);
            if (index !== -1) {
              updatedRates[index] = newRate;
            } else {
              updatedRates.push(newRate);
            }
          });

          // Re-ordenar
          const orderMap: Record<string, number> = {
            oficial: 0,
            blue: 1,
            bolsa: 2,
            contadoconliqui: 3,
            tarjeta: 4,
            cripto: 5,
            mayorista: 6
          };
          updatedRates.sort((a, b) => (orderMap[a.casa] ?? 99) - (orderMap[b.casa] ?? 99));
          return updatedRates;
        });

        if (newRates.length > 0) {
          setLastUpdated(new Date(newRates[0].fecha).toLocaleString('es-AR', { hour12: false }));
        }
      } catch (error) {
        console.error('Error parseando datos SSE:', error);
      }
    });

    eventSource.addEventListener('error', (event) => {
      console.error('Error de conexión SSE:', event);
      setIsLiveConnected(false);
    });

    return () => {
      eventSource.close();
      console.log('Conexión SSE cerrada.');
    };
  }, []);

  useEffect(() => {
    if (isLiveConnected) return;

    console.log('Iniciando fallback polling de cotizaciones cada 30 segundos...');
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/dolar');
        if (response.ok) {
          const data = await response.json();
          setRates(data);
          if (data.length > 0) {
            setLastUpdated(new Date(data[0].fecha).toLocaleString('es-AR', { hour12: false }));
          }
        }
      } catch (err) {
        console.error('Error en fallback polling:', err);
      }
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [isLiveConnected]);

  // Fetch ranking data for variation indicators
  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const res = await fetch('/api/dolar/ranking?days=1');
        if (res.ok) {
          const data = await res.json();
          setRankingData(data);
        }
      } catch (err) {
        console.error('Error fetching ranking:', err);
      }
    };
    fetchRanking();
    // Refresh every 5 minutes
    const interval = setInterval(fetchRanking, 300000);
    return () => clearInterval(interval);
  }, []);

  const selectedRate = rates.find(r => r.casa === selectedCasa);
  const selectedName = selectedRate ? selectedRate.nombre : 'Blue';

  // Limpiar el resaltado después de 500ms (duración de la transición)
  useEffect(() => {
    if (highlightedCard) {
      const timeout = setTimeout(() => {
        setHighlightedCard(null);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [highlightedCard]);

  return (
    <>
      {splashVisible && (
        <div className={`splash-screen${splashFading ? ' splash-screen--fading' : ''}`}>
          <div className="splash-screen__content">
            <div className="splash-screen__logo">
              <span className="splash-screen__dollar">$</span>
            </div>
            <div className="splash-screen__name">
              <span style={{ color: '#ffffff' }}>DÓLAR</span><span style={{ color: '#6366f1' }}>ARG</span>
            </div>
            <div className="splash-screen__bar">
              <div className="splash-screen__bar-fill" />
            </div>
            <p className="splash-screen__sub">Cargando cotizaciones...</p>
          </div>
        </div>
      )}
      <Navbar rates={rates} isLiveConnected={isLiveConnected} lastUpdated={lastUpdated} activeTab={activeTab} onTabChange={setActiveTab} onHighlightCard={setHighlightedCard} />
      <div className="dashboard-container">
        <header className="header">
          <span className="header-badge">Mercado Cambiario</span>
          <div className="title-container">
            <div className="logo-glow"></div>
            <DollarSign size={38} className="header-logo" />
            <h1>Cotizaciones</h1>
          </div>
          <p className="subtitle">Argentina en tiempo real</p>
          <div className="header-stats">
            {[
              { label: 'Tipos de cambio', value: `${rates.length}`, color: '#94a3b8' },
              ...(() => {
                const oficial = rates.find(r => r.casa === 'oficial');
                const blue = rates.find(r => r.casa === 'blue');
                const items = [];
                if (blue) items.push({ label: 'Spread blue', value: `$${(blue.venta - blue.compra).toFixed(0)}`, color: '#94a3b8' });
                const topMover = rankingData.length > 0 ? rankingData.reduce((a: any, b: any) => Math.abs(b.variacion ?? 0) > Math.abs(a.variacion ?? 0) ? b : a, rankingData[0]) : null;
                if (topMover?.variacion != null) {
                  const up = topMover.variacion >= 0;
                  items.push({ label: `Mayor mov. (${topMover.nombre ?? topMover.casa})`, value: `${up ? '+' : ''}${topMover.variacion.toFixed(2)}%`, color: up ? '#10b981' : '#ef4444' });
                }
                if (oficial && blue) {
                  const brecha = ((blue.venta - oficial.venta) / oficial.venta * 100);
                  items.push({ label: 'Brecha', value: `${brecha.toFixed(1)}%`, color: brecha > 50 ? '#ef4444' : brecha > 20 ? '#f59e0b' : '#10b981' });
                }
                return items;
              })()
            ].map((item, i, arr) => (
              <span key={item.label} className="header-stats__item">
                <span className="header-stats__label">{item.label}:</span>
                <span className="header-stats__value" style={{ color: item.color }}>{item.value}</span>
                {i < arr.length - 1 && <span className="header-stats__sep">|</span>}
              </span>
            ))}
          </div>
        </header>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', fontSize: '1.25rem', color: '#94a3b8' }}>
          Iniciando dashboard...
        </div>
      ) : error ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#f43f5e', fontWeight: 'bold' }}>
          Error: {error}
        </div>
      ) : (
        <>
          <CurrencyNavbar activeTab={activeTab} onTabChange={setActiveTab} />

          {activeTab === 'dolar' && (
            <>
              <main className="dolar-grid">
                {rates.map((rate) => {
                  const rankingItem = rankingData.find((r: any) => r.casa === rate.casa);
                  const variacion = rankingItem ? rankingItem.variacion : undefined;
                  const isHighlighted = highlightedCard?.currency === 'dolar' && highlightedCard?.tipo === rate.casa;
                  return (
                    <DolarCard
                      key={rate.casa}
                      casa={rate.casa}
                      nombre={rate.nombre}
                      compra={rate.compra}
                      venta={rate.venta}
                      source="DolarAPI"
                      onSelect={(casa: string) => setSelectedCasa(casa)}
                      isSelected={selectedCasa === rate.casa}
                      variacion={variacion}
                      isHighlighted={isHighlighted}
                    />
                  );
                })}
                {/* Glosario en el espacio vacío de la grilla */}
                <div className="dolar-card" style={{ cursor: 'default', display: 'flex', flexDirection: 'column', gap: '0', maxHeight: '200px' }}>
                  <div className="card-header" style={{ marginBottom: '10px' }}>
                    <span className="card-title" style={{ fontSize: '0.95rem' }}>📖 Glosario</span>
                  </div>
                  <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
                    {[
                      { name: 'Dólar Oficial', desc: 'Cotización base del Banco Nación sin impuestos. Referencia para importaciones y tarjetas.', color: '#10b981' },
                      { name: 'Dólar Blue', desc: 'Mercado informal (paralelo). Libre de impuestos y sin límites de compra.', color: '#6366f1' },
                      { name: 'Dólar MEP / Bolsa', desc: 'Dólar legal mediante compra-venta de bonos en pesos y dólares. Sin límites.', color: '#f59e0b' },
                      { name: 'Dólar CCL', desc: 'Contado con Liquidación. Permite dolarizar activos a través de acciones o bonos en el exterior.', color: '#06b6d4' },
                      { name: 'Dólar Tarjeta', desc: 'Oficial + 30% de percepciones impositivas. Aplica a compras con tarjeta en moneda extranjera.', color: '#f43f5e' },
                      { name: 'Dólar Cripto', desc: 'Cotización en plataformas cripto para stablecoins (USDT/DAI). Disponible 24hs.', color: '#a855f7' },
                      { name: 'Dólar Mayorista', desc: 'Solo para bancos y grandes operadores. Menor spread, sin acceso al público general.', color: '#64748b' },
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: item.color, flexShrink: 0, marginTop: '5px' }} />
                        <div>
                          <span style={{ fontWeight: 700, fontSize: '0.78rem', color: '#f1f5f9' }}>{item.name}: </span>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{item.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </main>

              {/* Indicadores Macroeconómicos */}
              <section style={{ marginTop: '40px' }}>
                <MacroIndicators />
              </section>

              {/* Gráfico + Calculadora + Alertas + Noticias */}
              <section style={{ marginTop: '40px', display: 'grid', gridTemplateColumns: '1.5fr 2fr', gap: '24px' }} className="chart-main-grid">
                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                  <DolarChart selectedCasa={selectedCasa} selectedName={selectedName} onSelectCasa={setSelectedCasa} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 }}>
                  <Calculator rates={rates} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }} className="alerts-news-grid">
                    <AlertSettings rates={rates} />
                    <NewsFeed />
                  </div>
                </div>
              </section>

              {/* Banda Cambiaria BCRA */}
              <section style={{ marginTop: '40px' }}>
                <ExchangeBands rates={rates} />
              </section>

              {/* Cotizaciones Bancos y Casas de Cambio */}
              <section style={{ marginTop: '40px' }}>
                <BankRates />
              </section>


            </>
          )}

          {activeTab === 'euro' && (
            <section style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <ExchangeRateSection currency="EUR" highlightedCard={highlightedCard} activeTab={activeTab} />
              <UniversalConverter currency="EUR" />
            </section>
          )}

          {activeTab === 'real' && (
            <section style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <ExchangeRateSection currency="BRL" highlightedCard={highlightedCard} activeTab={activeTab} />
              <UniversalConverter currency="BRL" />
            </section>
          )}

          {activeTab === 'clp' && (
            <section style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <ExchangeRateSection currency="CLP" highlightedCard={highlightedCard} activeTab={activeTab} apiEndpoint="/api/exchange-rates/clp-uyu" />
              <UniversalConverter currency="CLP" />
            </section>
          )}

          {activeTab === 'uyu' && (
            <section style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <ExchangeRateSection currency="UYU" highlightedCard={highlightedCard} activeTab={activeTab} apiEndpoint="/api/exchange-rates/clp-uyu" />
              <UniversalConverter currency="UYU" />
            </section>
          )}

          {activeTab === 'cripto' && (
            <section style={{ marginTop: '20px' }}>
              <CryptoTable />
            </section>
          )}
        </>
      )}

      </div>
      <Footer onTabChange={setActiveTab} lastUpdated={lastUpdated} />
    </>
  );
}
