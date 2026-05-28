"use client";

import React, { useState, useEffect } from 'react';
import { ArrowRightLeft } from 'lucide-react';

interface ExchangeRate {
  codigo: string;
  nombre: string;
  compra: number;
  venta: number;
  fecha: Date;
}

interface ExchangeRateVariant extends ExchangeRate {
  casa: string;
  tipo: string;
}

interface UniversalConverterProps {
  currency?: 'EUR' | 'BRL' | 'CLP' | 'UYU';
}

const UniversalConverter: React.FC<UniversalConverterProps> = ({ currency }) => {
  const [rates, setRates] = useState<ExchangeRateVariant[]>([]);
  const [fromCurrency, setFromCurrency] = useState('ARS');
  const [toCurrency, setToCurrency] = useState(currency ? `${currency}-oficial` : 'EUR');
  const [fromAmount, setFromAmount] = useState('100');
  const [toAmount, setToAmount] = useState('0');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const endpoint = (currency === 'CLP' || currency === 'UYU')
          ? '/api/exchange-rates/clp-uyu'
          : '/api/exchange-rates/variants';
        const response = await fetch(endpoint);
        if (response.ok) {
          const data = await response.json();
          if (currency) {
            const filtered = data.filter((r: ExchangeRateVariant) => r.codigo === currency);
            setRates(filtered);
          } else {
            setRates(data);
          }
        }
      } catch (error) {
        console.error('Error fetching rates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRates();
  }, [currency]);

  useEffect(() => {
    calculateConversion();
  }, [fromAmount, fromCurrency, toCurrency, rates]);

  const handleAmountChange = (value: string, setter: (val: string) => void) => {
    const sanitized = value.replace(/[^0-9.]/g, '');
    const parts = sanitized.split('.');
    if (parts.length > 2) {
      setter(parts[0] + '.' + parts.slice(1).join(''));
    } else {
      setter(sanitized);
    }
  };

  const calculateConversion = () => {
    if (!fromAmount || isNaN(Number(fromAmount)) || rates.length === 0) {
      setToAmount('0');
      return;
    }

    let result = Number(fromAmount);

    if (fromCurrency === 'ARS') {
      const rateObj = rates.find(r => `${r.codigo}-${r.tipo}` === toCurrency);
      if (rateObj) {
        result = result / rateObj.venta;
      }
    }
    else if (toCurrency === 'ARS') {
      const rateObj = rates.find(r => `${r.codigo}-${r.tipo}` === fromCurrency);
      if (rateObj) {
        result = result * rateObj.venta;
      }
    }
    else {
      const fromRate = rates.find(r => `${r.codigo}-${r.tipo}` === fromCurrency);
      const toRate = rates.find(r => `${r.codigo}-${r.tipo}` === toCurrency);
      if (fromRate && toRate) {
        result = result * (fromRate.venta / toRate.venta);
      }
    }

    setToAmount(result.toFixed(2));
  };

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setFromAmount(toAmount);
  };

  const getCurrencyEmoji = (codigo: string): string => {
    const emojis: Record<string, string> = {
      'ARS': '🇦🇷',
      'EUR': '🇪🇺',
      'BRL': '🇧🇷',
      'CLP': '🇨🇱',
      'UYU': '🇺🇾'
    };
    const baseCode = codigo.split('-')[0];
    return emojis[baseCode] || '💱';
  };

  const getCurrencyDisplayName = (codigo: string): string => {
    if (codigo === 'ARS') return 'Pesos Argentinos';
    if (currency) {
      const [code, tipo] = codigo.split('-');
      const tipoNames: Record<string, string> = {
        'oficial': 'Oficial',
        'blue': 'Blue',
        'tarjeta': 'Tarjeta'
      };
      const currencyNames: Record<string, string> = {
        'EUR': 'Euro',
        'BRL': 'Real',
        'CLP': 'Peso Chileno',
        'UYU': 'Peso Uruguayo'
      };
      return `${currencyNames[code] || ''} ${tipoNames[tipo] || tipo}`.trim();
    }
    const rate = rates.find(r => r.codigo === codigo);
    return rate ? rate.nombre : codigo;
  };

  const currencies = currency
    ? [
        { code: 'ARS', name: 'Pesos Argentinos' },
        ...rates.map(r => ({ code: `${r.codigo}-${r.tipo}`, name: getCurrencyDisplayName(`${r.codigo}-${r.tipo}`) }))
      ]
    : [
        { code: 'ARS', name: 'Pesos Argentinos' },
        ...rates.map(r => ({ code: r.codigo, name: r.nombre }))
      ];

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    color: '#f1f5f9',
    fontSize: '1.1rem',
    fontWeight: 600,
    outline: 'none',
    boxSizing: 'border-box',
  };

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    color: '#94a3b8',
    fontSize: '0.82rem',
    fontWeight: 600,
    cursor: 'pointer',
    outline: 'none',
    marginBottom: '8px',
  };

  return (
    <div className="panel">
      {!currency && (
        <div className="panel-title">
          <span>Conversor de Monedas</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
          Cargando tipos de cambio...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Fila principal: origen — swap — destino */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '12px', alignItems: 'center' }}>

            {/* Origen */}
            <div>
              <select value={fromCurrency} onChange={(e) => setFromCurrency(e.target.value)} style={selectStyle}>
                {currencies.map(curr => (
                  <option key={curr.code} value={curr.code}>
                    {getCurrencyEmoji(curr.code)} {currency ? curr.name : `${curr.code} — ${curr.name}`}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={fromAmount}
                onChange={(e) => handleAmountChange(e.target.value, setFromAmount)}
                maxLength={15}
                placeholder="0"
                style={inputStyle}
              />
            </div>

            {/* Botón swap */}
            <button
              onClick={swapCurrencies}
              title="Invertir"
              style={{
                width: '40px', height: '40px',
                borderRadius: '50%',
                backgroundColor: 'rgba(59,130,246,0.15)',
                border: '1px solid rgba(59,130,246,0.4)',
                color: '#3b82f6',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(59,130,246,0.3)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(59,130,246,0.15)'; }}
            >
              <ArrowRightLeft size={16} />
            </button>

            {/* Destino */}
            <div>
              <select value={toCurrency} onChange={(e) => setToCurrency(e.target.value)} style={selectStyle}>
                {currencies.map(curr => (
                  <option key={curr.code} value={curr.code}>
                    {getCurrencyEmoji(curr.code)} {currency ? curr.name : `${curr.code} — ${curr.name}`}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={toAmount}
                readOnly
                style={{ ...inputStyle, color: '#10b981', backgroundColor: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', cursor: 'default' }}
              />
            </div>
          </div>

          {/* Resultado */}
          <div style={{
            padding: '14px 18px',
            background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(16,185,129,0.06))',
            border: '1px solid rgba(59,130,246,0.2)',
            borderRadius: '10px',
            textAlign: 'center',
          }}>
            <p style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Resultado</p>
            <p style={{ color: '#f1f5f9', fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
              <span style={{ color: '#94a3b8' }}>{fromAmount} {getCurrencyDisplayName(fromCurrency)}</span>
              <span style={{ color: '#475569', margin: '0 8px' }}>=</span>
              <span style={{ color: '#10b981' }}>{toAmount} {getCurrencyDisplayName(toCurrency)}</span>
            </p>
          </div>

        </div>
      )}
    </div>
  );
};

export default UniversalConverter;
