import React, { useState } from 'react';
import {
  Globe,
  TrendingUp,
  Wallet,
  Send,
  CreditCard,
  Coins,
  Building2,
  ArrowUp,
  ArrowDown,
  Share2,
  Check
} from 'lucide-react';

interface DolarCardProps {
  casa: string;
  nombre: string;
  compra: number;
  venta: number;
  source?: string;
  onSelect?: (casa: string) => void;
  isSelected?: boolean;
  variacion?: number; 
  isHighlighted?: boolean;
}

const DolarCard: React.FC<DolarCardProps> = ({
  casa,
  nombre,
  compra,
  venta,
  source,
  onSelect,
  isSelected,
  variacion,
  isHighlighted
}) => {
  const [copied, setCopied] = useState(false);

  const formattedBuy = compra ? compra.toFixed(2) : '-';
  const formattedSell = venta ? venta.toFixed(2) : '-';
  const spread = compra && venta ? (((venta - compra) / compra) * 100).toFixed(1) : '0.0';

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `💵 Dólar ${nombre} hoy en Argentina\n🟢 Compra: $${formattedBuy}\n🔴 Venta: $${formattedSell}\n📊 Brecha: ${spread}%\n\nDolarARG - dolararg.vercel.app`;
    if (navigator.share) {
      navigator.share({ title: `Dólar ${nombre}`, text });
    } else {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const variacionFormateada = variacion !== undefined ? (variacion >= 0 ? `+${variacion.toFixed(2)}%` : `${variacion.toFixed(2)}%`) : null;

  const getIcon = () => {
    switch (casa) {
      case 'oficial':
        return <Globe size={16} />;
      case 'blue':
        return <TrendingUp size={16} />;
      case 'bolsa':
        return <Wallet size={16} />;
      case 'contadoconliqui':
        return <Send size={16} />;
      case 'tarjeta':
        return <CreditCard size={16} />;
      case 'cripto':
        return <Coins size={16} />;
      case 'mayorista':
        return <Building2 size={16} />;
      default:
        return <Globe size={16} />;
    }
  };

  return (
    <div
      data-casa={casa}
      className={`dolar-card ${casa} ${isSelected ? 'active-chart' : ''}`}
      onClick={() => onSelect && onSelect(casa)}
      style={{ 
        cursor: onSelect ? 'pointer' : 'default',
        ...(isHighlighted && {
          transform: 'scale(1.05)',
          boxShadow: '0 0 40px rgba(59, 130, 246, 0.8), 0 0 80px rgba(59, 130, 246, 0.5)',
          border: '2px solid #3b82f6',
          transition: 'all 0.3s ease-out'
        })
      }}
    >
      <div className="card-header">
        <span className="card-title">Dólar {nombre}</span>
        <span className="card-badge-icon">{getIcon()}</span>
      </div>

      <div className="card-values">
        <div className="value-group">
          <span className="label">Compra</span>
          <span className="price">${formattedBuy}</span>
        </div>
        <div className="value-group">
          <span className="label">Venta</span>
          <span className="price" style={{ color: '#f43f5e' }}>${formattedSell}</span>
        </div>
      </div>

      <div className="card-footer">
        <div className="spread">
          Brecha: <span>{spread}%</span>
        </div>
        {variacionFormateada && variacion !== undefined && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.85rem',
            fontWeight: '600',
            color: variacion >= 0 ? '#10b981' : '#ef4444'
          }}>
            {variacion >= 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
            <span>{variacionFormateada}</span>
          </div>
        )}

        <button
          onClick={handleShare}
          title={copied ? '¡Copiado!' : 'Compartir'}
          style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            background: 'transparent', border: 'none',
            color: copied ? '#10b981' : '#64748b',
            cursor: 'pointer', fontSize: '0.8rem',
            padding: '2px 4px', borderRadius: '4px',
            transition: 'color 0.2s'
          }}
        >
          {copied ? <Check size={13} /> : <Share2 size={13} />}
          <span>{copied ? '¡Copiado!' : 'Compartir'}</span>
        </button>
      </div>
    </div>
  );
};

export default DolarCard;
