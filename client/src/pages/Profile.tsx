import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Profile() {
  const auth = useAuth();
  const user = auth.user;

  if (!user) {
    return (
      <div style={{ 
        minHeight: '60vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontSize: 18,
        color: '#94a3b8'
      }}>
        🔒 Faça login para ver seu perfil.
      </div>
    );
  }

  const isPremium = user.premium || (user as any).statusPlano === 'premium';
  const usosRestantes = (user as any).usosRestantes === -1 || (user as any).usosRestantes === null 
    ? 'Ilimitado' 
    : (typeof (user as any).usosRestantes === 'number' ? (user as any).usosRestantes : user.credits);

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      padding: '60px 20px'
    }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        {/* HEADER COM AVATAR */}
        <div style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          borderRadius: 20,
          padding: 40,
          marginBottom: 32,
          border: isPremium ? '3px solid' : '1px solid #334155',
          borderImage: isPremium ? 'linear-gradient(135deg, #fbbf24, #f59e0b) 1' : 'none',
          boxShadow: isPremium 
            ? '0 20px 60px rgba(251, 191, 36, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            : '0 8px 32px rgba(0, 0, 0, 0.4)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* BACKGROUND EFFECT PREMIUM */}
          {isPremium && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at top right, rgba(251, 191, 36, 0.1) 0%, transparent 60%)',
              pointerEvents: 'none'
            }} />
          )}

          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
            {/* AVATAR */}
            <div style={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: isPremium 
                ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
                : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 48,
              fontWeight: 700,
              color: 'white',
              margin: '0 auto 20px',
              border: '4px solid',
              borderColor: isPremium ? '#fbbf24' : '#8b5cf6',
              boxShadow: isPremium 
                ? '0 8px 32px rgba(251, 191, 36, 0.5)'
                : '0 8px 32px rgba(139, 92, 246, 0.4)'
            }}>
              {user.name.charAt(0).toUpperCase()}
            </div>

            {/* NOME + BADGE */}
            <h1 style={{ 
              fontSize: 32, 
              fontWeight: 700, 
              marginBottom: 8,
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12
            }}>
              Olá, {user.name}
              {isPremium && (
                <span style={{
                  background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                  color: '#1e293b',
                  padding: '4px 12px',
                  borderRadius: 20,
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: '1px',
                  boxShadow: '0 4px 16px rgba(251, 191, 36, 0.4)',
                  animation: 'pulse 2s infinite'
                }}>
                  ⭐ PREMIUM
                </span>
              )}
            </h1>

            <p style={{ 
              fontSize: 16, 
              color: '#94a3b8',
              marginBottom: 0
            }}>
              {user.email}
            </p>
          </div>
        </div>

        {/* CARDS DE INFORMAÇÕES */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }}>
          {/* STATUS DO PLANO */}
          <div style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            borderRadius: 16,
            padding: 24,
            border: '1px solid #334155',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ 
              fontSize: 13, 
              color: '#a78bfa', 
              fontWeight: 600, 
              marginBottom: 8,
              letterSpacing: '0.5px'
            }}>
              📊 STATUS DO PLANO
            </div>
            <div style={{
              fontSize: 24,
              fontWeight: 700,
              color: isPremium ? '#fbbf24' : 'white',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              {isPremium ? '⭐ Premium' : '🆓 Free'}
            </div>
          </div>

          {/* USOS RESTANTES */}
          <div style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            borderRadius: 16,
            padding: 24,
            border: '1px solid #334155',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ 
              fontSize: 13, 
              color: '#a78bfa', 
              fontWeight: 600, 
              marginBottom: 8,
              letterSpacing: '0.5px'
            }}>
              💎 USOS RESTANTES
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 14px',
                borderRadius: 12,
                background: usosRestantes === 'Ilimitado' ? 'linear-gradient(135deg, #10b981, #34d399)' : 'linear-gradient(135deg, #0ea5e9, #60a5fa)',
                color: 'white',
                fontSize: 16,
                fontWeight: 800,
                letterSpacing: '0.3px',
                boxShadow: '0 6px 18px rgba(16, 185, 129, 0.35)'
              }}>
                💎 {usosRestantes} {usosRestantes !== 'Ilimitado' ? 'usos' : 'ilimitado'}
              </span>
              {usosRestantes !== 'Ilimitado' && (
                <span style={{ fontSize: 13, color: '#94a3b8' }}>Faça upgrade para ilimitado</span>
              )}
            </div>
          </div>
        </div>

        {/* BOTÕES DE AÇÃO */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
          {!isPremium && (
            <button 
              onClick={() => window.location.assign('/premium')}
              style={{
                flex: 1,
                padding: '16px 32px',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                color: '#1e293b',
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(251, 191, 36, 0.4)',
                transition: 'all 0.3s',
                letterSpacing: '0.5px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(251, 191, 36, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(251, 191, 36, 0.4)';
              }}
            >
              ⭐ Assinar Premium - R$ 5,90
            </button>
          )}
          
          <button 
            onClick={() => { 
              auth.logout(); 
              window.location.assign('/'); 
            }}
            style={{
              flex: isPremium ? 1 : 0,
              padding: '16px 32px',
              borderRadius: 12,
              border: '2px solid #334155',
              background: 'transparent',
              color: 'white',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#ef4444';
              e.currentTarget.style.color = '#ef4444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#334155';
              e.currentTarget.style.color = 'white';
            }}
          >
            🚪 Sair
          </button>
        </div>

        {/* APOIAR O PROJETO */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(192, 132, 252, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
          borderRadius: 16,
          padding: 24,
          border: '1px solid rgba(192, 132, 252, 0.3)',
          boxShadow: '0 4px 20px rgba(192, 132, 252, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{ 
            fontSize: 15, 
            color: '#e9d5ff', 
            marginBottom: 12,
            fontWeight: 500
          }}>
            💜 Gostou do PokerWizard? Apoie o projeto!
          </div>
          <a 
            href="https://mpago.la/2soAEN3" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 24px',
              borderRadius: 12,
              background: 'linear-gradient(135deg, #c084fc 0%, #a855f7 100%)',
              color: 'white',
              fontSize: 15,
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 6px 20px rgba(192, 132, 252, 0.4)',
              transition: 'all 0.3s',
            }}
          >
            💜 Doar R$ 0,50
          </a>
          <p style={{ 
            marginTop: 12, 
            fontSize: 12, 
            color: '#94a3b8' 
          }}>
            Sua contribuição ajuda a manter o projeto ativo!
          </p>
        </div>
      </div>

      {/* CSS ANIMATION */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.9;
            transform: scale(1.05);
          }
        }
      `}</style>
    </div>
  );
}
