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
  currency?: 'EUR' | 'BRL';
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
        const response = await fetch('/api/exchange-rates/variants');
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
      'BRL': '🇧🇷'
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
        'BRL': 'Real'
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

  return (
    <div className="panel">
      {!currency && (
        <div className="panel-title">
          <span>Conversor Universal de Monedas</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
          Cargando tipos de cambio...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: '600' }}>
              Convertir
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <select
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value)}
                style={{
                  padding: '10px 12px',
                  backgroundColor: '#1e293b',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#f1f5f9',
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                {currencies.map(curr => (
                  <option key={curr.code} value={curr.code}>
                    {getCurrencyEmoji(curr.code)} {currency ? curr.name : `${curr.code} - ${curr.name}`}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={fromAmount}
                onChange={(e) => handleAmountChange(e.target.value, setFromAmount)}
                maxLength={15}
                style={{
                  padding: '10px 12px',
                  backgroundColor: '#1e293b',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: '#f1f5f9',
                  fontSize: '0.9rem',
                  MozAppearance: 'textfield',
                  WebkitAppearance: 'none'
                }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={swapCurrencies}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.9rem',
                fontWeight: '600',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#3b82f6')}
            >
              <ArrowRightLeft size={16} />
              Cambiar
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: '600' }}>
              Resultado
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <select
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value)}
                style={{
                  padding: '10px 12px',
                  backgroundColor: '#1e293b',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#f1f5f9',
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                {currencies.map(curr => (
                  <option key={curr.code} value={curr.code}>
                    {getCurrencyEmoji(curr.code)} {currency ? curr.name : `${curr.code} - ${curr.name}`}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={toAmount}
                readOnly
                style={{
                  padding: '10px 12px',
                  backgroundColor: '#0f172a',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#3b82f6',
                  fontSize: '0.9rem',
                  fontWeight: '700',
                  cursor: 'not-allowed',
                  MozAppearance: 'textfield',
                  WebkitAppearance: 'none'
                }}
              />
            </div>
          </div>

          <div
            style={{
              padding: '16px',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '8px',
              textAlign: 'center'
            }}
          >
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>Conversión</p>
            <p style={{ color: '#3b82f6', fontSize: '1.3rem', fontWeight: '700', margin: '8px 0 0 0' }}>
              {fromAmount} {getCurrencyDisplayName(fromCurrency)} = {toAmount} {getCurrencyDisplayName(toCurrency)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UniversalConverter;
