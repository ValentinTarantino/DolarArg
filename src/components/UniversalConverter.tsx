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
    // Allow digits and dots (dots used as thousand separators in Argentine format)
    const sanitized = value.replace(/[^0-9.]/g, '');
    setter(sanitized);
  };

  // Strip thousand-separator dots and parse to number
  const parseAmount = (val: string) => {
    // If the dot is used as a decimal (e.g. "100.5") we keep it;
    // but if there are multiple dots (e.g. "100.000.000") all are thousand separators
    const dotCount = (val.match(/\./g) || []).length;
    if (dotCount > 1) {
      // Multiple dots → all are thousand separators
      return Number(val.replace(/\./g, ''));
    }
    if (dotCount === 1) {
      const parts = val.split('.');
      // If the decimal part has exactly 3 digits it's a thousand separator (e.g. "100.000")
      if (parts[1]?.length === 3) {
        return Number(val.replace(/\./g, ''));
      }
    }
    return Number(val);
  };

  const calculateConversion = () => {
    const numericAmount = parseAmount(fromAmount);
    if (!fromAmount || isNaN(numericAmount) || rates.length === 0) {
      setToAmount('0');
      return;
    }

    let result = numericAmount;

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
    backgroundColor: 'rgba(255,255,255,0.025)',
    border: '1px solid rgba(148,163,184,0.16)',
    borderRadius: '9px',
    color: '#f1f5f9',
    fontSize: '1.1rem',
    fontWeight: 600,
    outline: 'none',
    boxSizing: 'border-box',
  };

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    backgroundColor: 'rgba(255,255,255,0.025)',
    border: '1px solid rgba(148,163,184,0.14)',
    borderRadius: '8px',
    color: '#94a3b8',
    fontSize: '0.82rem',
    fontWeight: 600,
    cursor: 'pointer',
    outline: 'none',
    marginBottom: '8px',
  };

  return (
    <div className="panel converter-panel">
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
          <div className="converter-grid" style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '14px', alignItems: 'center' }}>

            {/* Origen */}
            <div className="converter-side">
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
                backgroundColor: 'rgba(255,255,255,0.035)',
                border: '1px solid rgba(148,163,184,0.2)',
                color: '#94a3b8',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.035)'; }}
            >
              <ArrowRightLeft size={16} />
            </button>

            {/* Destino */}
            <div className="converter-side converter-side--target">
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
                style={{ ...inputStyle, color: '#e2e8f0', cursor: 'default' }}
              />
            </div>
          </div>

          {/* Resultado */}
          <div className="converter-result" style={{
            padding: '14px 18px',
            background: 'linear-gradient(100deg, rgba(52,211,153,0.055), rgba(255,255,255,0.018) 55%)',
            border: '1px solid rgba(52,211,153,0.16)',
            borderRadius: '10px',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
          }}>
            <p style={{ color: '#64748b', fontSize: '0.68rem', fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Resultado</p>
            <p style={{ color: '#f1f5f9', fontSize: '1rem', fontWeight: 650, margin: 0, textAlign: 'right' }}>
              <span style={{ color: '#94a3b8' }}>{fromAmount} {getCurrencyDisplayName(fromCurrency)}</span>
              <span style={{ color: '#475569', margin: '0 8px' }}>=</span>
              <span style={{ color: '#e2e8f0' }}>{toAmount} {getCurrencyDisplayName(toCurrency)}</span>
            </p>
          </div>

        </div>
      )}
    </div>
  );
};

export default UniversalConverter;
