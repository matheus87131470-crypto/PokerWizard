/**
 * PaywallOverlay - Soft Paywall sem redirect
 * 
 * Regras:
 * - Se user.premium === true → NUNCA mostrar
 * - Se user.premium === false e user.usosAnalise <= 0 → Mostrar overlay
 * - Não redireciona, apenas bloqueia ações
 * - Conteúdo da página visível com blur/opacity
 * - Consistência visual com badge vermelho do header quando créditos = 0
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';

interface PaywallOverlayProps {
  feature: 'analyze' | 'trainer' | 'players';
  onClose?: () => void;
}

export default function PaywallOverlay({ feature, onClose }: PaywallOverlayProps) {
  const navigate = useNavigate();

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.92)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: 20,
    }}>
      <div style={{
        maxWidth: 480,
        width: '100%',
        background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.98), rgba(15, 23, 42, 0.98))',
        borderRadius: 20,
        // Borda vermelha consistente com badge do header quando créditos = 0
        border: '1px solid rgba(239, 68, 68, 0.4)',
        boxShadow: '0 0 60px rgba(239, 68, 68, 0.15), 0 20px 60px rgba(0, 0, 0, 0.5)',
        padding: 40,
        textAlign: 'center',
        position: 'relative',
      }}>
        {/* Ícone de bloqueio - tom vermelho */}
        <div style={{
          width: 80,
          height: 80,
          margin: '0 auto 24px',
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.1))',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 40,
          border: '2px solid rgba(239, 68, 68, 0.3)',
        }}>
          🔒
        </div>

        {/* Título - COPY EXATO */}
        <h2 style={{
          fontSize: 26,
          fontWeight: 800,
          marginBottom: 16,
          // Gradiente vermelho consistente com badge
          background: 'linear-gradient(135deg, #ef4444, #dc2626)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Limite diário atingido
        </h2>

        {/* Descrição - COPY EXATO */}
        <p style={{
          fontSize: 15,
          color: '#94a3b8',
          lineHeight: 1.7,
          marginBottom: 32,
        }}>
          Você já utilizou todas as análises disponíveis hoje no plano <strong style={{ color: '#e2e8f0' }}>FREE</strong>.
          <br /><br />
          Desbloqueie análises ilimitadas, feedback avançado e acesso completo ao PokerWizard com o plano <strong style={{ color: '#a78bfa' }}>PRO</strong>.
        </p>

        {/* Benefícios PRO */}
        <div style={{
          background: 'rgba(139, 92, 246, 0.1)',
          borderRadius: 12,
          padding: 20,
          marginBottom: 28,
          border: '1px solid rgba(139, 92, 246, 0.2)',
        }}>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 10,
            textAlign: 'left',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#c4b5fd' }}>
              <span style={{ color: '#22c55e' }}>✓</span> Análises ilimitadas
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#c4b5fd' }}>
              <span style={{ color: '#22c55e' }}>✓</span> Treinos ilimitados
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#c4b5fd' }}>
              <span style={{ color: '#22c55e' }}>✓</span> Análise de jogadores ilimitada
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#c4b5fd' }}>
              <span style={{ color: '#22c55e' }}>✓</span> Feedback avançado com GTO
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#c4b5fd' }}>
              <span style={{ color: '#22c55e' }}>✓</span> Estatísticas completas
            </div>
          </div>
        </div>

        {/* Botão - COPY EXATO */}
        <button
          onClick={() => navigate('/premium')}
          style={{
            width: '100%',
            padding: '16px 24px',
            background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
            border: 'none',
            borderRadius: 12,
            color: '#fff',
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 30px rgba(139, 92, 246, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(139, 92, 246, 0.4)';
          }}
        >
          ✨ Upgrade para PRO
        </button>

        {/* Botão voltar opcional */}
        {onClose && (
          <button
            onClick={onClose}
            style={{
              width: '100%',
              marginTop: 12,
              padding: '12px 24px',
              background: 'transparent',
              border: '1px solid rgba(100, 116, 139, 0.3)',
              borderRadius: 12,
              color: '#64748b',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(100, 116, 139, 0.5)';
              e.currentTarget.style.color = '#94a3b8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(100, 116, 139, 0.3)';
              e.currentTarget.style.color = '#64748b';
            }}
          >
            Voltar
          </button>
        )}

        {/* Preço */}
        <p style={{
          marginTop: 20,
          fontSize: 13,
          color: '#64748b',
        }}>
          A partir de <strong style={{ color: '#fbbf24' }}>R$ 9,90/mês</strong>
        </p>
      </div>
    </div>
  );
}
