/**
 * Banner de Alerta de Créditos - Textos Oficiais
 * 
 * Exibe alertas quando créditos estão acabando
 * Tom: leve, sem agressividade, convite à evolução
 */

import React from 'react';

interface CreditWarningBannerProps {
  credits: number;
  isPremium: boolean;
  onUpgrade?: () => void;
}

const CreditWarningBanner: React.FC<CreditWarningBannerProps> = ({
  credits,
  isPremium,
  onUpgrade
}) => {
  // Premium não vê banner
  if (isPremium) return null;
  
  // Mais de 2 créditos - não mostrar
  if (credits > 2) return null;

  // Último crédito
  if (credits === 1) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.08))',
        border: '1px solid rgba(239, 68, 68, 0.35)',
        borderRadius: '12px',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        marginBottom: '16px',
        flexWrap: 'wrap'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px',
          color: '#fca5a5',
          fontSize: '14px',
          fontWeight: 500
        }}>
          <span style={{ fontSize: '18px' }}>⏳</span>
          <span><strong>Último crédito gratuito</strong> — Jogadores Premium não têm limites 🚀</span>
        </div>
        {onUpgrade && (
          <button
            onClick={onUpgrade}
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'transform 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            👑 Assinar
          </button>
        )}
      </div>
    );
  }

  // 2 créditos restantes
  if (credits === 2) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.12), rgba(251, 191, 36, 0.06))',
        border: '1px solid rgba(251, 191, 36, 0.3)',
        borderRadius: '12px',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        marginBottom: '16px',
        flexWrap: 'wrap'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px',
          color: '#fcd34d',
          fontSize: '14px',
          fontWeight: 500
        }}>
          <span style={{ fontSize: '18px' }}>⚠️</span>
          <span><strong>Restam apenas 2 créditos gratuitos</strong> — Aproveite bem ou libere acesso ilimitado com o Premium 👑</span>
        </div>
        {onUpgrade && (
          <button
            onClick={onUpgrade}
            style={{
              background: 'transparent',
              color: '#fbbf24',
              border: '1px solid rgba(251, 191, 36, 0.5)',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(251, 191, 36, 0.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            Ver Premium
          </button>
        )}
      </div>
    );
  }

  // 0 créditos - não mostrar banner (paywall vai aparecer)
  return null;
};

export default CreditWarningBanner;
