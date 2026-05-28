"use client";

import React from 'react';

interface FooterProps {
  onTabChange?: (tab: string) => void;
  lastUpdated?: string | null;
}

const sections = [
  { label: 'Dólar', tab: 'dolar' },
  { label: 'Euro', tab: 'euro' },
  { label: 'Real Brasileño', tab: 'real' },
  { label: 'Peso Chileno', tab: 'clp' },
  { label: 'Peso Uruguayo', tab: 'uyu' },
  { label: 'Cripto', tab: 'cripto' },
];

const sources = [
  { name: 'BCRA', desc: 'Dólar oficial y mayorista', url: 'https://www.bcra.gob.ar' },
  { name: 'Bluelytics', desc: 'Dólar blue y paralelo', url: 'https://bluelytics.com.ar' },
  { name: 'CoinGecko', desc: 'Criptomonedas', url: 'https://www.coingecko.com' },
  { name: 'Ámbito', desc: 'Referencia de mercado', url: 'https://www.ambito.com' },
  { name: 'INDEC', desc: 'Indicadores macroeconómicos', url: 'https://www.indec.gob.ar' },
  { name: 'ArgentinaDatos', desc: 'Datos económicos abiertos', url: 'https://argentinadatos.com' },
];

export default function Footer({ onTabChange, lastUpdated }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer__top-border" />

      <div className="site-footer__inner">
        {/* Columna 1 — Marca */}
        <div className="site-footer__col site-footer__col--brand">
          <div className="site-footer__logo">
            <span className="site-footer__logo-dollar">$</span>
            <span className="site-footer__logo-text">
              <span style={{ color: '#ffffff' }}>DÓLAR</span>
              <span style={{ color: '#6366f1' }}>ARG</span>
            </span>
          </div>
          <p className="site-footer__brand-desc">
            Cotizaciones del dólar y divisas en Argentina actualizadas en tiempo real. Compará tipos de cambio, configurá alertas y seguí el mercado cambiario.
          </p>
          <div className="site-footer__badge">
            <span className="site-footer__badge-dot" />
            Datos en tiempo real
          </div>
          {lastUpdated && (
            <p className="site-footer__updated">Última actualización: {lastUpdated}</p>
          )}
        </div>

        {/* Columna 2 — Secciones */}
        <div className="site-footer__col">
          <h4 className="site-footer__col-title">Secciones</h4>
          <ul className="site-footer__links">
            {sections.map(s => (
              <li key={s.tab}>
                <button
                  className="site-footer__link-btn"
                  onClick={() => {
                    onTabChange?.(s.tab);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Columna 3 — Fuentes */}
        <div className="site-footer__col">
          <h4 className="site-footer__col-title">Fuentes de datos</h4>
          <ul className="site-footer__links">
            {sources.map(s => (
              <li key={s.name}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="site-footer__source-link"
                >
                  <span className="site-footer__source-name">{s.name}</span>
                  <span className="site-footer__source-desc">{s.desc}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Columna 4 — Legal */}
        <div className="site-footer__col">
          <h4 className="site-footer__col-title">Legal</h4>
          <div className="site-footer__disclaimer-badge">
            ⚠ Solo informativo
          </div>
          <p className="site-footer__disclaimer">
            Los datos publicados en este sitio son de carácter <strong>exclusivamente informativo</strong>. No constituyen asesoramiento financiero, ni recomendación de compra o venta de divisas. Verificá siempre con tu banco o casa de cambio antes de operar.
          </p>
          <p className="site-footer__disclaimer" style={{ marginTop: '10px' }}>
            Las cotizaciones pueden presentar demoras o diferencias respecto a los valores reales del mercado.
          </p>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="site-footer__bottom">
        <span>© {year} DólarARG · Todos los derechos reservados</span>
        <span className="site-footer__bottom-sep">·</span>
        <span>Hecho en Argentina 🇦🇷</span>
      </div>
    </footer>
  );
}
