/**
 * PaywallOverlay - Soft Paywall que CONVERTE
 * 
 * Estrutura pensada para converter:
 * 1. Headline emocional (interrompe sem punir)
 * 2. Progresso perdido (gatilho psicológico)
 * 3. Valor claro do PRO
 * 4. CTA de continuidade
 * 5. Saída sem pressão
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

  const creditField = creditFields[creditType] || 'usosAnalise';
  const currentCredits = (user as any)?.[creditField] ?? 5;
  const maxCredit = maxCredits[creditType] || 5;
  const isPremium = user?.premium || (user as any)?.statusPlano === 'premium';

  // Calcular progresso
  const usedCredits = maxCredit - currentCredits;

  // Texto dinâmico baseado no tipo
  const getUsedText = () => {
    if (creditType === 'analise') {
      return usedCredits === 1 ? '1 mão' : `${usedCredits} mãos`;
    } else if (creditType === 'trainer') {
      return usedCredits === 1 ? '1 treino' : `${usedCredits} treinos`;
    } else {
      return usedCredits === 1 ? '1 busca' : `${usedCredits} buscas`;
    }
  };

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
              border: '1px solid rgba(139, 92, 246, 0.3)',
              background: 'linear-gradient(135deg, #0b0f1a, #11162a)',
              padding: '32px 28px',
              boxShadow: '0 0 60px rgba(139, 92, 246, 0.15), 0 25px 50px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* 🔒 Headline direto */}
            <h2
              style={{
                fontSize: 21,
                fontWeight: 600,
                margin: '0 0 16px',
                textAlign: 'center',
                color: '#f8fafc',
                lineHeight: 1.3,
              }}
            >
              {creditType === 'trainer' ? 'Continue treinando sem interrupções' : 'Você estava indo bem demais pra parar agora.'}
            </h2>

            {/* 📊 Progresso perdido */}
            <p
              style={{
                fontSize: 14,
                color: '#d1d5db',
                textAlign: 'center',
                marginBottom: 20,
                lineHeight: 1.6,
              }}
            >
              {creditType === 'trainer' ? (
                <>
                  Você já usou seus treinos gratuitos hoje.
                </>
              ) : (
                <>
                  Hoje você já analisou <strong style={{ color: '#fff' }}>{getUsedText()}</strong>.
                  <br />
                  Faltava <strong style={{ color: '#fff' }}>apenas 1</strong> para concluir sua sessão de estudo.
                </>
              )}
            </p>

            {/* 💡 Benefícios - SECO E DIRETO */}
            {creditType === 'trainer' ? (
              <div style={{
                marginBottom: 24,
                padding: '16px',
                background: 'rgba(139, 92, 246, 0.1)',
                borderRadius: 8,
                border: '1px solid rgba(139, 92, 246, 0.2)'
              }}>
                <ul style={{ margin: 0, padding: '0 0 0 20px', color: '#d1d5db', fontSize: 13, lineHeight: 1.8 }}>
                  <li>Treinos ilimitados</li>
                  <li>Feedback avançado</li>
                  <li>Evolução consistente</li>
                </ul>
              </div>
            ) : (
              <>
                <p
                  style={{
                    fontSize: 14,
                    color: '#9ca3af',
                    textAlign: 'center',
                    marginBottom: 8,
                    lineHeight: 1.6,
                  }}
                >
                  Com o plano <strong style={{ color: '#a78bfa' }}>PRO</strong>, você mantém seu ritmo de estudo, analisa quantas mãos quiser e acelera sua evolução no poker.
                </p>
                <p
                  style={{
                    fontSize: 12,
                    color: '#6b7280',
                    textAlign: 'center',
                    marginBottom: 24,
                  }}
                >
                  Jogadores PRO analisam até 5× mais mãos por semana.
                </p>
              </>
            )}

            {/* 🚀 CTA adaptado */}
            <button
              onClick={() => navigate('/premium')}
              style={{
                width: '100%',
                padding: '14px 24px',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #9333ea, #ec4899)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {creditType === 'trainer' ? 'Desbloquear Treinos PRO' : 'Desbloquear meu ritmo de estudo'}
            </button>

            {/* Saída sem pressão */}
            <p
              style={{
                marginTop: 12,
                textAlign: 'center',
                fontSize: 12,
                color: '#6b7280',
              }}
            >
              Ou continue gratuitamente amanhã
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
