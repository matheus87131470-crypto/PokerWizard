/**
 * UpgradeSuccess - Página de sucesso pós-pagamento PRO
 * 
 * UX:
 * - Revalida usuário via /api/auth/me
 * - Atualiza AuthContext para premium = true
 * - Header atualiza automaticamente
 * - Paywalls não aparecem mais
 * - Animação suave de entrada
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function UpgradeSuccess() {
  const navigate = useNavigate();
  const { refreshUser, user } = useAuth();
  const [loaded, setLoaded] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  // Revalidar usuário ao montar a página
  useEffect(() => {
    const revalidate = async () => {
      try {
        // Recarrega dados do usuário para garantir premium = true
        if (refreshUser) {
          await refreshUser();
        }
      } catch (err) {
        console.error('Erro ao revalidar usuário:', err);
      } finally {
        setLoaded(true);
        // Trigger animação após carregar
        setTimeout(() => setAnimateIn(true), 100);
      }
    };

    revalidate();
  }, [refreshUser]);

  // Verificar se é PRO
  const isPremium = user?.premium || (user as any)?.statusPlano === 'premium';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0b0f1a 0%, #11162a 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        maxWidth: 520,
        width: '100%',
        textAlign: 'center',
        opacity: animateIn ? 1 : 0,
        transform: animateIn ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.98)',
        transition: 'all 0.5s ease-out',
      }}>
        {/* Badge PRO */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 20px',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(236, 72, 153, 0.2))',
          border: '1px solid rgba(139, 92, 246, 0.4)',
          borderRadius: 50,
          marginBottom: 24,
        }}>
          <span style={{ fontSize: 16 }}>👑</span>
          <span style={{ 
            fontSize: 13, 
            fontWeight: 600, 
            color: '#a78bfa',
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}>
            PRO ATIVO
          </span>
        </div>

        {/* Ícone de sucesso animado */}
        <div style={{
          width: 100,
          height: 100,
          margin: '0 auto 24px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(34, 197, 94, 0.1))',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 48,
          border: '2px solid rgba(16, 185, 129, 0.3)',
          animation: animateIn ? 'pulse-success 2s infinite' : 'none',
        }}>
          🎉
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: 28,
          fontWeight: 700,
          marginBottom: 16,
          color: '#f8fafc',
          lineHeight: 1.3,
        }}>
          Plano PRO ativado com sucesso!
        </h1>

        {/* Subheadline */}
        <p style={{
          fontSize: 16,
          color: '#94a3b8',
          lineHeight: 1.6,
          marginBottom: 40,
          maxWidth: 400,
          margin: '0 auto 40px',
        }}>
          Seu acesso foi liberado. Agora você pode estudar sem limites e manter seu ritmo.
        </p>

        {/* Benefícios desbloqueados */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.5)',
          borderRadius: 16,
          padding: 24,
          marginBottom: 32,
          border: '1px solid rgba(100, 116, 139, 0.2)',
        }}>
          <p style={{ 
            fontSize: 13, 
            color: '#6b7280', 
            marginBottom: 16,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}>
            Desbloqueado para você
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 12,
          }}>
            {[
              { icon: '♾️', text: 'Análises ilimitadas' },
              { icon: '🎯', text: 'Trainer sem limites' },
              { icon: '📊', text: 'Análise de players' },
              { icon: '🚀', text: 'Sem interrupções' },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 14px',
                background: 'rgba(16, 185, 129, 0.1)',
                borderRadius: 8,
                border: '1px solid rgba(16, 185, 129, 0.2)',
              }}>
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <span style={{ fontSize: 13, color: '#d1d5db' }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>
          <button
            onClick={() => navigate('/trainer')}
            style={{
              width: '100%',
              padding: '16px 24px',
              fontSize: 15,
              fontWeight: 600,
              background: 'linear-gradient(135deg, #9333ea, #ec4899)',
              border: 'none',
              borderRadius: 12,
              color: '#fff',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            🎯 Ir para o Trainer
          </button>

          <button
            onClick={() => navigate('/analyze')}
            style={{
              width: '100%',
              padding: '16px 24px',
              fontSize: 15,
              fontWeight: 600,
              background: 'rgba(139, 92, 246, 0.15)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: 12,
              color: '#a78bfa',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(139, 92, 246, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(139, 92, 246, 0.15)';
            }}
          >
            🔍 Analisar uma mão agora
          </button>
        </div>

        {/* Mensagem de confirmação */}
        <p style={{
          marginTop: 32,
          fontSize: 12,
          color: '#6b7280',
        }}>
          {isPremium 
            ? '✅ Seu status PRO está ativo no sistema'
            : '⏳ Sincronizando status...'}
        </p>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes pulse-success {
          0%, 100% { 
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4);
          }
          50% { 
            box-shadow: 0 0 0 20px rgba(16, 185, 129, 0);
          }
        }
      `}</style>
    </div>
  );
}
