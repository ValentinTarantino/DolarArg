"use client";

import React, { useState, useEffect } from 'react';
import { Clock, TrendingUp, Moon, Timer } from 'lucide-react';
import { useLanguage } from './LanguageProvider';

const MARKET_OPEN_HOUR = 10;
const MARKET_CLOSE_HOUR = 15;

function getArgentinaTime() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc - 3 * 3600000);
}

function isMarketOpen(art: Date) {
  const day = art.getDay();
  if (day === 0 || day === 6) return false;
  const totalMin = art.getHours() * 60 + art.getMinutes();
  return totalMin >= MARKET_OPEN_HOUR * 60 && totalMin < MARKET_CLOSE_HOUR * 60;
}

function getSecondsUntilNextEvent(art: Date): { label: string; sublabel: string; ms: number } {
  const day = art.getDay();
  const totalSec = art.getHours() * 3600 + art.getMinutes() * 60 + art.getSeconds();
  const openSec = MARKET_OPEN_HOUR * 3600;
  const closeSec = MARKET_CLOSE_HOUR * 3600;

  if (day === 6) return { label: 'Faltan para la apertura', sublabel: 'Lunes 10:00 hs', ms: (2 * 86400 + openSec - totalSec) * 1000 };
  if (day === 0) return { label: 'Faltan para la apertura', sublabel: 'Lunes 10:00 hs', ms: (1 * 86400 + openSec - totalSec) * 1000 };
  if (totalSec < openSec) return { label: 'Faltan para que abra el mercado', sublabel: 'Hoy 10:00 hs', ms: (openSec - totalSec) * 1000 };
  if (totalSec < closeSec) return { label: 'Faltan para el cierre', sublabel: 'Hoy 15:00 hs', ms: (closeSec - totalSec) * 1000 };
  if (day === 5) return { label: 'Faltan para la apertura', sublabel: 'Lunes 10:00 hs', ms: (3 * 86400 + openSec - totalSec) * 1000 };
  return { label: 'Faltan para la apertura', sublabel: 'Mañana 10:00 hs', ms: (86400 + openSec - totalSec) * 1000 };
}

function formatCountdown(ms: number) {
  if (ms <= 0) return '00:00:00';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h >= 24) {
    const d = Math.floor(h / 24);
    const rh = h % 24;
    return `${d}d ${String(rh).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`;
  }
  if (h > 0) return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
  return `${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
}

const MarketStatus: React.FC = () => {
  const { language, t } = useLanguage();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const art = getArgentinaTime();
  const open = isMarketOpen(art);
  const { label, sublabel, ms } = getSecondsUntilNextEvent(art);
  const countdown = formatCountdown(ms);
  const day = art.getDay();
  const isWeekend = day === 0 || day === 6;

  const statusColor = open ? '#10b981' : isWeekend ? '#64748b' : '#f59e0b';
  const statusBg = open ? 'rgba(16, 185, 129, 0.08)' : isWeekend ? 'rgba(100, 116, 139, 0.08)' : 'rgba(245, 158, 11, 0.08)';
  const statusBorder = open ? 'rgba(16, 185, 129, 0.2)' : isWeekend ? 'rgba(100, 116, 139, 0.2)' : 'rgba(245, 158, 11, 0.2)';
  const statusLabel = t(open ? 'MERCADO ABIERTO' : isWeekend ? 'FIN DE SEMANA' : 'MERCADO CERRADO');

  const locale = language === 'en' ? 'en-AR' : 'es-AR';
  const timeStr = art.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const dateStr = art.toLocaleDateString(locale, { weekday: 'long', day: '2-digit', month: 'short' });

  // Progreso de sesión (solo días hábiles con mercado abierto)
  const marketSec = (MARKET_CLOSE_HOUR - MARKET_OPEN_HOUR) * 3600;
  const currentSec = art.getHours() * 3600 + art.getMinutes() * 60 + art.getSeconds();
  const elapsedMarketSec = Math.max(0, Math.min(currentSec - MARKET_OPEN_HOUR * 3600, marketSec));
  const sessionProgress = open ? (elapsedMarketSec / marketSec) * 100 : 0;

  return (
    <div
      className="dolar-card market-status-card"
      style={{
        cursor: 'default',
        padding: '24px',
        alignItems: 'center',
        gap: 0,
      }}
    >
      {/* ── LEFT: Hora actual de Argentina ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '24px' }}>
        
        <div style={{ fontSize: '0.68rem', color: '#4a5578', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>
          {t('Hora actual · Argentina')}
        </div>

        <div style={{
          fontFamily: 'var(--font-space, "Space Grotesk"), monospace',
          fontSize: '2.6rem', fontWeight: 700, letterSpacing: '-0.02em',
          color: '#eef2ff', lineHeight: 1
        }}>
          {timeStr}
        </div>

        <div style={{ fontSize: '0.8rem', color: '#8b9cc4', textTransform: 'capitalize' }}>
          {dateStr}
        </div>

        {/* Status badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: statusBg, border: `1px solid ${statusBorder}`,
          borderRadius: '8px', padding: '6px 14px',
          fontSize: '0.72rem', fontWeight: 700, color: statusColor,
          letterSpacing: '0.07em', width: 'fit-content', marginTop: '4px'
        }}>
          {isWeekend ? <Moon size={12} /> : open ? <TrendingUp size={12} /> : <Clock size={12} />}
          {statusLabel}
        </div>

        <div style={{ display: 'flex', gap: '12px', fontSize: '0.68rem', color: '#4a5578' }}>
          <span>{t('Lun – Vie · 10:00 a 15:00')}</span>
        </div>
      </div>

      {/* Divider */}
      <div className="market-status-divider" style={{ background: 'rgba(255,255,255,0.05)' }} />

      {/* ── RIGHT: Cuenta regresiva ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingLeft: '24px' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.68rem', color: '#4a5578', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>
          <Timer size={12} />
          {t('Cuenta regresiva')}
        </div>

        <div style={{
          fontFamily: 'var(--font-space, "Space Grotesk"), monospace',
          fontSize: '2.6rem', fontWeight: 700, letterSpacing: '-0.02em',
          color: statusColor, lineHeight: 1
        }}>
          {countdown}
        </div>

        <div style={{ fontSize: '0.8rem', color: '#8b9cc4' }}>
          {t(label)}
        </div>

        <div style={{ fontSize: '0.72rem', color: '#4a5578' }}>
          {t(sublabel)}
        </div>

        {/* Barra progreso sesión */}
        {!isWeekend && (
          <div style={{ marginTop: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#4a5578', marginBottom: '5px' }}>
              <span>10:00</span>
              <span>{open ? `${sessionProgress.toFixed(0)}% ${language === 'en' ? 'of session' : 'de la sesión'}` : t('Sesión inactiva')}</span>
              <span>15:00</span>
            </div>
            <div style={{ width: '100%', height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{
                width: `${sessionProgress}%`, height: '100%',
                background: `linear-gradient(to right, ${statusColor}66, ${statusColor})`,
                borderRadius: '2px', transition: 'width 1s linear'
              }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketStatus;
