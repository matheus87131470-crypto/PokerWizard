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

  // Estatísticas adicionais
  const sessionsWithProfit = sessions.filter(s => s.net > 0).length;
  const sessionsWithLoss = sessions.filter(s => s.net < 0).length;
  const winRate = sessions.length > 0 ? ((sessionsWithProfit / sessions.length) * 100).toFixed(1) : '0';
  const avgProfit = sessions.length > 0 ? totalNet / sessions.length : 0;
  const bestSession = sessions.length > 0 ? Math.max(...sessions.map(s => s.net)) : 0;
  const worstSession = sessions.length > 0 ? Math.min(...sessions.map(s => s.net)) : 0;

  // Dados para gráfico de pizza (Ganhos vs Perdas)
  const totalGainsPercent = totalGains + totalLosses > 0 ? (totalGains / (totalGains + totalLosses)) * 100 : 50;
  const totalLossesPercent = 100 - totalGainsPercent;

  // Dados para gráfico de barras (últimos 6 meses)
  const getLast6Months = () => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        month: date.getMonth(),
        year: date.getFullYear()
      });
    }
    return months;
  };

  const monthlyData = getLast6Months().map(m => {
    const sessionsInMonth = sessions.filter(s => {
      const sessionDate = new Date(s.timestamp);
      return sessionDate.getMonth() === m.month && sessionDate.getFullYear() === m.year;
    });
    const gains = sessionsInMonth.reduce((acc, s) => acc + s.gains, 0);
    const losses = sessionsInMonth.reduce((acc, s) => acc + s.losses, 0);
    const net = sessionsInMonth.reduce((acc, s) => acc + s.net, 0);
    return { ...m, gains, losses, net, count: sessionsInMonth.length };
  });

  const maxMonthlyValue = Math.max(...monthlyData.map(d => Math.max(d.gains, d.losses)), 1000);

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

        {/* Bloco de Métricas de Torneios (ROI) - NOVO */}
        <div style={{
          maxWidth: 1400,
          margin: '0 auto 40px',
          padding: '0 5%'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(168, 85, 247, 0.12) 100%)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            borderRadius: 16,
            padding: '24px 28px',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: 20
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 24 }}>🎯</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                  Métricas de Torneios (MTT/SNG)
                </h3>
              </div>
              <div style={{
                fontSize: 11,
                color: '#a855f7',
                fontWeight: 600,
                background: 'rgba(168, 85, 247, 0.15)',
                padding: '6px 12px',
                borderRadius: 8,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                All-time
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 20
            }}>
              {/* ROI */}
              <div>
                <div style={{ 
                  fontSize: 11, 
                  color: '#94a3b8', 
                  marginBottom: 8,
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  fontWeight: 600
                }}>
                  ROI (Return on Investment)
                </div>
                <div style={{ 
                  fontSize: 28, 
                  fontWeight: 800, 
                  color: '#a855f7',
                  textShadow: '0 0 20px rgba(168, 85, 247, 0.5)'
                }}>
                  Em breve
                </div>
                <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>
                  (Lucro ÷ Buy-ins) × 100
                </div>
              </div>

              {/* Buy-ins Totais */}
              <div>
                <div style={{ 
                  fontSize: 11, 
                  color: '#94a3b8', 
                  marginBottom: 8,
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  fontWeight: 600
                }}>
                  Buy-ins Totais
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#c084fc' }}>
                  Em breve
                </div>
                <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>
                  Soma de todas as entradas
                </div>
              </div>

              {/* Nº de Torneios */}
              <div>
                <div style={{ 
                  fontSize: 11, 
                  color: '#94a3b8', 
                  marginBottom: 8,
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  fontWeight: 600
                }}>
                  Nº de Torneios
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#e879f9' }}>
                  Em breve
                </div>
                <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>
                  Apenas MTT e SNG
                </div>
              </div>
            </div>

            {/* Nota informativa */}
            <div style={{
              marginTop: 20,
              padding: '12px 16px',
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12
            }}>
              <div style={{ fontSize: 16, marginTop: 2 }}>ℹ️</div>
              <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>
                <strong style={{ color: '#f8fafc' }}>Funcionalidade em desenvolvimento:</strong> Para ativar o ROI, você precisará registrar suas sessões com informações de tipo de jogo (Torneio/Cash) e valor de buy-in. Cash games não entram no cálculo de ROI.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico */}
      {sessions.length > 0 ? (
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 5%' }}>
          
          {/* Grid de Gráficos Principais */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: 24,
            marginBottom: 40
          }}>
            
            {/* Gráfico 1: Evolução do Saldo */}
            <div style={{ 
              background: 'rgba(15, 23, 42, 0.4)',
              border: '1px solid rgba(71, 85, 105, 0.3)',
              borderRadius: 16,
              padding: 24,
              backdropFilter: 'blur(10px)',
              gridColumn: '1 / -1',
              position: 'relative'
            }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc', marginBottom: 20 }}>
                📈 Evolução do Saldo Acumulado
              </h3>
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
                    Faça upgrade para <strong style={{ color: '#a855f7' }}>PRO</strong> e tenha histórico ilimitado!
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

            {/* Gráfico 2: Distribuição Ganhos vs Perdas (Pizza) */}
            <div style={{ 
              background: 'rgba(15, 23, 42, 0.4)',
              border: '1px solid rgba(71, 85, 105, 0.3)',
              borderRadius: 16,
              padding: 24,
              backdropFilter: 'blur(10px)'
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', marginBottom: 20 }}>
                💰 Distribuição de Valores
              </h3>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40, marginTop: 30 }}>
                {/* Donut Chart */}
                <svg width="180" height="180" viewBox="0 0 180 180">
                  <defs>
                    <linearGradient id="gainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                    <linearGradient id="lossGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="100%" stopColor="#dc2626" />
                    </linearGradient>
                  </defs>
                  
                  {/* Background circle */}
                  <circle cx="90" cy="90" r="70" fill="none" stroke="rgba(71, 85, 105, 0.2)" strokeWidth="30" />
                  
                  {/* Gains arc */}
                  <circle
                    cx="90"
                    cy="90"
                    r="70"
                    fill="none"
                    stroke="url(#gainGradient)"
                    strokeWidth="30"
                    strokeDasharray={`${(totalGainsPercent / 100) * 440} 440`}
                    strokeDashoffset="0"
                    transform="rotate(-90 90 90)"
                    strokeLinecap="round"
                  />
                  
                  {/* Losses arc */}
                  <circle
                    cx="90"
                    cy="90"
                    r="70"
                    fill="none"
                    stroke="url(#lossGradient)"
                    strokeWidth="30"
                    strokeDasharray={`${(totalLossesPercent / 100) * 440} 440`}
                    strokeDashoffset={`-${(totalGainsPercent / 100) * 440}`}
                    transform="rotate(-90 90 90)"
                    strokeLinecap="round"
                  />
                  
                  {/* Center text */}
                  <text x="90" y="85" textAnchor="middle" fill="#f8fafc" fontSize="24" fontWeight="700">
                    {winRate}%
                  </text>
                  <text x="90" y="105" textAnchor="middle" fill="#94a3b8" fontSize="12" fontWeight="600">
                    Win Rate
                  </text>
                </svg>

                {/* Legend */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <div style={{ width: 12, height: 12, borderRadius: 3, background: 'linear-gradient(135deg, #10b981, #059669)' }} />
                      <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>Ganhos</span>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#10b981', marginLeft: 20 }}>
                      {totalGainsPercent.toFixed(1)}%
                    </div>
                    <div style={{ fontSize: 13, color: '#64748b', marginLeft: 20 }}>
                      {totalGains.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                  </div>
                  
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <div style={{ width: 12, height: 12, borderRadius: 3, background: 'linear-gradient(135deg, #ef4444, #dc2626)' }} />
                      <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>Perdas</span>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#ef4444', marginLeft: 20 }}>
                      {totalLossesPercent.toFixed(1)}%
                    </div>
                    <div style={{ fontSize: 13, color: '#64748b', marginLeft: 20 }}>
                      {totalLosses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Gráfico 3: Desempenho Mensal (Barras) */}
            <div style={{ 
              background: 'rgba(15, 23, 42, 0.4)',
              border: '1px solid rgba(71, 85, 105, 0.3)',
              borderRadius: 16,
              padding: 24,
              backdropFilter: 'blur(10px)'
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', marginBottom: 20 }}>
                📊 Desempenho Últimos 6 Meses
              </h3>
              
              <div style={{ marginTop: 30 }}>
                {monthlyData.map((month, idx) => {
                  const gainWidth = month.gains > 0 ? (month.gains / maxMonthlyValue) * 100 : 0;
                  const lossWidth = month.losses > 0 ? (month.losses / maxMonthlyValue) * 100 : 0;
                  
                  return (
                    <div key={idx} style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, minWidth: 50 }}>
                          {month.label}
                        </span>
                        <span style={{ fontSize: 11, color: '#64748b' }}>
                          {month.count} {month.count === 1 ? 'sessão' : 'sessões'}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', gap: 4, height: 24 }}>
                        {/* Barra de Ganhos */}
                        <div style={{ 
                          flex: 1,
                          background: 'rgba(71, 85, 105, 0.2)',
                          borderRadius: 6,
                          overflow: 'hidden',
                          position: 'relative'
                        }}>
                          <div style={{
                            width: `${gainWidth}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.8), rgba(5, 150, 105, 0.9))',
                            transition: 'width 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            paddingRight: 8
                          }}>
                            {month.gains > 0 && (
                              <span style={{ fontSize: 10, color: '#fff', fontWeight: 700 }}>
                                +{(month.gains / 1000).toFixed(1)}k
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Barra de Perdas */}
                        <div style={{ 
                          flex: 1,
                          background: 'rgba(71, 85, 105, 0.2)',
                          borderRadius: 6,
                          overflow: 'hidden',
                          position: 'relative'
                        }}>
                          <div style={{
                            width: `${lossWidth}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.8), rgba(220, 38, 38, 0.9))',
                            transition: 'width 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            paddingRight: 8
                          }}>
                            {month.losses > 0 && (
                              <span style={{ fontSize: 10, color: '#fff', fontWeight: 700 }}>
                                -{(month.losses / 1000).toFixed(1)}k
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Legend */}
              <div style={{ display: 'flex', gap: 20, marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(71, 85, 105, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: 'linear-gradient(90deg, #10b981, #059669)' }} />
                  <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Ganhos</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: 'linear-gradient(90deg, #ef4444, #dc2626)' }} />
                  <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Perdas</span>
                </div>
              </div>
            </div>

          </div>

          {/* Estatísticas Detalhadas */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.4)',
            border: '1px solid rgba(71, 85, 105, 0.3)',
            borderRadius: 16,
            padding: 24,
            backdropFilter: 'blur(10px)',
            marginBottom: 40
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc', marginBottom: 24 }}>
              📈 Estatísticas Detalhadas
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
              
              <div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                  Média por Sessão
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: avgProfit >= 0 ? '#3b82f6' : '#ef4444' }}>
                  {avgProfit >= 0 ? '+' : ''}{avgProfit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                  Melhor Sessão
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#10b981' }}>
                  +{bestSession.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                  Pior Sessão
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#ef4444' }}>
                  {worstSession.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                  Sessões com Lucro
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#10b981' }}>
                  {sessionsWithProfit} <span style={{ fontSize: 16, color: '#64748b' }}>/ {sessions.length}</span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                  Sessões com Prejuízo
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#ef4444' }}>
                  {sessionsWithLoss} <span style={{ fontSize: 16, color: '#64748b' }}>/ {sessions.length}</span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                  Taxa de Vitória
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#3b82f6' }}>
                  {winRate}%
                </div>
              </div>

            </div>
          </div>

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
