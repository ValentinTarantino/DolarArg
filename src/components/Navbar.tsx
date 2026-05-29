"use client";

import React, { useState, useEffect } from 'react';
import { Activity, Search, X, Menu, Download } from 'lucide-react';
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

  const [clpUyuRates, setClpUyuRates] = useState<ExchangeRate[]>([]);

  // Fetch EUR and BRL rates for the ticker
  useEffect(() => {
    const fetchIntlRates = async () => {
      try {
        const [varRes, clpRes] = await Promise.all([
          fetch('/api/exchange-rates/variants'),
          fetch('/api/exchange-rates/clp-uyu'),
        ]);
        if (varRes.ok) setIntlRates(await varRes.json());
        if (clpRes.ok) setClpUyuRates(await clpRes.json());
      } catch (error) {
        console.error('Error fetching international rates in Navbar:', error);
      }
    };

    fetchIntlRates();
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
  const clpOficial  = clpUyuRates.find(r => r.codigo === 'CLP' && r.tipo === 'oficial');
  const clpTarjeta  = clpUyuRates.find(r => r.codigo === 'CLP' && r.tipo === 'tarjeta');
  const uyuOficial  = clpUyuRates.find(r => r.codigo === 'UYU' && r.tipo === 'oficial');
  const uyuTarjeta  = clpUyuRates.find(r => r.codigo === 'UYU' && r.tipo === 'tarjeta');

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
            {(() => {
              const fl = (src: string, alt: string) => <img src={src} alt={alt} width={18} height={12} style={{borderRadius:'2px',objectFit:'cover'}} />;
              const chg = (r: DolarRate | undefined) => {
                if (!r) return null;
                return null;
              };
              const items = [
                oficialRate && <div key="usd-o" className="ticker-item"><span className="ticker-label">{fl('https://flagcdn.com/w40/us.png','US')} Dólar Oficial</span><span className="ticker-values"><span className="val-v">${oficialRate.venta.toFixed(2)}</span>{chg(oficialRate)}</span></div>,
                blueRate    && <div key="usd-b" className="ticker-item highlighted"><span className="ticker-label">{fl('https://flagcdn.com/w40/us.png','US')} Dólar Blue</span><span className="ticker-values"><span className="val-v">${blueRate.venta.toFixed(2)}</span>{chg(blueRate)}</span></div>,
                eurOficial  && <div key="eur"   className="ticker-item"><span className="ticker-label">{fl('https://flagcdn.com/w40/eu.png','EU')} Euro</span><span className="ticker-values"><span className="val-v">${eurOficial.venta.toFixed(2)}</span></span></div>,
                brlOficial  && <div key="brl"   className="ticker-item"><span className="ticker-label">{fl('https://flagcdn.com/w40/br.png','BR')} Real</span><span className="ticker-values"><span className="val-v">${brlOficial.venta.toFixed(2)}</span></span></div>,
                clpOficial  && <div key="clp"   className="ticker-item"><span className="ticker-label">{fl('https://flagcdn.com/w40/cl.png','CL')} Peso Chileno</span><span className="ticker-values"><span className="val-v">${clpOficial.venta.toFixed(2)}</span></span></div>,
                uyuOficial  && <div key="uyu"   className="ticker-item"><span className="ticker-label">{fl('https://flagcdn.com/w40/uy.png','UY')} Peso Uruguayo</span><span className="ticker-values"><span className="val-v">${uyuOficial.venta.toFixed(2)}</span></span></div>,

              ].filter(Boolean);
              return (<><div className="ticker-content">{items}</div><div className="ticker-content duplicate" aria-hidden="true">{items}</div></>);
            })()}
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
                    placeholder="Buscar moneda..."
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
                {searchQuery && (() => {
                  const t = searchQuery.toLowerCase();
                  const btnStyle = { width: '100%', padding: '8px 12px', background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', textAlign: 'left' as const, borderRadius: '6px', transition: 'background 0.2s', display: 'flex', alignItems: 'center', gap: '10px' };
                  const hover = (e: React.MouseEvent<HTMLButtonElement>, enter: boolean) => { e.currentTarget.style.background = enter ? 'rgba(255,255,255,0.05)' : 'transparent'; };
                  const flag = (src: string) => <img src={src} alt="" width={20} height={14} style={{borderRadius:'2px',flexShrink:0}} />;
                  const sub = (text: string) => <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginTop: '1px' }}>{text}</span>;

                  const dolarItems = rates.filter(r => `dólar ${r.nombre}`.toLowerCase().includes(t) || r.casa.toLowerCase().includes(t) || r.nombre.toLowerCase().includes(t) || t === 'd' || t === 'dolar');
                  const showEur = 'euro'.includes(t) || t === 'e' || 'eur'.includes(t);
                  const showBrl = 'real'.includes(t) || t === 'r' || 'brl'.includes(t);
                  const showClp = 'peso chileno'.includes(t) || 'chileno'.includes(t) || 'clp'.includes(t);
                  const showUyu = 'peso uruguayo'.includes(t) || 'uruguayo'.includes(t) || 'uyu'.includes(t);
                  const eurOfi = intlRates.find(r => r.codigo === 'EUR' && r.tipo === 'oficial');
                  const brlOfi = intlRates.find(r => r.codigo === 'BRL' && r.tipo === 'oficial');
                  const clpOfi = clpUyuRates.find(r => r.codigo === 'CLP' && r.tipo === 'oficial');
                  const uyuOfi = clpUyuRates.find(r => r.codigo === 'UYU' && r.tipo === 'oficial');
                  const noResults = dolarItems.length === 0 && !showEur && !showBrl && !showClp && !showUyu;

                  return (
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {dolarItems.map(rate => (
                        <button key={`dolar-${rate.casa}`} style={btnStyle}
                          onMouseEnter={e => hover(e, true)} onMouseLeave={e => hover(e, false)}
                          onClick={() => {
                            setSearchQuery(''); setSearchOpen(false);
                            if (onHighlightCard) onHighlightCard({ currency: 'dolar', tipo: rate.casa });
                            if (activeTab !== 'dolar' && onTabChange) { onTabChange('dolar'); setTimeout(() => { const c = document.querySelector(`[data-casa="${rate.casa}"]`); if (c) c.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 100); }
                            else { const c = document.querySelector(`[data-casa="${rate.casa}"]`); if (c) c.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
                          }}>
                          {flag('https://flagcdn.com/w40/us.png')}
                          <span style={{ fontSize: '0.85rem' }}>Dólar {rate.nombre}</span>
                        </button>
                      ))}
                      {showEur && eurOfi && (
                        <button style={btnStyle} onMouseEnter={e => hover(e, true)} onMouseLeave={e => hover(e, false)}
                          onClick={() => { setSearchQuery(''); setSearchOpen(false); if (onTabChange) onTabChange('euro'); }}>
                          {flag('https://flagcdn.com/w40/eu.png')}
                          <span><span style={{ fontSize: '0.85rem' }}>Euro</span>{sub('Oficial / Blue / Tarjeta')}</span>
                        </button>
                      )}
                      {showBrl && brlOfi && (
                        <button style={btnStyle} onMouseEnter={e => hover(e, true)} onMouseLeave={e => hover(e, false)}
                          onClick={() => { setSearchQuery(''); setSearchOpen(false); if (onTabChange) onTabChange('real'); }}>
                          {flag('https://flagcdn.com/w40/br.png')}
                          <span><span style={{ fontSize: '0.85rem' }}>Real Brasileño</span>{sub('Oficial / Blue / Tarjeta')}</span>
                        </button>
                      )}
                      {showClp && clpOfi && (
                        <button style={btnStyle} onMouseEnter={e => hover(e, true)} onMouseLeave={e => hover(e, false)}
                          onClick={() => { setSearchQuery(''); setSearchOpen(false); if (onTabChange) onTabChange('clp'); }}>
                          {flag('https://flagcdn.com/w40/cl.png')}
                          <span><span style={{ fontSize: '0.85rem' }}>Peso Chileno</span>{sub('Oficial / Tarjeta')}</span>
                        </button>
                      )}
                      {showUyu && uyuOfi && (
                        <button style={btnStyle} onMouseEnter={e => hover(e, true)} onMouseLeave={e => hover(e, false)}
                          onClick={() => { setSearchQuery(''); setSearchOpen(false); if (onTabChange) onTabChange('uyu'); }}>
                          {flag('https://flagcdn.com/w40/uy.png')}
                          <span><span style={{ fontSize: '0.85rem' }}>Peso Uruguayo</span>{sub('Oficial / Tarjeta')}</span>
                        </button>
                      )}
                      {noResults && (
                        <div style={{ padding: '12px', color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center' }}>No se encontraron resultados</div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          <a
            href="https://github.com/ValentinTarantino/DolarArg/releases/download/v1.0.0/DolarARG.apk"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              borderRadius: '8px',
              background: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.2)',
              fontSize: '0.72rem',
              color: '#10b981',
              textDecoration: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(16,185,129,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(16,185,129,0.08)';
            }}
          >
            <Download size={14} />
            <span style={{fontWeight:600}}>Descargar App</span>
          </a>
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
              <span>{lastUpdated ? (() => { const m = lastUpdated.match(/(\d{1,2}):(\d{2}):\d{2}/); return m ? `Hoy ${m[1].padStart(2,'0')}:${m[2]}hs` : lastUpdated; })() : ''}</span>
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
              {searchQuery && (() => {
                  const t = searchQuery.toLowerCase();
                  const btnStyle = { width: '100%', padding: '8px 12px', background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', textAlign: 'left' as const, borderRadius: '6px', transition: 'background 0.2s', display: 'flex', alignItems: 'center', gap: '10px' };
                  const hover = (e: React.MouseEvent<HTMLButtonElement>, enter: boolean) => { e.currentTarget.style.background = enter ? 'rgba(255,255,255,0.05)' : 'transparent'; };
                  const flag = (src: string) => <img src={src} alt="" width={20} height={14} style={{borderRadius:'2px',flexShrink:0}} />;
                  const sub = (text: string) => <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginTop: '1px' }}>{text}</span>;
                  const dolarItems = rates.filter(r => `dólar ${r.nombre}`.toLowerCase().includes(t) || r.casa.toLowerCase().includes(t) || r.nombre.toLowerCase().includes(t) || t === 'd' || t === 'dolar');
                  const showEur = 'euro'.includes(t) || t === 'e' || 'eur'.includes(t);
                  const showBrl = 'real'.includes(t) || t === 'r' || 'brl'.includes(t);
                  const showClp = 'peso chileno'.includes(t) || 'chileno'.includes(t) || 'clp'.includes(t);
                  const showUyu = 'peso uruguayo'.includes(t) || 'uruguayo'.includes(t) || 'uyu'.includes(t);
                  const eurOfi = intlRates.find(r => r.codigo === 'EUR' && r.tipo === 'oficial');
                  const brlOfi = intlRates.find(r => r.codigo === 'BRL' && r.tipo === 'oficial');
                  const clpOfi = clpUyuRates.find(r => r.codigo === 'CLP' && r.tipo === 'oficial');
                  const uyuOfi = clpUyuRates.find(r => r.codigo === 'UYU' && r.tipo === 'oficial');
                  const noResults = dolarItems.length === 0 && !showEur && !showBrl && !showClp && !showUyu;
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {dolarItems.map(rate => (
                        <button key={`m-dolar-${rate.casa}`} style={btnStyle} onMouseEnter={e => hover(e, true)} onMouseLeave={e => hover(e, false)}
                          onClick={() => { setSearchQuery(''); setMenuOpen(false); if (onHighlightCard) onHighlightCard({ currency: 'dolar', tipo: rate.casa }); if (activeTab !== 'dolar' && onTabChange) { onTabChange('dolar'); setTimeout(() => { const c = document.querySelector(`[data-casa="${rate.casa}"]`); if (c) c.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 100); } else { const c = document.querySelector(`[data-casa="${rate.casa}"]`); if (c) c.scrollIntoView({ behavior: 'smooth', block: 'center' }); } }}>
                          {flag('https://flagcdn.com/w40/us.png')}
                          <span style={{ fontSize: '0.85rem' }}>Dólar {rate.nombre}</span>
                        </button>
                      ))}
                      {showEur && eurOfi && (<button style={btnStyle} onMouseEnter={e => hover(e, true)} onMouseLeave={e => hover(e, false)} onClick={() => { setSearchQuery(''); setMenuOpen(false); if (onTabChange) onTabChange('euro'); }}>{flag('https://flagcdn.com/w40/eu.png')}<span><span style={{fontSize:'0.85rem'}}>Euro</span>{sub('Oficial / Blue / Tarjeta')}</span></button>)}
                      {showBrl && brlOfi && (<button style={btnStyle} onMouseEnter={e => hover(e, true)} onMouseLeave={e => hover(e, false)} onClick={() => { setSearchQuery(''); setMenuOpen(false); if (onTabChange) onTabChange('real'); }}>{flag('https://flagcdn.com/w40/br.png')}<span><span style={{fontSize:'0.85rem'}}>Real Brasileño</span>{sub('Oficial / Blue / Tarjeta')}</span></button>)}
                      {showClp && clpOfi && (<button style={btnStyle} onMouseEnter={e => hover(e, true)} onMouseLeave={e => hover(e, false)} onClick={() => { setSearchQuery(''); setMenuOpen(false); if (onTabChange) onTabChange('clp'); }}>{flag('https://flagcdn.com/w40/cl.png')}<span><span style={{fontSize:'0.85rem'}}>Peso Chileno</span>{sub('Oficial / Tarjeta')}</span></button>)}
                      {showUyu && uyuOfi && (<button style={btnStyle} onMouseEnter={e => hover(e, true)} onMouseLeave={e => hover(e, false)} onClick={() => { setSearchQuery(''); setMenuOpen(false); if (onTabChange) onTabChange('uyu'); }}>{flag('https://flagcdn.com/w40/uy.png')}<span><span style={{fontSize:'0.85rem'}}>Peso Uruguayo</span>{sub('Oficial / Tarjeta')}</span></button>)}
                      {noResults && <div style={{ padding: '12px', color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center' }}>No se encontraron resultados</div>}
                    </div>
                  );
                })()}
            </div>
          </div>

          {lastUpdated && (
            <div className="mobile-menu-footer">
              <Activity size={12} />
              <span>{lastUpdated ? (() => { const m = lastUpdated.match(/(\d{1,2}):(\d{2}):\d{2}/); return m ? `Hoy ${m[1].padStart(2,'0')}:${m[2]}hs` : lastUpdated; })() : ''}</span>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
