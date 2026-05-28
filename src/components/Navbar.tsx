"use client";

import React, { useState, useEffect } from 'react';
import { Activity, Search, X, Menu } from 'lucide-react';
import { DolarRate } from '@/types/dolar';

interface ExchangeRate {
  codigo: string;
  nombre: string;
  compra: number;
  venta: number;
  fecha: Date;
  casa: string;
  tipo: string;
}

interface NavbarProps {
  rates: DolarRate[];
  isLiveConnected: boolean;
  lastUpdated?: string | null;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onHighlightCard?: (highlight: { currency: string; tipo: string } | null) => void;
}

export default function Navbar({ rates, isLiveConnected, lastUpdated, activeTab, onTabChange, onHighlightCard }: NavbarProps) {
  const [intlRates, setIntlRates] = useState<ExchangeRate[]>([]);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  // Fetch EUR and BRL rates for the ticker
  useEffect(() => {
    const fetchIntlRates = async () => {
      try {
        const response = await fetch('/api/exchange-rates/variants');
        if (response.ok) {
          const data = await response.json();
          setIntlRates(data);
        }
      } catch (error) {
        console.error('Error fetching international rates in Navbar:', error);
      }
    };

    fetchIntlRates();
    // Refresh every 2 minutes
    const interval = setInterval(fetchIntlRates, 120000);
    return () => clearInterval(interval);
  }, []);

  // Track scroll position to change background styling
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
      if (menuOpen) setMenuOpen(false);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [menuOpen]);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.navbar-premium')) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  const blueRate = rates.find(r => r.casa === 'blue');
  const oficialRate = rates.find(r => r.casa === 'oficial');
  const eurOficial = intlRates.find(r => r.codigo === 'EUR' && r.tipo === 'oficial');
  const eurBlue = intlRates.find(r => r.codigo === 'EUR' && r.tipo === 'blue');
  const eurTarjeta = intlRates.find(r => r.codigo === 'EUR' && r.tipo === 'tarjeta');
  const brlOficial = intlRates.find(r => r.codigo === 'BRL' && r.tipo === 'oficial');
  const brlBlue = intlRates.find(r => r.codigo === 'BRL' && r.tipo === 'blue');
  const brlTarjeta = intlRates.find(r => r.codigo === 'BRL' && r.tipo === 'tarjeta');

  return (
    <nav className={`navbar-premium ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        <div className="navbar-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="brand-logo-glow"></div>
          <span className="brand-name">
            DÓLAR<span className="brand-highlight">ARG</span>
          </span>
        </div>

        <div className="navbar-ticker-container">
          <div className="ticker-wrapper">
            <div className="ticker-content">
              {oficialRate && (
                <div className="ticker-item">
                  <span className="ticker-flag">🇺🇸</span>
                  <span className="ticker-label">Dólar Oficial:</span>
                  <span className="ticker-values">
                    <span className="val-c">C: ${oficialRate.compra.toFixed(2)}</span>
                    <span className="ticker-divider">/</span>
                    <span className="val-v">V: ${oficialRate.venta.toFixed(2)}</span>
                  </span>
                </div>
              )}

              {blueRate && (
                <div className="ticker-item highlighted">
                  <span className="ticker-flag">🇺🇸</span>
                  <span className="ticker-label">Dólar Blue:</span>
                  <span className="ticker-values">
                    <span className="val-c">C: ${blueRate.compra.toFixed(2)}</span>
                    <span className="ticker-divider">/</span>
                    <span className="val-v">V: ${blueRate.venta.toFixed(2)}</span>
                  </span>
                </div>
              )}

              {eurOficial && (
                <div className="ticker-item">
                  <span className="ticker-flag">🇪🇺</span>
                  <span className="ticker-label">Euro Oficial:</span>
                  <span className="ticker-values">
                    <span className="val-c">C: ${eurOficial.compra.toFixed(2)}</span>
                    <span className="ticker-divider">/</span>
                    <span className="val-v">V: ${eurOficial.venta.toFixed(2)}</span>
                  </span>
                </div>
              )}

              {eurBlue && (
                <div className="ticker-item highlighted">
                  <span className="ticker-flag">🇪🇺</span>
                  <span className="ticker-label">Euro Blue:</span>
                  <span className="ticker-values">
                    <span className="val-c">C: ${eurBlue.compra.toFixed(2)}</span>
                    <span className="ticker-divider">/</span>
                    <span className="val-v">V: ${eurBlue.venta.toFixed(2)}</span>
                  </span>
                </div>
              )}

              {eurTarjeta && (
                <div className="ticker-item">
                  <span className="ticker-flag">🇪🇺</span>
                  <span className="ticker-label">Euro Tarjeta:</span>
                  <span className="ticker-values">
                    <span className="val-c">C: ${eurTarjeta.compra.toFixed(2)}</span>
                    <span className="ticker-divider">/</span>
                    <span className="val-v">V: ${eurTarjeta.venta.toFixed(2)}</span>
                  </span>
                </div>
              )}

              {brlOficial && (
                <div className="ticker-item">
                  <span className="ticker-flag">🇧🇷</span>
                  <span className="ticker-label">Real Oficial:</span>
                  <span className="ticker-values">
                    <span className="val-c">C: ${brlOficial.compra.toFixed(2)}</span>
                    <span className="ticker-divider">/</span>
                    <span className="val-v">V: ${brlOficial.venta.toFixed(2)}</span>
                  </span>
                </div>
              )}

              {brlBlue && (
                <div className="ticker-item highlighted">
                  <span className="ticker-flag">🇧🇷</span>
                  <span className="ticker-label">Real Blue:</span>
                  <span className="ticker-values">
                    <span className="val-c">C: ${brlBlue.compra.toFixed(2)}</span>
                    <span className="ticker-divider">/</span>
                    <span className="val-v">V: ${brlBlue.venta.toFixed(2)}</span>
                  </span>
                </div>
              )}

              {brlTarjeta && (
                <div className="ticker-item">
                  <span className="ticker-flag">🇧🇷</span>
                  <span className="ticker-label">Real Tarjeta:</span>
                  <span className="ticker-values">
                    <span className="val-c">C: ${brlTarjeta.compra.toFixed(2)}</span>
                    <span className="ticker-divider">/</span>
                    <span className="val-v">V: ${brlTarjeta.venta.toFixed(2)}</span>
                  </span>
                </div>
              )}
            </div>

            <div className="ticker-content duplicate" aria-hidden="true">
              {oficialRate && (
                <div className="ticker-item">
                  <span className="ticker-flag">🇺🇸</span>
                  <span className="ticker-label">Dólar Oficial:</span>
                  <span className="ticker-values">
                    <span className="val-c">C: ${oficialRate.compra.toFixed(2)}</span>
                    <span className="ticker-divider">/</span>
                    <span className="val-v">V: ${oficialRate.venta.toFixed(2)}</span>
                  </span>
                </div>
              )}
              {blueRate && (
                <div className="ticker-item highlighted">
                  <span className="ticker-flag">🇺🇸</span>
                  <span className="ticker-label">Dólar Blue:</span>
                  <span className="ticker-values">
                    <span className="val-c">C: ${blueRate.compra.toFixed(2)}</span>
                    <span className="ticker-divider">/</span>
                    <span className="val-v">V: ${blueRate.venta.toFixed(2)}</span>
                  </span>
                </div>
              )}
              {eurOficial && (
                <div className="ticker-item">
                  <span className="ticker-flag">🇪🇺</span>
                  <span className="ticker-label">Euro Oficial:</span>
                  <span className="ticker-values">
                    <span className="val-c">C: ${eurOficial.compra.toFixed(2)}</span>
                    <span className="ticker-divider">/</span>
                    <span className="val-v">V: ${eurOficial.venta.toFixed(2)}</span>
                  </span>
                </div>
              )}
              {eurBlue && (
                <div className="ticker-item highlighted">
                  <span className="ticker-flag">🇪🇺</span>
                  <span className="ticker-label">Euro Blue:</span>
                  <span className="ticker-values">
                    <span className="val-c">C: ${eurBlue.compra.toFixed(2)}</span>
                    <span className="ticker-divider">/</span>
                    <span className="val-v">V: ${eurBlue.venta.toFixed(2)}</span>
                  </span>
                </div>
              )}
              {eurTarjeta && (
                <div className="ticker-item">
                  <span className="ticker-flag">🇪🇺</span>
                  <span className="ticker-label">Euro Tarjeta:</span>
                  <span className="ticker-values">
                    <span className="val-c">C: ${eurTarjeta.compra.toFixed(2)}</span>
                    <span className="ticker-divider">/</span>
                    <span className="val-v">V: ${eurTarjeta.venta.toFixed(2)}</span>
                  </span>
                </div>
              )}
              {brlOficial && (
                <div className="ticker-item">
                  <span className="ticker-flag">🇧🇷</span>
                  <span className="ticker-label">Real Oficial:</span>
                  <span className="ticker-values">
                    <span className="val-c">C: ${brlOficial.compra.toFixed(2)}</span>
                    <span className="ticker-divider">/</span>
                    <span className="val-v">V: ${brlOficial.venta.toFixed(2)}</span>
                  </span>
                </div>
              )}
              {brlBlue && (
                <div className="ticker-item highlighted">
                  <span className="ticker-flag">🇧🇷</span>
                  <span className="ticker-label">Real Blue:</span>
                  <span className="ticker-values">
                    <span className="val-c">C: ${brlBlue.compra.toFixed(2)}</span>
                    <span className="ticker-divider">/</span>
                    <span className="val-v">V: ${brlBlue.venta.toFixed(2)}</span>
                  </span>
                </div>
              )}
              {brlTarjeta && (
                <div className="ticker-item">
                  <span className="ticker-flag">🇧🇷</span>
                  <span className="ticker-label">Real Tarjeta:</span>
                  <span className="ticker-values">
                    <span className="val-c">C: ${brlTarjeta.compra.toFixed(2)}</span>
                    <span className="ticker-divider">/</span>
                    <span className="val-v">V: ${brlTarjeta.venta.toFixed(2)}</span>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>


        {/* Hamburger button - only visible on mobile */}
        <button
          className="navbar-hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menú"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <div className="navbar-actions">
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '8px 12px',
                color: '#cbd5e1',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.85rem',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              }}
            >
              <Search size={16} />
              <span>Buscar</span>
            </button>
            {searchOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: '0',
                marginTop: '8px',
                background: '#1e293b',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                zIndex: 1000,
                minWidth: '250px',
                padding: '12px'
              }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    placeholder="Buscar dólar..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      flex: 1,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      color: '#f1f5f9',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSearchOpen(false);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
                {searchQuery && (
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {rates.filter(r => {
                      const searchTerm = searchQuery.toLowerCase();
                      const fullName = `dólar ${r.nombre}`.toLowerCase();
                      const casa = r.casa.toLowerCase();
                      const nombre = r.nombre.toLowerCase();
                      
                      return fullName.includes(searchTerm) || 
                             casa.includes(searchTerm) || 
                             nombre.includes(searchTerm) ||
                             searchTerm === 'd' || 
                             searchTerm === 'dolar'; 
                    }).map((rate) => (
                      <button
                        key={`dolar-${rate.casa}`}
                        onClick={() => {
                          setSearchQuery('');
                          setSearchOpen(false);
                          if (onHighlightCard) {
                            onHighlightCard({ currency: 'dolar', tipo: rate.casa });
                          }
                          if (activeTab !== 'dolar' && onTabChange) {
                            onTabChange('dolar');
                            setTimeout(() => {
                              const card = document.querySelector(`[data-casa="${rate.casa}"]`);
                              if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }, 100);
                          } else {
                            const card = document.querySelector(`[data-casa="${rate.casa}"]`);
                            if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          background: 'transparent',
                          border: 'none',
                          color: '#cbd5e1',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontSize: '0.85rem',
                          borderRadius: '6px',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        🇺🇸 Dólar {rate.nombre}
                      </button>
                    ))}
                    
                    {intlRates.filter(r => 
                      r.codigo === 'EUR' && (
                        r.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        r.tipo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        'euro'.includes(searchQuery.toLowerCase())
                      )
                    ).map((rate) => (
                      <button
                        key={`eur-${rate.tipo}`}
                        onClick={() => {
                          setSearchQuery('');
                          setSearchOpen(false);
                          if (onHighlightCard) {
                            onHighlightCard({ currency: 'EUR', tipo: rate.tipo });
                          }
                          if (activeTab !== 'euro' && onTabChange) {
                            onTabChange('euro');
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          background: 'transparent',
                          border: 'none',
                          color: '#cbd5e1',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontSize: '0.85rem',
                          borderRadius: '6px',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        🇪🇺 Euro {rate.tipo === 'oficial' ? 'Oficial' : rate.tipo === 'blue' ? 'Blue' : 'Tarjeta'}
                      </button>
                    ))}
                    
                    {intlRates.filter(r => 
                      r.codigo === 'BRL' && (
                        r.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        r.tipo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        'real'.includes(searchQuery.toLowerCase())
                      )
                    ).map((rate) => (
                      <button
                        key={`brl-${rate.tipo}`}
                        onClick={() => {
                          setSearchQuery('');
                          setSearchOpen(false);
                          if (onHighlightCard) {
                            onHighlightCard({ currency: 'BRL', tipo: rate.tipo });
                          }
                          if (activeTab !== 'real' && onTabChange) {
                            onTabChange('real');
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          background: 'transparent',
                          border: 'none',
                          color: '#cbd5e1',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontSize: '0.85rem',
                          borderRadius: '6px',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        🇧🇷 Real {rate.tipo === 'oficial' ? 'Oficial' : rate.tipo === 'blue' ? 'Blue' : 'Tarjeta'}
                      </button>
                    ))}
                    
                    {rates.filter(r => 
                      r.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      r.casa.toLowerCase().includes(searchQuery.toLowerCase())
                    ).length === 0 &&
                    intlRates.filter(r => 
                      (r.codigo === 'EUR' || r.codigo === 'BRL') && (
                        r.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        r.tipo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        r.codigo.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                    ).length === 0 && (
                      <div style={{ padding: '12px', color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center' }}>
                        No se encontraron resultados
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {lastUpdated && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              fontSize: '0.75rem',
              color: '#94a3b8'
            }}>
              <Activity size={12} />
              <span>Actualizado: {lastUpdated}</span>
            </div>
          )}
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="navbar-mobile-menu">
          <div className="mobile-menu-section">
            <p className="mobile-menu-label">Cotizaciones</p>
            {oficialRate && (
              <div className="mobile-menu-rate">
                <span className="mobile-rate-flag">🇺🇸</span>
                <span className="mobile-rate-name">Dólar Oficial</span>
                <span className="mobile-rate-value">
                  <span className="val-c">C: ${oficialRate.compra.toFixed(2)}</span>
                  <span className="val-v">V: ${oficialRate.venta.toFixed(2)}</span>
                </span>
              </div>
            )}
            {blueRate && (
              <div className="mobile-menu-rate highlighted">
                <span className="mobile-rate-flag">🇺🇸</span>
                <span className="mobile-rate-name">Dólar Blue</span>
                <span className="mobile-rate-value">
                  <span className="val-c">C: ${blueRate.compra.toFixed(2)}</span>
                  <span className="val-v">V: ${blueRate.venta.toFixed(2)}</span>
                </span>
              </div>
            )}
            {eurOficial && (
              <div className="mobile-menu-rate">
                <span className="mobile-rate-flag">🇪🇺</span>
                <span className="mobile-rate-name">Euro Oficial</span>
                <span className="mobile-rate-value">
                  <span className="val-c">C: ${eurOficial.compra.toFixed(2)}</span>
                  <span className="val-v">V: ${eurOficial.venta.toFixed(2)}</span>
                </span>
              </div>
            )}
            {brlOficial && (
              <div className="mobile-menu-rate">
                <span className="mobile-rate-flag">🇧🇷</span>
                <span className="mobile-rate-name">Real Oficial</span>
                <span className="mobile-rate-value">
                  <span className="val-c">C: ${brlOficial.compra.toFixed(2)}</span>
                  <span className="val-v">V: ${brlOficial.venta.toFixed(2)}</span>
                </span>
              </div>
            )}
          </div>

          <div className="mobile-menu-section">
            <p className="mobile-menu-label">Buscar cotización</p>
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: searchQuery ? '8px' : '0' }}>
                <input
                  type="text"
                  placeholder="Buscar dólar, euro, real..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: '#f1f5f9',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0 4px' }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              {searchQuery && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {rates.filter(r => {
                    const t = searchQuery.toLowerCase();
                    return `dólar ${r.nombre}`.toLowerCase().includes(t) || r.casa.toLowerCase().includes(t) || r.nombre.toLowerCase().includes(t) || t === 'd' || t === 'dolar';
                  }).map(rate => (
                    <button key={`m-dolar-${rate.casa}`}
                      onClick={() => {
                        setSearchQuery(''); setMenuOpen(false);
                        if (onHighlightCard) onHighlightCard({ currency: 'dolar', tipo: rate.casa });
                        if (activeTab !== 'dolar' && onTabChange) { onTabChange('dolar'); setTimeout(() => { const c = document.querySelector(`[data-casa="${rate.casa}"]`); if (c) c.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 100); }
                        else { const c = document.querySelector(`[data-casa="${rate.casa}"]`); if (c) c.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
                      }}
                      style={{ width: '100%', padding: '10px 12px', background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', textAlign: 'left', fontSize: '0.85rem', borderRadius: '6px', transition: 'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >🇺🇸 Dólar {rate.nombre}</button>
                  ))}
                  {intlRates.filter(r => r.codigo === 'EUR' && (r.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || r.tipo.toLowerCase().includes(searchQuery.toLowerCase()) || 'euro'.includes(searchQuery.toLowerCase()))).map(rate => (
                    <button key={`m-eur-${rate.tipo}`}
                      onClick={() => {
                        setSearchQuery(''); setMenuOpen(false);
                        if (onHighlightCard) onHighlightCard({ currency: 'EUR', tipo: rate.tipo });
                        if (activeTab !== 'euro' && onTabChange) onTabChange('euro');
                      }}
                      style={{ width: '100%', padding: '10px 12px', background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', textAlign: 'left', fontSize: '0.85rem', borderRadius: '6px', transition: 'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >🇪🇺 Euro {rate.tipo === 'oficial' ? 'Oficial' : rate.tipo === 'blue' ? 'Blue' : 'Tarjeta'}</button>
                  ))}
                  {intlRates.filter(r => r.codigo === 'BRL' && (r.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || r.tipo.toLowerCase().includes(searchQuery.toLowerCase()) || 'real'.includes(searchQuery.toLowerCase()))).map(rate => (
                    <button key={`m-brl-${rate.tipo}`}
                      onClick={() => {
                        setSearchQuery(''); setMenuOpen(false);
                        if (onHighlightCard) onHighlightCard({ currency: 'BRL', tipo: rate.tipo });
                        if (activeTab !== 'real' && onTabChange) onTabChange('real');
                      }}
                      style={{ width: '100%', padding: '10px 12px', background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', textAlign: 'left', fontSize: '0.85rem', borderRadius: '6px', transition: 'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >🇧🇷 Real {rate.tipo === 'oficial' ? 'Oficial' : rate.tipo === 'blue' ? 'Blue' : 'Tarjeta'}</button>
                  ))}
                  {rates.filter(r => r.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || r.casa.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 &&
                   intlRates.filter(r => (r.codigo === 'EUR' || r.codigo === 'BRL') && (r.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || r.tipo.toLowerCase().includes(searchQuery.toLowerCase()) || r.codigo.toLowerCase().includes(searchQuery.toLowerCase()))).length === 0 && (
                    <div style={{ padding: '12px', color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center' }}>No se encontraron resultados</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {lastUpdated && (
            <div className="mobile-menu-footer">
              <Activity size={12} />
              <span>Actualizado: {lastUpdated}</span>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
