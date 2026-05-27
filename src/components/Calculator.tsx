"use client";

import React, { useState } from 'react';
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
  const [amount, setAmount] = useState<string>('');
  const [selectedCasa, setSelectedCasa] = useState<string>('blue');
  const [customTaxGanancias, setCustomTaxGanancias] = useState<string>(''); // Percepción Ganancias/Bienes Personales

  // Obtener la tasa seleccionada (usamos la de venta para calcular)
  const currentRate = rates.find(r => r.casa === selectedCasa);
  const rateValue = currentRate ? currentRate.venta : 1;

  const numericAmount = parseFloat(amount) || 0;
  const taxGananciasPercent = parseFloat(customTaxGanancias) || 0;

  let convertedValue = 0;
  let taxGanancias = 0;
  let totalWithTaxes = 0;

  // Si es oficial o tarjeta, desglosamos los impuestos
  const isOfficialOrCard = selectedCasa === 'oficial' || selectedCasa === 'tarjeta';

  // Conversión de USD a ARS con percepciones
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
        <CalcIcon size={22} />
        <span>Calculadora y Conversor de Impuestos</span>
      </div>

      <div className="calculator-form">
        <div className="input-container">
          <label>Monto a Convertir (USD)</label>
          <div className="input-wrapper">
            <span className="currency-symbol" style={{ left: '14px', fontSize: '0.85rem' }}>USD</span>
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
              placeholder="Ingresa el monto en dólares"
              style={{ paddingLeft: '48px' }}
            />
          </div>
        </div>

        <div className="input-container">
          <label>Cotización de Referencia</label>
          <div className="input-wrapper">
            <select
              id="calc-rate-select"
              value={selectedCasa}
              onChange={(e) => setSelectedCasa(e.target.value)}
            >
              {rates.map(r => (
                <option key={r.casa} value={r.casa}>
                  Dólar {r.nombre} (Venta: ${r.venta})
                </option>
              ))}
            </select>
          </div>
        </div>

        {isOfficialOrCard && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="input-container">
              <label>Percepción (%)</label>
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
                <span>Monto Base (USD {numericAmount.toFixed(2)})</span>
                <span>ARS ${convertedValue.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="result-row">
                <span>Percepción ({taxGananciasPercent}%)</span>
                <span>ARS ${taxGanancias.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="result-row total">
                <span>Total Estimado</span>
                <span className="total-price">ARS ${totalWithTaxes.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </>
          ) : (
            <>
              <div className="result-row">
                <span>Monto en Dólares</span>
                <span>USD {numericAmount.toFixed(2)}</span>
              </div>
              <div className="result-row total">
                <span>Total Estimado</span>
                <span className="total-price">ARS ${totalWithTaxes.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Calculator;
