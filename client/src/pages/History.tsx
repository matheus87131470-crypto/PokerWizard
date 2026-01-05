import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePaywall } from '../hooks/usePaywall';
import { useNavigate } from 'react-router-dom';
import { SessionChart } from '../components/SessionChart';

interface SessionResult {
  id: string;
  date: string;
  gains: number;
  losses: number;
  net: number;
  timestamp: number;
}

export default function History() {
  const { user, token } = useAuth();
  const { isPremium } = usePaywall(token);
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionResult[]>([]);

  // Verificação PRO
  const checkIsReallyPremium = (): boolean => {
    if (isPremium) return true;

    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        if (userData.premium || userData.isPremium || userData.plan === 'PRO' || 
            userData.plan === 'premium' || userData.statusPlano === 'premium' ||
            userData.subscription?.status === 'active') {
          return true;
        }
      }
    } catch (e) {
      console.error('Erro ao verificar localStorage:', e);
    }

    return false;
  };

  const isReallyPremium = checkIsReallyPremium();
  const FREE_SESSION_LIMIT = 20;

  // Carregar sessões
  useEffect(() => {
    try {
      const stored = localStorage.getItem('pokerwizard_results_sessions');
      if (stored) {
        const parsed = JSON.parse(stored);
        setSessions(parsed);
      }
    } catch (error) {
      console.error('Erro ao carregar sessões:', error);
    }
  }, []);

  // Verificar se deve borrar (FREE atingiu limite)
  const shouldBlurChart = !isReallyPremium && sessions.length > FREE_SESSION_LIMIT;

  // Calcular totais
  const totalGains = sessions.reduce((acc, s) => acc + s.gains, 0);
  const totalLosses = sessions.reduce((acc, s) => acc + s.losses, 0);
  const totalNet = sessions.reduce((acc, s) => acc + s.net, 0);

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0f24 0%, #1a1f3a 50%, #0a0f24 100%)',
      paddingTop: 80,
      paddingBottom: 60
    }}>
      {/* Header */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 5%', marginBottom: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ 
            fontSize: 36, 
            fontWeight: 800, 
            color: '#f8fafc',
            marginBottom: 12,
            textShadow: '0 0 30px rgba(168, 85, 247, 0.4)'
          }}>
            📈 Histórico de Evolução
          </h1>
          <p style={{ fontSize: 16, color: '#94a3b8', maxWidth: 600, margin: '0 auto' }}>
            Visualização completa da sua trajetória no poker. Saldo acumulado ao longo de todas as sessões.
          </p>
        </div>

        {/* Cards de resumo */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 20,
          marginBottom: 40
        }}>
          {/* Total de Sessões */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.4)',
            border: '1px solid rgba(71, 85, 105, 0.3)',
            borderRadius: 16,
            padding: '24px 28px',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
              Total de Sessões
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#3b82f6' }}>
              {sessions.length}
            </div>
          </div>

          {/* Total Ganhos */}
          <div style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 16,
            padding: '24px 28px',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
              Total Ganhos
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#10b981' }}>
              +{totalGains.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
          </div>

          {/* Total Perdas */}
          <div style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 16,
            padding: '24px 28px',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
              Total Perdas
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#ef4444' }}>
              -{totalLosses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
          </div>

          {/* Saldo Líquido */}
          <div style={{
            background: totalNet >= 0 ? 'rgba(59, 130, 246, 0.08)' : 'rgba(239, 68, 68, 0.08)',
            border: totalNet >= 0 ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 16,
            padding: '24px 28px',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
              Saldo Líquido
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: totalNet >= 0 ? '#3b82f6' : '#ef4444' }}>
              {totalNet >= 0 ? '+' : ''}{totalNet.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico */}
      {sessions.length > 0 ? (
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 5%', position: 'relative' }}>
          <SessionChart data={sessions} isBlurred={shouldBlurChart} />
          
          {/* Paywall */}
          {shouldBlurChart && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              zIndex: 10,
              background: 'rgba(10, 15, 36, 0.95)',
              padding: 40,
              borderRadius: 20,
              border: '1px solid rgba(168, 85, 247, 0.4)',
              boxShadow: '0 8px 40px rgba(0, 0, 0, 0.6)',
              maxWidth: 450
            }}>
              <div style={{ fontSize: 64, marginBottom: 20 }}>🔒</div>
              <h4 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16, color: '#f8fafc' }}>
                Limite FREE Atingido
              </h4>
              <p style={{ fontSize: 15, color: '#94a3b8', marginBottom: 24, lineHeight: 1.7 }}>
                Você atingiu o limite de <strong style={{ color: '#a855f7' }}>{FREE_SESSION_LIMIT} sessões</strong>.<br />
                Faça upgrade para <strong style={{ color: '#a855f7' }}>PRO</strong> e tenha histórico ilimitado com visão completa!
              </p>
              <button
                onClick={() => navigate('/premium')}
                style={{
                  padding: '16px 40px',
                  background: 'linear-gradient(145deg, rgba(168, 85, 247, 0.9), rgba(124, 58, 237, 0.9))',
                  border: 'none',
                  borderRadius: 12,
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 20px rgba(168, 85, 247, 0.5)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 30px rgba(168, 85, 247, 0.7)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(168, 85, 247, 0.5)';
                }}
              >
                ⭐ Upgrade para PRO - R$ 3,50
              </button>
            </div>
          )}
        </div>
      ) : (
        <div style={{ 
          maxWidth: 600, 
          margin: '80px auto', 
          textAlign: 'center',
          padding: '60px 40px',
          background: 'rgba(15, 23, 42, 0.3)',
          border: '1px solid rgba(71, 85, 105, 0.2)',
          borderRadius: 20
        }}>
          <div style={{ fontSize: 80, marginBottom: 24 }}>📊</div>
          <h3 style={{ fontSize: 24, fontWeight: 700, color: '#f8fafc', marginBottom: 12 }}>
            Nenhuma Sessão Registrada
          </h3>
          <p style={{ fontSize: 15, color: '#94a3b8', marginBottom: 32, lineHeight: 1.6 }}>
            Comece adicionando sessões no menu <strong style={{ color: '#a855f7' }}>Controle de Resultados</strong> para visualizar sua evolução histórica.
          </p>
          <button
            onClick={() => navigate('/results-tracker')}
            style={{
              padding: '14px 32px',
              background: 'linear-gradient(145deg, rgba(168, 85, 247, 0.9), rgba(124, 58, 237, 0.9))',
              border: 'none',
              borderRadius: 10,
              color: '#fff',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 20px rgba(168, 85, 247, 0.4)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 30px rgba(168, 85, 247, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(168, 85, 247, 0.4)';
            }}
          >
            Ir para Controle de Resultados
          </button>
        </div>
      )}
    </div>
  );
}
