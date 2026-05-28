"use client";

import React, { useState } from 'react';

interface CurrencyNavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const CurrencyNavbar: React.FC<CurrencyNavbarProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'dolar', label: 'Dólar', icon: '🇺🇸' },
    { id: 'euro', label: 'Euro', icon: '🇪🇺' },
    { id: 'real', label: 'Real', icon: '🇧🇷' }
  ];

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      marginBottom: '40px',
      marginTop: '20px',
      position: 'relative',
      zIndex: 100,
      backdropFilter: 'blur(10px)',
      padding: '12px 0',
      borderBottom: '1px solid rgba(255,255,255,0.1)'
    }}>
      <div style={{
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
            <span style={{ fontSize: '1.2rem' }}>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CurrencyNavbar;
