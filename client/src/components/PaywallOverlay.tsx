/**
 * PaywallOverlay - Soft Paywall Wrapper
 * 
 * Regras:
 * - Se user.premium === true → NUNCA bloqueia
 * - Se user.usosAnalise < requiredCredits → Mostra overlay
 * - Conteúdo visível com blur (soft paywall)
 * - Não redireciona, apenas bloqueia interação
 * - Reutilizável em qualquer página
 */

import React, { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface PaywallOverlayProps {
  children: ReactNode;
  requiredCredits?: number; // default = 1
  creditType?: 'analise' | 'trainer' | 'players'; // qual campo verificar
}

export default function PaywallOverlay({
  children,
  requiredCredits = 1,
  creditType = 'analise',
}: PaywallOverlayProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Mapear tipo de crédito para campo do usuário
  const creditFields: Record<string, string> = {
    analise: 'usosAnalise',
    trainer: 'usosTrainer',
    players: 'usosPlayers',
  };

  const creditField = creditFields[creditType] || 'usosAnalise';
  const currentCredits = (user as any)?.[creditField] ?? 5;
  const isPremium = user?.premium || (user as any)?.statusPlano === 'premium';

  // Verificar se está bloqueado
  const isBlocked = !isPremium && currentCredits < requiredCredits;

  return (
    <div style={{ position: 'relative', minHeight: '100%' }}>
      {/* Conteúdo da página */}
      <div
        style={{
          transition: 'all 0.3s ease',
          filter: isBlocked ? 'blur(4px)' : 'none',
          pointerEvents: isBlocked ? 'none' : 'auto',
          userSelect: isBlocked ? 'none' : 'auto',
        }}
      >
        {children}
      </div>

      {/* Overlay quando bloqueado */}
      {isBlocked && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            style={{
              maxWidth: 440,
              width: '100%',
              margin: '0 20px',
              borderRadius: 20,
              // Borda vermelha consistente com badge do header quando créditos = 0
              border: '1px solid rgba(239, 68, 68, 0.4)',
              background: 'linear-gradient(135deg, #0b0f1a, #11162a)',
              padding: 32,
              boxShadow: '0 0 60px rgba(239, 68, 68, 0.1), 0 25px 50px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Header com ícone */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'rgba(239, 68, 68, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                }}
              >
                🔒
              </div>
              <h2
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  margin: 0,
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Limite diário atingido
              </h2>
            </div>

            {/* Texto - COPY EXATO */}
            <p
              style={{
                fontSize: 14,
                color: '#d1d5db',
                lineHeight: 1.7,
                marginBottom: 24,
              }}
            >
              Você já utilizou todas as análises disponíveis hoje no plano{' '}
              <strong style={{ color: '#e5e7eb' }}>FREE</strong>.
              <br />
              <br />
              Desbloqueie análises ilimitadas, feedback avançado e acesso completo ao{' '}
              <strong>PokerWizard</strong> com o plano{' '}
              <strong style={{ color: '#a78bfa' }}>PRO</strong>.
            </p>

            {/* Botão - vai direto pra /premium, sem modal */}
            <button
              onClick={() => navigate('/premium')}
              style={{
                width: '100%',
                padding: '14px 24px',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                color: '#fff',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 20px rgba(139, 92, 246, 0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(139, 92, 246, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(139, 92, 246, 0.3)';
              }}
            >
              ✨ Upgrade para PRO
            </button>

            {/* Texto auxiliar */}
            <p
              style={{
                marginTop: 16,
                textAlign: 'center',
                fontSize: 12,
                color: '#6b7280',
              }}
            >
              Continue jogando amanhã gratuitamente
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
