"use client";

import React, { useState } from 'react';
import { useLanguage } from './LanguageProvider';
import { Calculator as CalcIcon } from 'lucide-react';

interface DolarRate {
  casa: string;
  nombre: string;
  compra: number;
  venta: number;
}

interface CalculatorProps {
  rates: DolarRate[];
}

const Calculator: React.FC<CalculatorProps> = ({ rates }) => {
  const { t } = useLanguage();
  const [amount, setAmount] = useState<string>('');
  const [selectedCasa, setSelectedCasa] = useState<string>('blue');
  const [customTaxGanancias, setCustomTaxGanancias] = useState<string>(''); // Percepción Ganancias/Bienes Personales
  const [conversionDirection, setConversionDirection] = useState<'usd-to-ars' | 'ars-to-usd'>('usd-to-ars');
  const [rateType, setRateType] = useState<'compra' | 'venta'>('venta');

  // Obtener la tasa seleccionada (compra o venta)
  const currentRate = rates.find(r => r.casa === selectedCasa);
  const rateValue = currentRate ? (rateType === 'compra' ? currentRate.compra : currentRate.venta) : 1;

  const numericAmount = parseFloat(amount) || 0;
  const taxGananciasPercent = parseFloat(customTaxGanancias) || 0;

  let convertedValue = 0;
  let taxGanancias = 0;
  let totalWithTaxes = 0;

  // Si es oficial o tarjeta, desglosamos los impuestos
  const isOfficialOrCard = selectedCasa === 'oficial' || selectedCasa === 'tarjeta';

  // Conversión según la dirección seleccionada
  if (conversionDirection === 'usd-to-ars') {
    // USD a ARS
    if (isOfficialOrCard) {
      const oficialRate = rates.find(r => r.casa === 'oficial')?.venta || rateValue;
      const baseValue = numericAmount * oficialRate;
      taxGanancias = baseValue * (taxGananciasPercent / 100);
      convertedValue = baseValue;
      totalWithTaxes = baseValue + taxGanancias;
    } else {
      convertedValue = numericAmount * rateValue;
      totalWithTaxes = convertedValue;
    }
  } else {
    // ARS a USD
    if (isOfficialOrCard) {
      const oficialRate = rates.find(r => r.casa === 'oficial')?.venta || rateValue;
      const baseValue = numericAmount / oficialRate;
      taxGanancias = baseValue * (taxGananciasPercent / 100);
      convertedValue = baseValue;
      totalWithTaxes = baseValue + taxGanancias;
    } else {
      convertedValue = numericAmount / rateValue;
      totalWithTaxes = convertedValue;
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', 'Home', 'End'].includes(e.key)) {
      return;
    }
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <div className="panel">
      <div className="panel-title">
        <span>Calculadora de USD y Pesos</span>
      </div>

      <div className="calculator-form">
        {/* Selector de dirección de conversión */}
        <div className="input-container">
          <label>{t('Dirección de Conversión')}</label>
          <div className="input-wrapper">
            <select
              value={conversionDirection}
              onChange={(e) => setConversionDirection(e.target.value as 'usd-to-ars' | 'ars-to-usd')}
            >
              <option value="usd-to-ars">{t('USD → ARS (Dólares a Pesos)')}</option>
              <option value="ars-to-usd">{t('ARS → USD (Pesos a Dólares)')}</option>
            </select>
          </div>
        </div>

        <div className="input-container">
          <label>Monto a Convertir ({conversionDirection === 'usd-to-ars' ? 'USD' : 'ARS'})</label>
          <div className="input-wrapper">
            <span className="currency-symbol" style={{ left: '14px', fontSize: '0.85rem' }}>
              {conversionDirection === 'usd-to-ars' ? 'USD' : 'ARS'}
            </span>
            <input
              id="calc-amount"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={amount}
              onChange={(e) => {
                const sanitized = e.target.value.replace(/[^0-9]/g, '');
                setAmount(sanitized);
              }}
              onKeyDown={handleKeyDown}
              placeholder={`${t('Ingresa el monto en')} ${conversionDirection === 'usd-to-ars' ? t('dólares') : t('pesos')}`}
              style={{ paddingLeft: '48px' }}
            />
          </div>
        </div>

        <div className="input-container">
          <label>{t('Tasa de Referencia')}</label>
          <div className="input-wrapper">
            <select
              value={rateType}
              onChange={(e) => setRateType(e.target.value as 'compra' | 'venta')}
            >
              <option value="compra">{t('Compra (Banco te compra)')}</option>
              <option value="venta">{t('Venta (Banco te vende)')}</option>
            </select>
          </div>
        </div>

        <div className="input-container">
          <label>{t('Cotización de Referencia')}</label>
          <div className="input-wrapper">
            <select
              id="calc-rate-select"
              value={selectedCasa}
              onChange={(e) => setSelectedCasa(e.target.value)}
            >
              {rates.map(r => (
                <option key={r.casa} value={r.casa}>
                  {rateType === 'compra' ? `Dólar ${r.nombre} (Compra: $${r.compra})` : `Dólar ${r.nombre} (Venta: $${r.venta})`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isOfficialOrCard && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="input-container">
              <label>{t('Percepción (%)')}</label>
              <div className="input-wrapper">
                <input
                  id="calc-tax-percepcion"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={customTaxGanancias}
                  onChange={(e) => {
                    const sanitized = e.target.value.replace(/[^0-9]/g, '');
                    setCustomTaxGanancias(sanitized);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Ej: 30"
                  style={{ paddingLeft: '14px' }}
                />
              </div>
            </div>
          </div>
        )}

        <div className="calculator-results">
          {isOfficialOrCard ? (
            <>
              <div className="result-row">
                <span>{conversionDirection === 'usd-to-ars' ? `Monto Base (USD ${numericAmount.toFixed(2)})` : `Monto Base (ARS ${numericAmount.toFixed(2)})`}</span>
                <span>{conversionDirection === 'usd-to-ars' ? `ARS ${convertedValue.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `USD ${convertedValue.toFixed(2)}`}</span>
              </div>
              <div className="result-row">
                <span>{`${t('Percepción')} (${taxGananciasPercent}%)`}</span>
                <span>{conversionDirection === 'usd-to-ars' ? `ARS ${taxGanancias.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `USD ${taxGanancias.toFixed(2)}`}</span>
              </div>
              <div className="result-row total">
                <span>{t('Total Estimado')}</span>
                <span className="total-price">{conversionDirection === 'usd-to-ars' ? `ARS ${totalWithTaxes.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `USD ${totalWithTaxes.toFixed(2)}`}</span>
              </div>
            </>
          ) : (
            <>
              <div className="result-row">
                <span>{conversionDirection === 'usd-to-ars' ? t('Monto en Dólares') : t('Monto en Pesos')}</span>
                <span>{conversionDirection === 'usd-to-ars' ? `USD ${numericAmount.toFixed(2)}` : `ARS ${numericAmount.toFixed(2)}`}</span>
              </div>
              <div className="result-row total">
                <span>{t('Total Estimado')}</span>
                <span className="total-price">{conversionDirection === 'usd-to-ars' ? `ARS ${totalWithTaxes.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `USD ${totalWithTaxes.toFixed(2)}`}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Calculator;
