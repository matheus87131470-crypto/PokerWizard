import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePaywall } from '../hooks/usePaywall';
import { useNavigate } from 'react-router-dom';

interface SessionResult {
  id: string;
  date: string;
  gains: number;
  losses: number;
  net: number;
  timestamp: number;
}

export default function ResultsTracker() {
  const { user, token } = useAuth();
  const { isPremium } = usePaywall(token);
  const navigate = useNavigate();

  // Verificação PRO robusta (múltiplas fontes)
  const checkIsReallyPremium = (): boolean => {
    // 1. Hook usePaywall
    if (isPremium) return true;

    // 2. localStorage user object
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

    // 3. User do contexto (com casting para any para evitar erros de tipo)
    if (user) {
      const userAny = user as any;
      if (userAny.premium || userAny.isPremium || userAny.plan === 'PRO' || 
          userAny.plan === 'premium' || userAny.statusPlano === 'premium') {
        return true;
      }
    }

    return false;
  };

  const isReallyPremium = checkIsReallyPremium();

  // Estados
  const [gains, setGains] = useState('');
  const [losses, setLosses] = useState('');
  const [sessions, setSessions] = useState<SessionResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [animateRing, setAnimateRing] = useState(false);

  // Carregar sessões do localStorage
  useEffect(() => {
    const stored = localStorage.getItem('pokerwizard_results_sessions');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSessions(parsed);
      } catch (error) {
        console.error('Erro ao carregar histórico:', error);
      }
    }
  }, []);

  // Salvar sessões no localStorage
  const saveSessions = (newSessions: SessionResult[]) => {
    setSessions(newSessions);
    localStorage.setItem('pokerwizard_results_sessions', JSON.stringify(newSessions));
  };

  // Adicionar nova sessão
  const handleAddSession = () => {
    const gainsValue = parseFloat(gains) || 0;
    const lossesValue = parseFloat(losses) || 0;
    const netValue = gainsValue - lossesValue;

    if (gainsValue === 0 && lossesValue === 0) {
      return;
    }

    const newSession: SessionResult = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('pt-BR'),
      gains: gainsValue,
      losses: lossesValue,
      net: netValue,
      timestamp: Date.now()
    };

    const updatedSessions = [newSession, ...sessions];
    saveSessions(updatedSessions);
    
    // Reset inputs
    setGains('');
    setLosses('');

    // Trigger animation
    setAnimateRing(true);
    setTimeout(() => setAnimateRing(false), 600);
  };

  // Deletar sessão
  const handleDeleteSession = (id: string) => {
    const updatedSessions = sessions.filter(s => s.id !== id);
    saveSessions(updatedSessions);
  };

  // Calcular resultado do dia (FREE)
  const todayResults = sessions.filter(s => {
    const sessionDate = new Date(s.timestamp).toLocaleDateString('pt-BR');
    const today = new Date().toLocaleDateString('pt-BR');
    return sessionDate === today;
  });

  const todayNet = todayResults.reduce((acc, s) => acc + s.net, 0);
  const todayGains = todayResults.reduce((acc, s) => acc + s.gains, 0);
  const todayLosses = todayResults.reduce((acc, s) => acc + s.losses, 0);

  // Calcular resultado semanal (PRO)
  const weekResults = sessions.filter(s => {
    const sessionDate = new Date(s.timestamp);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return sessionDate >= weekAgo;
  });

  const weekNet = weekResults.reduce((acc, s) => acc + s.net, 0);

  // Calcular resultado mensal (PRO)
  const monthResults = sessions.filter(s => {
    const sessionDate = new Date(s.timestamp);
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return sessionDate >= monthAgo;
  });

  const monthNet = monthResults.reduce((acc, s) => acc + s.net, 0);

  // Calcular porcentagem para o progress ring
  const calculatePercentage = (net: number, gains: number, losses: number): number => {
    const total = gains + losses;
    if (total === 0) return 50; // Neutro
    const percentage = ((gains / total) * 100);
    return Math.max(0, Math.min(100, percentage));
  };

  const todayPercentage = calculatePercentage(todayNet, todayGains, todayLosses);

  // Cores baseadas no resultado - ROXO NEON IGUAL ANÁLISE DE JOGADORES
  const getColors = (net: number) => {
    if (net > 0) {
      return {
        primary: '#a855f7', // Roxo neon principal
        secondary: '#ec4899', // Rosa neon
        tertiary: '#f472b6', // Rosa claro
        glow: '0 0 30px rgba(168, 85, 247, 0.7), 0 0 60px rgba(236, 72, 153, 0.5), 0 0 90px rgba(244, 114, 182, 0.3)'
      };
    } else if (net < 0) {
      return {
        primary: '#ef4444', // Vermelho
        secondary: '#a855f7', // Roxo
        tertiary: '#ec4899', // Rosa
        glow: '0 0 30px rgba(239, 68, 68, 0.7), 0 0 60px rgba(168, 85, 247, 0.4)'
      };
    } else {
      return {
        primary: '#8b5cf6', // Roxo médio neutro
        secondary: '#a855f7', // Roxo neon
        tertiary: '#6d28d9', // Roxo escuro
        glow: '0 0 30px rgba(139, 92, 246, 0.6), 0 0 60px rgba(168, 85, 247, 0.4)'
      };
    }
  };

  const colors = getColors(todayNet);

  // Progress Ring SVG
  const ProgressRing = ({ percentage, size = 240, strokeWidth = 16 }: { percentage: number; size?: number; strokeWidth?: number }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(168, 85, 247, 0.1)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#gradient-${todayNet > 0 ? 'profit' : todayNet < 0 ? 'loss' : 'neutral'})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: animateRing ? 'stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
            filter: `drop-shadow(${colors.glow})`
          }}
        />
        <defs>
          <linearGradient id="gradient-profit" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="50%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#f472b6" />
          </linearGradient>
          <linearGradient id="gradient-loss" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
          <linearGradient id="gradient-neutral" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#6d28d9" />
          </linearGradient>
        </defs>
      </svg>
    );
  };

  return (
    <div style={{ padding: '24px 20px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12, color: '#f8fafc' }}>
          📊 Controle de Resultados
        </h1>
        <p style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.6 }}>
          Acompanhe seus ganhos e perdas com visualização inteligente
        </p>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 8, padding: '6px 16px', background: isReallyPremium ? 'rgba(16, 185, 129, 0.15)' : 'rgba(107, 114, 128, 0.15)', borderRadius: 20, border: `1px solid ${isReallyPremium ? 'rgba(16, 185, 129, 0.3)' : 'rgba(107, 114, 128, 0.3)'}` }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: isReallyPremium ? '#10b981' : '#6b7280' }}>
            {isReallyPremium ? '⭐ PRO' : 'FREE'}
          </span>
        </div>
      </div>

      {/* Main Content - ORDEM CORRETA: Input primeiro, depois gráfico */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 32 }}>
        {/* Input Card - PRIORIDADE NO TOPO */}
        <div className="card" style={{ padding: 24, maxWidth: 600, margin: '0 auto', width: '100%' }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: '#f8fafc' }}>
            💰 Nova Sessão
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Ganhos */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#10b981', marginBottom: 8 }}>
                ✅ Ganhos (R$)
              </label>
              <input
                type="number"
                value={gains}
                onChange={(e) => setGains(e.target.value)}
                placeholder="0.00"
                step="0.01"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(16, 185, 129, 0.05)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: 8,
                  color: '#10b981',
                  fontSize: 16,
                  fontWeight: 600,
                  outline: 'none',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => e.currentTarget.style.border = '1px solid rgba(16, 185, 129, 0.6)'}
                onBlur={(e) => e.currentTarget.style.border = '1px solid rgba(16, 185, 129, 0.3)'}
              />
            </div>

            {/* Perdas */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#ef4444', marginBottom: 8 }}>
                ❌ Perdas (R$)
              </label>
              <input
                type="number"
                value={losses}
                onChange={(e) => setLosses(e.target.value)}
                placeholder="0.00"
                step="0.01"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(239, 68, 68, 0.05)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 8,
                  color: '#ef4444',
                  fontSize: 16,
                  fontWeight: 600,
                  outline: 'none',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => e.currentTarget.style.border = '1px solid rgba(239, 68, 68, 0.6)'}
                onBlur={(e) => e.currentTarget.style.border = '1px solid rgba(239, 68, 68, 0.3)'}
              />
            </div>

            {/* Botão Adicionar */}
            <button
              onClick={handleAddSession}
              disabled={!gains && !losses}
              style={{
                padding: '14px 20px',
                background: (!gains && !losses) ? 'rgba(168, 85, 247, 0.2)' : 'linear-gradient(145deg, rgba(168, 85, 247, 0.9), rgba(124, 58, 237, 0.9))',
                border: 'none',
                borderRadius: 10,
                color: (!gains && !losses) ? '#6b7280' : '#fff',
                fontSize: 15,
                fontWeight: 700,
                cursor: (!gains && !losses) ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: (!gains && !losses) ? 'none' : '0 4px 20px rgba(168, 85, 247, 0.4)'
              }}
              onMouseEnter={(e) => {
                if (gains || losses) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 30px rgba(168, 85, 247, 0.6)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(168, 85, 247, 0.4)';
              }}
            >
              ➕ Adicionar Sessão
            </button>
          </div>
        </div>

        {/* Progress Ring Card - Resultado do Dia - ABAIXO DO INPUT */}
        <div className="card" style={{ padding: 32, textAlign: 'center', maxWidth: 600, margin: '0 auto', width: '100%' }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: '#f8fafc' }}>
            📅 Resultado Hoje
          </h3>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 20, position: 'relative' }}>
            <ProgressRing percentage={todayPercentage} />
            <div style={{ position: 'absolute', textAlign: 'center' }}>
              <div style={{ fontSize: 36, fontWeight: 900, color: colors.primary, textShadow: colors.glow, marginBottom: 4 }}>
                {todayNet >= 0 ? '+' : ''}{todayNet.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>
                Resultado Líquido
              </div>
            </div>
          </div>

          {/* Stats do Dia */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 24 }}>
            <div style={{ padding: 12, background: 'rgba(16, 185, 129, 0.1)', borderRadius: 8, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div style={{ fontSize: 11, color: '#10b981', fontWeight: 600, marginBottom: 4 }}>GANHOS</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#10b981' }}>
                R$ {todayGains.toFixed(2)}
              </div>
            </div>
            <div style={{ padding: 12, background: 'rgba(239, 68, 68, 0.1)', borderRadius: 8, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <div style={{ fontSize: 11, color: '#ef4444', fontWeight: 600, marginBottom: 4 }}>PERDAS</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#ef4444' }}>
                R$ {todayLosses.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PRO Features - Histórico Semanal/Mensal */}
      {isReallyPremium ? (
        <div className="card" style={{ padding: 24, marginBottom: 32 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: '#f8fafc' }}>
            📈 Histórico PRO
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {/* Semanal */}
            <div style={{ padding: 16, background: 'linear-gradient(145deg, rgba(168, 85, 247, 0.1), rgba(124, 58, 237, 0.05))', borderRadius: 10, border: '1px solid rgba(168, 85, 247, 0.3)' }}>
              <div style={{ fontSize: 12, color: '#a855f7', fontWeight: 600, marginBottom: 8 }}>📅 ÚLTIMOS 7 DIAS</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: weekNet >= 0 ? '#10b981' : '#ef4444' }}>
                {weekNet >= 0 ? '+' : ''}{weekNet.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </div>

            {/* Mensal */}
            <div style={{ padding: 16, background: 'linear-gradient(145deg, rgba(168, 85, 247, 0.1), rgba(124, 58, 237, 0.05))', borderRadius: 10, border: '1px solid rgba(168, 85, 247, 0.3)' }}>
              <div style={{ fontSize: 12, color: '#a855f7', fontWeight: 600, marginBottom: 8 }}>📊 ÚLTIMOS 30 DIAS</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: monthNet >= 0 ? '#10b981' : '#ef4444' }}>
                {monthNet >= 0 ? '+' : ''}{monthNet.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </div>

            {/* Total de Sessões */}
            <div style={{ padding: 16, background: 'linear-gradient(145deg, rgba(168, 85, 247, 0.1), rgba(124, 58, 237, 0.05))', borderRadius: 10, border: '1px solid rgba(168, 85, 247, 0.3)' }}>
              <div style={{ fontSize: 12, color: '#a855f7', fontWeight: 600, marginBottom: 8 }}>🎯 SESSÕES TOTAIS</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#a855f7' }}>
                {sessions.length}
              </div>
            </div>
          </div>
        </div>
      ) : !isReallyPremium ? (
        <div className="card" style={{ padding: 24, marginBottom: 32, background: 'linear-gradient(145deg, rgba(168, 85, 247, 0.1), rgba(124, 58, 237, 0.05))', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: '#f8fafc' }}>
              Desbloqueie Histórico Completo
            </h3>
            <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 20, lineHeight: 1.6 }}>
              Com o <strong style={{ color: '#a855f7' }}>PokerWizard PRO</strong>, você tem acesso a:<br/>
              📈 Histórico semanal e mensal<br/>
              📊 Gráficos de evolução<br/>
              🎯 Métricas avançadas
            </p>
            <button
              onClick={() => navigate('/premium')}
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
              ⭐ Upgrade para PRO - R$ 3,50
            </button>
          </div>
        </div>
      ) : null}

      {/* Histórico de Sessões */}
      {todayResults.length > 0 && (
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc' }}>
              📜 Histórico de Sessões
            </h3>
            <button
              onClick={() => setShowHistory(!showHistory)}
              style={{
                padding: '8px 16px',
                background: 'rgba(168, 85, 247, 0.2)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                borderRadius: 8,
                color: '#a855f7',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              {showHistory ? '🔼 Ocultar' : '🔽 Mostrar'}
            </button>
          </div>

          {showHistory && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 400, overflowY: 'auto' }}>
              {todayResults.map((session) => (
                <div
                  key={session.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 16,
                    background: 'rgba(168, 85, 247, 0.05)',
                    borderRadius: 8,
                    border: `1px solid ${session.net >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                    <div style={{ fontSize: 24 }}>
                      {session.net >= 0 ? '✅' : '❌'}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: session.net >= 0 ? '#10b981' : '#ef4444', marginBottom: 4 }}>
                        {session.net >= 0 ? '+' : ''}{session.net.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>
                        Ganhos: R$ {session.gains.toFixed(2)} • Perdas: R$ {session.losses.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteSession(session.id)}
                    style={{
                      padding: '6px 12px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: 6,
                      color: '#ef4444',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                    }}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
