"use client";

import React, { useState, useEffect } from 'react';

interface DolarMayoristaBreachaProps {
  mayorista: number;
}

const DolarMayoristaBrecha: React.FC<DolarMayoristaBreachaProps> = ({ mayorista }) => {
  const [percentage, setPercentage] = useState(0);

  useEffect(() => {
    const minValue = 700;
    const maxValue = 1500;
    const calculatedPercentage = Math.min(
      100,
      Math.max(0, ((mayorista - minValue) / (maxValue - minValue)) * 100)
    );
    setPercentage(calculatedPercentage);
  }, [mayorista]);

  const getStatus = () => {
    if (percentage <= 20) return { status: 'Favorable', color: '#10b981' };
    if (percentage <= 75) return { status: 'Intermedio', color: '#f59e0b' };
    if (percentage <= 90) return { status: 'Precaución', color: '#ef6546' };
    return { status: 'Crítico', color: '#ef4444' };
  };

  const { status, color } = getStatus();

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '32px',
      marginBottom: '40px',
      alignItems: 'center'
    }}>
      <div style={{ textAlign: 'center' }}>
        <svg width="300" height="200" viewBox="0 0 300 200" style={{ margin: '0 auto' }}>
          <path
            d="M 50 150 A 100 100 0 0 1 250 150"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="20"
            strokeLinecap="round"
          />
          <path
            d="M 50 150 A 100 100 0 0 1 90 65"
            fill="none"
            stroke="#10b981"
            strokeWidth="20"
            strokeLinecap="round"
          />
          <path
            d="M 90 65 A 100 100 0 0 1 215 55"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="20"
            strokeLinecap="round"
          />
          <path
            d="M 215 55 A 100 100 0 0 1 240 95"
            fill="none"
            stroke="#ef6546"
            strokeWidth="20"
            strokeLinecap="round"
          />
          <path
            d="M 240 95 A 100 100 0 0 1 250 150"
            fill="none"
            stroke="#ef4444"
            strokeWidth="20"
            strokeLinecap="round"
          />

          <g style={{ transform: `rotate(${90 + (percentage * 0.9)}deg)`, transformOrigin: '150px 150px', transition: 'transform 0.5s ease' }}>
            <line x1="150" y1="150" x2="150" y2="60" stroke={color} strokeWidth="3" strokeLinecap="round" />
            <circle cx="150" cy="150" r="8" fill={color} />
          </g>
          <text x="65" y="170" fontSize="10" fill="#94a3b8" textAnchor="middle">0%</text>
          <text x="150" y="180" fontSize="10" fill="#94a3b8" textAnchor="middle">50%</text>
          <text x="235" y="170" fontSize="10" fill="#94a3b8" textAnchor="middle">100%</text>

          <text x="150" y="140" fontSize="32" fontWeight="700" fill="#f1f5f9" textAnchor="middle">
            ${mayorista.toFixed(2)}
          </text>
        </svg>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{
          padding: '24px',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          border: '2px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '12px'
        }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#94a3b8', fontWeight: '600' }}>
            DÓLAR MAYORISTA
          </p>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: '700', color: '#3b82f6' }}>
            ${mayorista.toFixed(2)}
          </p>
        </div>

        <div style={{
          padding: '20px',
          backgroundColor: `${color}15`,
          border: `2px solid ${color}50`,
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#94a3b8', fontWeight: '600' }}>
            ESTADO ACTUAL
          </p>
          <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: '700', color }}>
            {status}
          </p>
          <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: '#cbd5e1' }}>
            {percentage.toFixed(1)}% del rango máximo
          </p>
        </div>

        <div style={{
          padding: '16px',
          backgroundColor: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px'
        }}>
          <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#cbd5e1', fontWeight: '600' }}>
            RANGO DE VALORES
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem' }}>
            <div style={{ color: '#94a3b8' }}>
              <p style={{ margin: '0 0 4px 0' }}>Mínimo (Favorable)</p>
              <p style={{ margin: 0, color: '#10b981', fontWeight: '700' }}>$700 - $900</p>
            </div>
            <div style={{ color: '#94a3b8' }}>
              <p style={{ margin: '0 0 4px 0' }}>Máximo (Crítico)</p>
              <p style={{ margin: 0, color: '#ef4444', fontWeight: '700' }}>$1.300 - $1.500</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DolarMayoristaBrecha;
