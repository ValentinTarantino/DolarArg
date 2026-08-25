"use client";

import React from 'react';
import { useLanguage } from './LanguageProvider';

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

export default function Footer({ onTabChange }: FooterProps) {
  const { t } = useLanguage();
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
            {t('Cotizaciones del dólar y divisas en Argentina actualizadas en tiempo real. Compará tipos de cambio, configurá alertas y seguí el mercado cambiario.')}
          </p>
        </div>

        {/* Columna 2 — Secciones */}
        <div className="site-footer__col">
          <h4 className="site-footer__col-title">{t('Secciones')}</h4>
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
                  {t(s.label)}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Columna 3 — Fuentes */}
        <div className="site-footer__col">
          <h4 className="site-footer__col-title">{t('Fuentes de datos')}</h4>
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
                  <span className="site-footer__source-desc">{t(s.desc)}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Columna 4 — Legal */}
        <div className="site-footer__col">
          <h4 className="site-footer__col-title">{t('Legal')}</h4>
          <div className="site-footer__disclaimer-badge">
            {t('⚠ Solo informativo')}
          </div>
          <p className="site-footer__disclaimer">
            {t('Los datos publicados en este sitio son de carácter exclusivamente informativo. No constituyen asesoramiento financiero, ni recomendación de compra o venta de divisas. Verificá siempre con tu banco o casa de cambio antes de operar.')}
          </p>
          <p className="site-footer__disclaimer" style={{ marginTop: '10px' }}>
            {t('Las cotizaciones pueden presentar demoras o diferencias respecto a los valores reales del mercado.')}
          </p>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="site-footer__bottom">
        <span>© {year} DólarARG · {t('Todos los derechos reservados')}</span>
        <span className="site-footer__bottom-sep">·</span>
        <span>{t('Hecho en Argentina 🇦🇷')}</span>
      </div>
    </footer>
  );
}
