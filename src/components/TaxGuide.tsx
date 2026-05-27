"use client";

import React from 'react';
import { BookOpen } from 'lucide-react';

export default function TaxGuide() {
  const dollarInfo = [
    { name: 'Dólar Oficial', desc: 'Cotización base del Banco Nación sin impuestos. Usado como referencia para el cálculo impositivo de importaciones y tarjetas.', color: '#10b981' },
    { name: 'Dólar Blue', desc: 'Dólar del mercado informal (paralelo). Libre de impuestos y sin límites de compra diarios ni mensuales.', color: '#6366f1' },
    { name: 'Dólar MEP / Bolsa', desc: 'Dólar legal que se adquiere a través de la compra-venta de bonos que cotizan en pesos y en dólares. Sin límites.', color: '#f59e0b' },
    { name: 'Dólar CCL', desc: 'Contado con Liquidación. Permite cambiar pesos por dólares en el exterior a través de la compra de acciones o bonos.', color: '#06b6d4' },
    { name: 'Dólar Tarjeta', desc: 'Dólar oficial más percepciones (30% percepción de ganancias). Se aplica a compras con tarjeta en moneda extranjera.', color: '#f43f5e' },
    { name: 'Dólar Cripto', desc: 'Cotización en plataformas de criptomonedas para la compra de stablecoins (USDT/DAI) las 24 horas del día.', color: '#a855f7' }
  ];

  return (
    <div className="panel" style={{ flex: 1 }}>
      <div className="panel-title">
        <BookOpen size={22} style={{ color: '#a855f7' }} />
        <span>Glosario de Dólares</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {dollarInfo.map((info, idx) => (
          <div key={idx} style={{
            padding: '12px 16px',
            background: 'rgba(255, 255, 255, 0.015)',
            border: '1px solid rgba(255, 255, 255, 0.03)',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: info.color
              }}></span>
              <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#ffffff' }}>{info.name}</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: '1.4' }}>{info.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
