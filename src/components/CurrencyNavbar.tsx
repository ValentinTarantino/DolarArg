"use client";

import React, { useEffect, useRef } from 'react';

interface CurrencyNavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const CurrencyNavbar: React.FC<CurrencyNavbarProps> = ({ activeTab, onTabChange }) => {
  const tabsRef = useRef<HTMLDivElement>(null);
  const tabs = [
    { id: 'dolar',  label: 'Dólar',        icon: 'https://flagcdn.com/w40/us.png' },
    { id: 'real',   label: 'Real',          icon: 'https://flagcdn.com/w40/br.png' },
    { id: 'clp',    label: 'Peso Chileno',  icon: 'https://flagcdn.com/w40/cl.png' },
    { id: 'uyu',    label: 'Peso Uruguayo', icon: 'https://flagcdn.com/w40/uy.png' },
    { id: 'euro',   label: 'Euro',          icon: 'https://flagcdn.com/w40/eu.png' },
    { id: 'cripto', label: 'Cripto',        icon: 'https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png?1696501400' },
  ];

  useEffect(() => {
    const scroller = tabsRef.current;
    const activeButton = scroller?.querySelector<HTMLButtonElement>('[aria-selected="true"]');
    if (!scroller || !activeButton) return;

    const scrollerRect = scroller.getBoundingClientRect();
    const buttonRect = activeButton.getBoundingClientRect();
    const offset = buttonRect.left - scrollerRect.left - (scroller.clientWidth - buttonRect.width) / 2;
    scroller.scrollTo({ left: Math.max(0, scroller.scrollLeft + offset), behavior: 'smooth' });
  }, [activeTab]);

  return (
    <div className="currency-navbar-shell" style={{
      display: 'flex',
      justifyContent: 'center',
      marginBottom: '24px',
      marginTop: '0px',
      position: 'relative',
      zIndex: 100,
      backdropFilter: 'blur(10px)',
      padding: '12px 0',
      borderBottom: '1px solid rgba(255,255,255,0.1)'
    }}>
      <div ref={tabsRef} className="currency-navbar-tabs" role="tablist" aria-label="Seleccionar moneda" style={{
        display: 'flex',
        gap: '12px',
        padding: '12px',
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        borderRadius: '50px',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className="currency-navbar-tab"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              padding: '10px 20px',
              backgroundColor: activeTab === tab.id 
                ? 'rgba(59, 130, 246, 0.2)' 
                : 'transparent',
              border: activeTab === tab.id 
                ? '1px solid rgba(59, 130, 246, 0.5)' 
                : '1px solid transparent',
              borderRadius: '40px',
              color: activeTab === tab.id ? '#3b82f6' : '#cbd5e1',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: activeTab === tab.id ? '600' : '400',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.3s ease',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <img src={tab.icon} alt={tab.label} width={tab.id === 'cripto' ? 20 : 30} height={20} style={{ borderRadius: tab.id === 'cripto' ? '50%' : '3px', objectFit: 'cover' }} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CurrencyNavbar;
