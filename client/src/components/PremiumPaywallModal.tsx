/**
 * Modal Premium - Paywall Oficial
 * 
 * Textos oficiais por seção (Trainer, Analyze, Ranges, Global)
 * Tom: progresso, não bloqueio. Convite à evolução.
 */

import React from 'react';

// Tipos de paywall
export type PaywallType = 'trainer' | 'analyze' | 'ranges' | 'global';

interface PremiumPaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  paywallType?: PaywallType;
  feature?: string; // mantido para compatibilidade
  remaining?: number;
  onUpgrade: () => void;
  onViewPlans: () => void;
}

// Textos oficiais por tipo
const PAYWALL_CONTENT: Record<PaywallType, {
  emoji: string;
  title: string;
  mainText: string;
  benefits: { icon: string; text: string }[];
  cta: string;
  secondaryText: string;
}> = {
  trainer: {
    emoji: '🔒',
    title: 'Seus treinos gratuitos acabaram',
    mainText: 'Você usou todos os seus 7 treinos gratuitos no Trainer.\nJogadores Premium treinam sem limites e evoluem mais rápido.',
    benefits: [
      { icon: '♾️', text: 'Treinos ilimitados' },
      { icon: '🧠', text: 'Feedback estratégico em tempo real' },
      { icon: '🚀', text: 'Evolua mais rápido que a maioria dos jogadores' },
    ],
    cta: '👑 Assinar Premium',
    secondaryText: 'Continue treinando sem interrupções.',
  },
  analyze: {
    emoji: '🔒',
    title: 'Análises gratuitas esgotadas',
    mainText: 'Você já usou suas 7 análises gratuitas.\nO Premium libera análises ilimitadas e mais profundas com IA.',
    benefits: [
      { icon: '🤖', text: 'IA avançada street por street' },
      { icon: '📂', text: 'Histórico de mãos analisadas' },
      { icon: '📈', text: 'Insights claros para corrigir leaks' },
    ],
    cta: '👑 Desbloquear Análises Ilimitadas',
    secondaryText: 'Analise quantas mãos quiser, quando quiser.',
  },
  ranges: {
    emoji: '🔒',
    title: 'Análise avançada de ranges',
    mainText: 'Você pode visualizar ranges gratuitamente.\nA explicação estratégica com IA é exclusiva do Premium.',
    benefits: [
      { icon: '🧠', text: 'Entenda o porquê de cada decisão' },
      { icon: '📊', text: 'Frequências GTO detalhadas' },
      { icon: '🎯', text: 'Aprenda mais rápido e com confiança' },
    ],
    cta: '👑 Ativar Premium',
    secondaryText: 'Estude como os melhores jogadores.',
  },
  global: {
    emoji: '🎯',
    title: 'Você dominou o modo gratuito',
    mainText: 'Seus 7 créditos gratuitos foram usados.\nAgora é hora de evoluir sem limites com o PokerWizard Premium.',
    benefits: [
      { icon: '♾️', text: 'Trainer ilimitado' },
      { icon: '🔍', text: 'Análises de mãos ilimitadas' },
      { icon: '🎯', text: 'Ranges GTO com IA completa' },
    ],
    cta: '👑 Assinar Premium',
    secondaryText: 'Treine, analise e estude sem restrições.',
  },
};

const PremiumPaywallModal: React.FC<PremiumPaywallModalProps> = ({
  isOpen,
  onClose,
  paywallType = 'global',
  remaining = 0,
  onUpgrade,
  onViewPlans
}) => {
  if (!isOpen) return null;

  const content = PAYWALL_CONTENT[paywallType];

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(6px)'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: '#1a1a2e',
          borderRadius: '20px',
          padding: '36px',
          maxWidth: '460px',
          width: '92%',
          boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.6)',
          border: '1px solid rgba(139, 92, 246, 0.35)',
          animation: 'fadeIn 0.3s ease-out',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            color: '#888',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '8px 12px',
            lineHeight: 1,
            borderRadius: '8px',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
            e.currentTarget.style.color = '#888';
          }}
        >
          ×
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ 
            fontSize: '52px', 
            marginBottom: '16px'
          }}>
            {content.emoji}
          </div>
          <h2 style={{ 
            color: '#fff', 
            fontSize: '22px', 
            fontWeight: 700,
            marginBottom: '14px',
            lineHeight: 1.3
          }}>
            {content.title}
          </h2>
          <p style={{ 
            color: '#a8a8b3', 
            fontSize: '15px',
            lineHeight: '1.6',
            whiteSpace: 'pre-line'
          }}>
            {content.mainText}
          </p>
        </div>

        {/* Benefits */}
        <div style={{
          backgroundColor: 'rgba(139, 92, 246, 0.08)',
          border: '1px solid rgba(139, 92, 246, 0.25)',
          borderRadius: '14px',
          padding: '20px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {content.benefits.map((benefit, index) => (
              <div 
                key={index}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  color: '#e2e8f0',
                  fontSize: '15px'
                }}
              >
                <span style={{ fontSize: '20px' }}>{benefit.icon}</span>
                <span>{benefit.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={onUpgrade}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '14px',
            padding: '18px 24px',
            fontSize: '17px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'transform 0.2s, box-shadow 0.2s',
            boxShadow: '0 4px 20px 0 rgba(139, 92, 246, 0.4)',
            marginBottom: '12px'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 28px 0 rgba(139, 92, 246, 0.5)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 20px 0 rgba(139, 92, 246, 0.4)';
          }}
        >
          {content.cta}
        </button>
        
        {/* Secondary Text */}
        <p style={{ 
          textAlign: 'center', 
          color: '#6b7280', 
          fontSize: '13px',
          marginTop: '16px'
        }}>
          {content.secondaryText}
        </p>

        {/* View Plans link */}
        <button
          onClick={onViewPlans}
          style={{
            width: '100%',
            background: 'transparent',
            color: '#8b5cf6',
            border: 'none',
            padding: '12px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            marginTop: '8px',
            transition: 'color 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.color = '#a78bfa';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.color = '#8b5cf6';
          }}
        >
          Ver todos os planos →
        </button>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default PremiumPaywallModal;
