/**
 * Modal Premium - Paywall
 * 
 * Exibe quando o usuário atinge o limite de usos gratuitos
 */

import React from 'react';

interface PremiumPaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
  remaining?: number;
  onUpgrade: () => void;
  onViewPlans: () => void;
}

const PremiumPaywallModal: React.FC<PremiumPaywallModalProps> = ({
  isOpen,
  onClose,
  feature = 'esta funcionalidade',
  remaining = 0,
  onUpgrade,
  onViewPlans
}) => {
  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(4px)'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: '#1a1a2e',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '480px',
          width: '90%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          animation: 'fadeIn 0.3s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ 
            fontSize: '48px', 
            marginBottom: '16px',
            animation: 'bounce 1s infinite'
          }}>
            🚀
          </div>
          <h2 style={{ 
            color: '#fff', 
            fontSize: '24px', 
            fontWeight: 700,
            marginBottom: '8px'
          }}>
            Você usou seus 5 testes grátis
          </h2>
          <p style={{ 
            color: '#a0a0a0', 
            fontSize: '14px',
            lineHeight: '1.5'
          }}>
            Para continuar usando o <strong style={{ color: '#8b5cf6' }}>{feature}</strong>, 
            assine o Plano Premium e tenha acesso ilimitado.
          </p>
        </div>

        {/* Features bloqueadas */}
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <p style={{ 
            color: '#ef4444', 
            fontWeight: 600, 
            marginBottom: '12px',
            fontSize: '14px'
          }}>
            🔒 Funcionalidades bloqueadas:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#888' }}>
              <span>🎯</span> Trainer GTO
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#888' }}>
              <span>📊</span> Análise de Mãos
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#888' }}>
              <span>👥</span> Análise de Jogadores
            </div>
          </div>
        </div>

        {/* Benefits Premium */}
        <div style={{
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <p style={{ 
            color: '#8b5cf6', 
            fontWeight: 600, 
            marginBottom: '12px',
            fontSize: '14px'
          }}>
            ✨ Com o Premium você terá:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399' }}>
              <span>✅</span> Treinos ilimitados
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399' }}>
              <span>✅</span> Análises de mãos ilimitadas
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399' }}>
              <span>✅</span> Análise de jogadores ilimitada
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399' }}>
              <span>✅</span> Suporte prioritário
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            onClick={onUpgrade}
            style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              padding: '16px 24px',
              fontSize: '16px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 4px 14px 0 rgba(139, 92, 246, 0.39)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px 0 rgba(139, 92, 246, 0.5)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(139, 92, 246, 0.39)';
            }}
          >
            👑 Assinar Premium
          </button>
          
          <button
            onClick={onViewPlans}
            style={{
              background: 'transparent',
              color: '#8b5cf6',
              border: '1px solid #8b5cf6',
              borderRadius: '12px',
              padding: '14px 24px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            Ver Planos
          </button>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            color: '#666',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '4px',
            lineHeight: 1
          }}
        >
          ×
        </button>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
};

export default PremiumPaywallModal;
