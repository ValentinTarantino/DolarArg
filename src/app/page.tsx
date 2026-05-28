"use client";

import React, { useState, useEffect } from 'react';
import DolarCard from '@/components/DolarCard';
import DolarChart from '@/components/DolarChart';
import Calculator from '@/components/Calculator';
import AlertSettings from '@/components/AlertSettings';
import NewsFeed from '@/components/NewsFeed';
import TaxGuide from '@/components/TaxGuide';
import ExchangeRatesGrid from '@/components/ExchangeRatesGrid';
import Navbar from '@/components/Navbar';
import ArbitragePanel from '@/components/ArbitragePanel';
import ExchangeBands from '@/components/ExchangeBands';
import UniversalConverter from '@/components/UniversalConverter';
import CurrencyNavbar from '@/components/CurrencyNavbar';
import ExchangeRateSection from '@/components/ExchangeRateSection';
import BankRates from '@/components/BankRates';
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
          setLastUpdated(new Date(data[0].fecha).toLocaleString('es-AR'));
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
          setLastUpdated(new Date(newRates[0].fecha).toLocaleString('es-AR'));
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
            setLastUpdated(new Date(data[0].fecha).toLocaleString('es-AR'));
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
      <Navbar rates={rates} isLiveConnected={isLiveConnected} lastUpdated={lastUpdated} activeTab={activeTab} onTabChange={setActiveTab} onHighlightCard={setHighlightedCard} />
      <div className="dashboard-container">
        <header className="header">
        <span className="header-badge">Mercado Cambiario</span>
        <div className="title-container">
          <div className="logo-glow"></div>
          <DollarSign size={38} className="header-logo" />
          <h1>Dólar Hoy Argentina</h1>
        </div>
        <p className="subtitle">Monitoreo interactivo de cotizaciones y brechas cambiarias en tiempo real</p>

        <div className="live-indicator-wrapper">
          <div className={`live-indicator ${isLiveConnected ? 'connected' : 'connecting'}`}>
            <span className="pulse-dot"></span>
            <span>{isLiveConnected ? 'TIEMPO REAL ACTIVO' : 'RECONECTANDO'}</span>
          </div>
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
              </main>

              {/* Banda Cambiaria BCRA */}
              <section style={{ marginTop: '40px' }}>
                <ExchangeBands rates={rates} />
              </section>

              {/* Cotizaciones Bancos y Casas de Cambio */}
              <section style={{ marginTop: '40px' }}>
                <BankRates />
              </section>

              <section className="section-grid-extended">
                <DolarChart selectedCasa={selectedCasa} selectedName={selectedName} onSelectCasa={setSelectedCasa} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <Calculator rates={rates} />
                  <TaxGuide />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <AlertSettings rates={rates} />
                  <NewsFeed />
                </div>
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
        </>
      )}

      <footer className="footer">
        {lastUpdated && (
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Última actualización general: {lastUpdated}
          </p>
        )}
      </footer>
      </div>
    </>
  );
}
