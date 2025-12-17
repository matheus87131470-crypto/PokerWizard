/**
 * Contador de Créditos Global
 * 
 * Exibe os créditos restantes do usuário (7 gratuitos)
 * Premium exibe badge de ilimitado
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import './CreditCounter.css';

interface CreditCounterProps {
  freeCredits: number;      // -1 = ilimitado (premium)
  freeCreditsLimit: number;
  isPremium: boolean;
  compact?: boolean;        // Versão compacta para mobile
}

const CreditCounter: React.FC<CreditCounterProps> = ({
  freeCredits,
  freeCreditsLimit,
  isPremium,
  compact = false
}) => {
  const navigate = useNavigate();

  // Premium tem ilimitado
  if (isPremium) {
    return (
      <div className={`credit-counter premium ${compact ? 'compact' : ''}`}>
        <span className="credit-icon">👑</span>
        {!compact && <span className="credit-text">Premium</span>}
        <span className="credit-badge unlimited">∞</span>
      </div>
    );
  }

  // Calcular estado visual
  const isLow = freeCredits <= 2;
  const isEmpty = freeCredits <= 0;

  return (
    <div 
      className={`credit-counter free ${compact ? 'compact' : ''} ${isLow ? 'low' : ''} ${isEmpty ? 'empty' : ''}`}
      onClick={() => navigate('/premium')}
      title={`${freeCredits} de ${freeCreditsLimit} análises grátis. Clique para ver Premium.`}
    >
      <span className="credit-icon">{isEmpty ? '🔒' : '📊'}</span>
      {!compact && (
        <span className="credit-text">
          {isEmpty ? 'Créditos esgotados' : 'Análises grátis'}
        </span>
      )}
      <span className={`credit-badge ${isEmpty ? 'empty' : isLow ? 'low' : ''}`}>
        {freeCredits}/{freeCreditsLimit}
      </span>
    </div>
  );
};

export default CreditCounter;
