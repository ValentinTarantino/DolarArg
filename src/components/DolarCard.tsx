import React from 'react';
import { 
  Globe, 
  TrendingUp, 
  Wallet, 
  Send, 
  CreditCard, 
  Coins, 
  Building2, 
  ArrowUpDown 
} from 'lucide-react';

interface DolarCardProps {
  casa: string;
  nombre: string;
  compra: number;
  venta: number;
  source?: string;
  onSelect?: (casa: string) => void;
  isSelected?: boolean;
}

const DolarCard: React.FC<DolarCardProps> = ({
  casa,
  nombre,
  compra,
  venta,
  source,
  onSelect,
  isSelected
}) => {
  const formattedBuy = compra ? compra.toFixed(2) : '-';
  const formattedSell = venta ? venta.toFixed(2) : '-';

  // Calcular la brecha (Spread) porcentual
  const spread = compra && venta ? (((venta - compra) / compra) * 100).toFixed(1) : '0.0';

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
      className={`dolar-card ${casa} ${isSelected ? 'active-chart' : ''}`}
      onClick={() => onSelect && onSelect(casa)}
      style={{ cursor: onSelect ? 'pointer' : 'default' }}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <ArrowUpDown size={14} />
          <span>Ver gráfico</span>
        </div>
      </div>
    </div>
  );
};

export default DolarCard;
