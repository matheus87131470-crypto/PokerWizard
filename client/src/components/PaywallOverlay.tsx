/**
 * PaywallOverlay - Soft Paywall que CONVERTE
 * 
 * Princípios:
 * 1. Nunca punir curiosidade - explicar, não castigar
 * 2. Mostrar perda, não limitação - "faltava pouco"
 * 3. PRO = aceleração, não privilégio
 * 
 * Copy psicológico + visual de progresso = conversão
 */

import React, { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface PaywallOverlayProps {
  children: ReactNode;
  requiredCredits?: number;
  creditType?: 'analise' | 'trainer' | 'players';
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

  const maxCredits: Record<string, number> = {
    analise: 5,
    trainer: 5,
    players: 3,
  };

  const featureNames: Record<string, string> = {
    analise: 'análises',
    trainer: 'treinos',
    players: 'buscas',
  };

  const creditField = creditFields[creditType] || 'usosAnalise';
  const currentCredits = (user as any)?.[creditField] ?? 5;
  const maxCredit = maxCredits[creditType] || 5;
  const featureName = featureNames[creditType] || 'análises';
  const isPremium = user?.premium || (user as any)?.statusPlano === 'premium';

  // Calcular progresso
  const usedCredits = maxCredit - currentCredits;
  const progressPercent = (usedCredits / maxCredit) * 100;

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
              maxWidth: 460,
              width: '100%',
              margin: '0 20px',
              borderRadius: 20,
              border: '1px solid rgba(139, 92, 246, 0.3)',
              background: 'linear-gradient(135deg, #0b0f1a, #11162a)',
              padding: '36px 32px',
              boxShadow: '0 0 60px rgba(139, 92, 246, 0.15), 0 25px 50px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Emoji motivacional */}
            <div style={{ textAlign: 'center', fontSize: 48, marginBottom: 16 }}>
              🔥
            </div>

            {/* Título - Copy psicológico: progresso interrompido */}
            <h2
              style={{
                fontSize: 24,
                fontWeight: 700,
                margin: '0 0 8px',
                textAlign: 'center',
                color: '#f8fafc',
              }}
            >
              Você estava indo bem demais pra parar agora.
            </h2>

            {/* Subtexto - Mostrar perda, não limitação */}
            <p
              style={{
                fontSize: 14,
                color: '#94a3b8',
                textAlign: 'center',
                marginBottom: 24,
                lineHeight: 1.5,
              }}
            >
              Faltava só mais uma {creditType === 'analise' ? 'análise' : creditType === 'trainer' ? 'sessão de treino' : 'busca'} para completar sua sessão de estudo hoje.
            </p>

            {/* Barra de progresso visual */}
            <div style={{
              background: 'rgba(30, 41, 59, 0.8)',
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 10,
                fontSize: 13,
              }}>
                <span style={{ color: '#94a3b8' }}>Seu progresso hoje</span>
                <span style={{ color: '#a78bfa', fontWeight: 600 }}>
                  {usedCredits} / {maxCredit} {featureName}
                </span>
              </div>
              
              {/* Barra visual */}
              <div style={{
                height: 8,
                background: 'rgba(100, 116, 139, 0.3)',
                borderRadius: 4,
                overflow: 'hidden',
                position: 'relative',
              }}>
                {/* Progresso feito */}
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${progressPercent}%`,
                  background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)',
                  borderRadius: 4,
                  transition: 'width 0.3s ease',
                }} />
                
                {/* Parte bloqueada (piscando) */}
                <div style={{
                  position: 'absolute',
                  left: `${progressPercent}%`,
                  top: 0,
                  bottom: 0,
                  width: `${100 / maxCredit}%`,
                  background: 'rgba(239, 68, 68, 0.6)',
                  borderRadius: 4,
                  animation: 'pulse 2s infinite',
                }} />
              </div>

              {/* Texto de status */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 10,
                fontSize: 12,
              }}>
                <span style={{ color: '#22c55e' }}>✓ {usedCredits} {featureName} feitas</span>
                <span style={{ color: '#ef4444' }}>🔒 1 bloqueada</span>
              </div>
            </div>

            {/* Micro prova de valor */}
            <div style={{
              background: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              borderRadius: 10,
              padding: '12px 16px',
              marginBottom: 24,
              textAlign: 'center',
            }}>
              <p style={{
                margin: 0,
                fontSize: 13,
                color: '#c4b5fd',
              }}>
                📊 <strong>Jogadores PRO</strong> analisam <strong style={{ color: '#22c55e' }}>5x mais mãos</strong> por semana
              </p>
            </div>

            {/* CTA - Continuidade, não compra */}
            <button
              onClick={() => navigate('/premium')}
              style={{
                width: '100%',
                padding: '16px 24px',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
                color: '#fff',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 20px rgba(139, 92, 246, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
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
              ✨ Desbloquear meu ritmo de estudo
            </button>

            {/* Texto auxiliar - Sem pressão */}
            <p
              style={{
                marginTop: 16,
                textAlign: 'center',
                fontSize: 12,
                color: '#64748b',
              }}
            >
              Ou volte amanhã com +{maxCredit} {featureName} gratuitas
            </p>
          </div>
        </div>
      )}

      {/* CSS para animação */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
