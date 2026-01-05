/**
 * Análise de Jogadores - Preview (EM BREVE)
 * 
 * Página de demonstração mostrando como será a análise de jogadores
 * com integração SharkScope em breve
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Dados fictícios para demonstração
const MOCK_PLAYER_DATA = {
  nickname: 'FishHunter_BR',
  totalGames: 2847,
  avgProfit: 12.4,
  roi: 18.7,
  itm: 22.3,
  avgBuyIn: 11.25,
  totalProfit: 35280,
  ability: 78,
  vpip: 24,
  pfr: 18,
  aggression: 2.8,
  winRate: 8.2,
  recentForm: 'hot',
  playerType: 'TAG',
  leaks: [
    { area: 'Defesa de BB', severity: 'medium', description: 'Folda muito contra steals do BTN' },
    { area: '3-Bet Range', severity: 'low', description: 'Range de 3bet ligeiramente tight demais' },
    { area: 'River Play', severity: 'high', description: 'Tendência a fazer hero calls ruins no river' },
  ],
  strengths: [
    'Excelente seleção de mesas',
    'Agressividade bem calibrada',
    'Bom controle de tilt',
  ],
  // Dados do gráfico de ganhos (fictício)
  profitHistory: [
    { month: 'Jul', profit: 2500 },
    { month: 'Ago', profit: 1800 },
    { month: 'Set', profit: 4200 },
    { month: 'Out', profit: 3100 },
    { month: 'Nov', profit: 6800 },
    { month: 'Dez', profit: 5400 },
    { month: 'Jan', profit: 8900 },
    { month: 'Fev', profit: 7200 },
    { month: 'Mar', profit: 12500 },
    { month: 'Abr', profit: 15800 },
    { month: 'Mai', profit: 18200 },
    { month: 'Jun', profit: 21500 },
  ],
};

export default function PlayerAnalysis() {
  const navigate = useNavigate();
  const [searchNickname, setSearchNickname] = useState('');
  const [showDemo, setShowDemo] = useState(false);

  const handleSearch = () => {
    if (searchNickname.trim()) {
      setShowDemo(true);
    }
  };

  return (
    <div className="player-analysis-page" style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Banner EM BREVE */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(14, 165, 233, 0.1))',
        border: '1px solid rgba(6, 182, 212, 0.4)',
        borderRadius: 16,
        padding: '24px 32px',
        marginBottom: 24,
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 12,
          right: 12,
          background: 'linear-gradient(135deg, #06b6d4, #0ea5e9)',
          color: 'white',
          padding: '6px 16px',
          borderRadius: 20,
          fontSize: 12,
          fontWeight: 700,
          boxShadow: '0 4px 15px rgba(6, 182, 212, 0.4)'
        }}>
          🚀 EM BREVE
        </div>
        
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12, color: '#fff' }}>
          Análise de Jogadores
        </h1>
        <p style={{ fontSize: 16, color: 'var(--text-secondary)', maxWidth: 600, margin: '0 auto 16px', lineHeight: 1.6 }}>
          Em breve: integração com <strong style={{ color: '#06b6d4' }}>SharkScope</strong> para análise completa de oponentes.
          Descubra leaks, tendências e padrões de jogo dos seus adversários.
        </p>
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: 8, 
          background: 'rgba(251, 191, 36, 0.15)', 
          border: '1px solid rgba(251, 191, 36, 0.3)',
          padding: '8px 16px',
          borderRadius: 8,
          fontSize: 13,
          color: '#fbbf24'
        }}>
          ⚡ Preview: Experimente a demonstração abaixo
        </div>
      </div>

      {/* Busca de Jogador */}
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>
          🎯 Buscar Jogador
        </h3>
        <div style={{ display: 'flex', gap: 12 }}>
          <input
            type="text"
            value={searchNickname}
            onChange={(e) => setSearchNickname(e.target.value)}
            placeholder="Digite o nickname do jogador..."
            style={{
              flex: 1,
              padding: '14px 18px',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 12,
              color: 'var(--text-primary)',
              fontSize: 15,
              outline: 'none'
            }}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            style={{
              padding: '14px 28px',
              background: 'linear-gradient(135deg, #06b6d4, #0ea5e9)',
              border: 'none',
              borderRadius: 12,
              color: 'white',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            🔍 Analisar
          </button>
        </div>
        <p style={{ margin: '12px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
          💡 Demonstração: Digite qualquer nome para ver um exemplo de análise
        </p>
      </div>

      {/* Resultado da Análise (Demo) */}
      {showDemo && (
        <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
          {/* Header do Jogador */}
          <div className="card" style={{ padding: 24, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 28
                }}>
                  🎭
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>
                    {searchNickname || MOCK_PLAYER_DATA.nickname}
                  </h2>
                  <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                    <span style={{
                      padding: '4px 12px',
                      background: 'rgba(34, 197, 94, 0.2)',
                      border: '1px solid rgba(34, 197, 94, 0.4)',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#22c55e'
                    }}>
                      {MOCK_PLAYER_DATA.playerType}
                    </span>
                    <span style={{
                      padding: '4px 12px',
                      background: MOCK_PLAYER_DATA.recentForm === 'hot' 
                        ? 'rgba(239, 68, 68, 0.2)' 
                        : 'rgba(59, 130, 246, 0.2)',
                      border: `1px solid ${MOCK_PLAYER_DATA.recentForm === 'hot' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(59, 130, 246, 0.4)'}`,
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      color: MOCK_PLAYER_DATA.recentForm === 'hot' ? '#ef4444' : '#3b82f6'
                    }}>
                      🔥 Hot Streak
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Ability Score */}
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: `conic-gradient(#22c55e ${MOCK_PLAYER_DATA.ability}%, #1f2937 0)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}>
                  <div style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: '#0f172a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    fontWeight: 800,
                    color: '#22c55e'
                  }}>
                    {MOCK_PLAYER_DATA.ability}
                  </div>
                </div>
                <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                  Ability Score
                </p>
              </div>
            </div>
          </div>

          {/* Grid de Estatísticas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 20 }}>
            <StatCard label="Total Games" value={MOCK_PLAYER_DATA.totalGames.toLocaleString()} icon="🎮" />
            <StatCard label="ROI" value={`${MOCK_PLAYER_DATA.roi}%`} icon="📈" color="#22c55e" />
            <StatCard label="ITM" value={`${MOCK_PLAYER_DATA.itm}%`} icon="🏆" />
            <StatCard label="Avg Buy-in" value={`$${MOCK_PLAYER_DATA.avgBuyIn}`} icon="💰" />
            <StatCard label="Total Profit" value={`$${MOCK_PLAYER_DATA.totalProfit.toLocaleString()}`} icon="💵" color="#22c55e" />
            <StatCard label="Avg Profit" value={`${MOCK_PLAYER_DATA.avgProfit}%`} icon="📊" />
          </div>

          {/* Gráfico de Ganhos Neon - Flutuante Premium */}
          <div className="chart-floating" style={{ marginBottom: 32 }}>
            <h3 style={{ 
              fontSize: 22, 
              fontWeight: 700, 
              marginBottom: 32,
              color: '#f8fafc',
              textAlign: 'center',
              textShadow: '0 0 20px rgba(168, 85, 247, 0.3)'
            }}>
              📈 Evolução de Ganhos
            </h3>
            
            <div className="chart-container" style={{ position: 'relative', overflow: 'hidden' }}>
            {/* Background Glow Effects */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '30%',
              width: 300,
              height: 300,
              background: 'radial-gradient(circle, rgba(236, 72, 153, 0.15) 0%, transparent 70%)',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute',
              top: '60%',
              right: '20%',
              width: 250,
              height: 250,
              background: 'radial-gradient(circle, rgba(168, 85, 247, 0.12) 0%, transparent 70%)',
              transform: 'translate(50%, -50%)',
              pointerEvents: 'none',
            }} />
            
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ 
                  margin: 0, 
                  fontSize: 18, 
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #f8fafc, #c084fc)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  📈 Evolução de Ganhos
                </h3>
                <div style={{ display: 'flex', gap: 16 }}>
                  <span style={{ 
                    fontSize: 13, 
                    color: '#c084fc',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    <span style={{ width: 12, height: 3, background: 'linear-gradient(90deg, #a855f7, #ec4899)', borderRadius: 2 }}></span>
                    Profit Acumulado
                  </span>
                </div>
              </div>

              {/* SVG Gráfico Neon */}
              <div style={{ position: 'relative', height: 280 }}>
                <svg width="100%" height="100%" viewBox="0 0 800 280" preserveAspectRatio="none">
                  <defs>
                    {/* Gradiente da Linha Principal */}
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="50%" stopColor="#ec4899" />
                      <stop offset="100%" stopColor="#f472b6" />
                    </linearGradient>
                    
                    {/* Gradiente da Área sob a linha */}
                    <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#ec4899" stopOpacity="0.3" />
                      <stop offset="50%" stopColor="#a855f7" stopOpacity="0.1" />
                      <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                    </linearGradient>
                    
                    {/* Filtro de Glow */}
                    <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    
                    {/* Gradiente para pontos */}
                    <radialGradient id="pointGradient" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#fff" />
                      <stop offset="40%" stopColor="#f472b6" />
                      <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  
                  {/* Grid Lines Verticais */}
                  {[...Array(12)].map((_, i) => (
                    <line 
                      key={`v-${i}`}
                      x1={60 + i * 62} 
                      y1="20" 
                      x2={60 + i * 62} 
                      y2="240" 
                      stroke="rgba(168, 85, 247, 0.15)" 
                      strokeWidth="1"
                      strokeDasharray="4,4"
                    />
                  ))}
                  
                  {/* Grid Lines Horizontais */}
                  {[...Array(5)].map((_, i) => (
                    <line 
                      key={`h-${i}`}
                      x1="40" 
                      y1={20 + i * 55} 
                      x2="780" 
                      y2={20 + i * 55} 
                      stroke="rgba(168, 85, 247, 0.1)" 
                      strokeWidth="1"
                    />
                  ))}
                  
                  {/* Área preenchida sob a linha */}
                  <path
                    d="M 60 220 L 120 200 L 180 210 L 240 180 L 300 190 L 360 140 L 420 160 L 480 100 L 540 120 L 600 70 L 660 50 L 720 30 L 720 240 L 60 240 Z"
                    fill="url(#areaGradient)"
                    style={{ animation: 'fadeInArea 1s ease-out' }}
                  />
                  
                  {/* Linha Principal Neon */}
                  <path
                    d="M 60 220 L 120 200 L 180 210 L 240 180 L 300 190 L 360 140 L 420 160 L 480 100 L 540 120 L 600 70 L 660 50 L 720 30"
                    stroke="url(#lineGradient)"
                    strokeWidth="4"
                    fill="none"
                    filter="url(#neonGlow)"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      strokeDasharray: 1000,
                      strokeDashoffset: 1000,
                      animation: 'drawLine 2s ease-out forwards'
                    }}
                  />
                  
                  {/* Pontos de Dados com Glow */}
                  {[[60, 220], [120, 200], [180, 210], [240, 180], [300, 190], [360, 140], [420, 160], [480, 100], [540, 120], [600, 70], [660, 50], [720, 30]].map(([x, y], i) => (
                    <g key={i} style={{ animation: `fadeInPoint 0.3s ease-out ${0.15 * i}s forwards`, opacity: 0 }}>
                      {/* Glow externo */}
                      <circle cx={x} cy={y} r="16" fill="url(#pointGradient)" opacity="0.6" />
                      {/* Ponto principal */}
                      <circle cx={x} cy={y} r="6" fill="#ec4899" filter="url(#neonGlow)" />
                      {/* Centro brilhante */}
                      <circle cx={x} cy={y} r="3" fill="white" />
                    </g>
                  ))}
                  
                  {/* Labels dos Meses */}
                  {MOCK_PLAYER_DATA.profitHistory.map((data, i) => (
                    <text 
                      key={i}
                      x={60 + i * 60} 
                      y="265" 
                      fill="#7c3aed" 
                      fontSize="11" 
                      textAnchor="middle"
                      fontWeight="600"
                    >
                      {data.month}
                    </text>
                  ))}
                  
                  {/* Labels dos Valores Y */}
                  {['$25k', '$20k', '$15k', '$10k', '$5k', '$0'].map((label, i) => (
                    <text 
                      key={i}
                      x="30" 
                      y={25 + i * 44} 
                      fill="#64748b" 
                      fontSize="10" 
                      textAnchor="end"
                    >
                      {label}
                    </text>
                  ))}
                </svg>
                
                {/* Valor Atual Destacado */}
                <div style={{
                  position: 'absolute',
                  top: 10,
                  right: 20,
                  background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(236, 72, 153, 0.15))',
                  border: '1px solid rgba(236, 72, 153, 0.4)',
                  borderRadius: 12,
                  padding: '12px 20px',
                  boxShadow: '0 0 30px rgba(236, 72, 153, 0.2)',
                }}>
                  <div style={{ fontSize: 12, color: '#f472b6', marginBottom: 4 }}>Profit Total</div>
                  <div style={{ 
                    fontSize: 24, 
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #f472b6, #c084fc)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                    +${MOCK_PLAYER_DATA.totalProfit.toLocaleString()}
                  </div>
                </div>
              </div>
              
              {/* Legenda de Performance */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: 24, 
                marginTop: 16,
                paddingTop: 16,
                borderTop: '1px solid rgba(168, 85, 247, 0.2)'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#22c55e' }}>+147%</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Crescimento Anual</div>
                </div>
                <div style={{ width: 1, background: 'rgba(168, 85, 247, 0.3)' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#f472b6' }}>12</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Meses Positivos</div>
                </div>
                <div style={{ width: 1, background: 'rgba(168, 85, 247, 0.3)' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#c084fc' }}>$1.8k</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Média Mensal</div>
                </div>
              </div>
            </div>
            </div>
          </div>

          {/* Estatísticas de Jogo */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>📊 Estatísticas Pré-flop</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <StatBar label="VPIP" value={MOCK_PLAYER_DATA.vpip} max={50} color="#8b5cf6" />
                <StatBar label="PFR" value={MOCK_PLAYER_DATA.pfr} max={50} color="#ec4899" />
                <StatBar label="Aggression" value={MOCK_PLAYER_DATA.aggression * 10} max={50} color="#f59e0b" suffix={`${MOCK_PLAYER_DATA.aggression}`} />
              </div>
            </div>

            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>💪 Pontos Fortes</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {MOCK_PLAYER_DATA.strengths.map((strength, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: '#22c55e' }}>✓</span>
                    <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{strength}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Leaks Identificados */}
          <div className="card" style={{ padding: 20, marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>🔍 Leaks Identificados</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {MOCK_PLAYER_DATA.leaks.map((leak, i) => (
                <div 
                  key={i}
                  style={{
                    padding: 16,
                    background: leak.severity === 'high' 
                      ? 'rgba(239, 68, 68, 0.1)' 
                      : leak.severity === 'medium'
                        ? 'rgba(251, 191, 36, 0.1)'
                        : 'rgba(59, 130, 246, 0.1)',
                    border: `1px solid ${
                      leak.severity === 'high' 
                        ? 'rgba(239, 68, 68, 0.3)' 
                        : leak.severity === 'medium'
                          ? 'rgba(251, 191, 36, 0.3)'
                          : 'rgba(59, 130, 246, 0.3)'
                    }`,
                    borderRadius: 10
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{leak.area}</span>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      background: leak.severity === 'high' 
                        ? 'rgba(239, 68, 68, 0.2)' 
                        : leak.severity === 'medium'
                          ? 'rgba(251, 191, 36, 0.2)'
                          : 'rgba(59, 130, 246, 0.2)',
                      color: leak.severity === 'high' 
                        ? '#ef4444' 
                        : leak.severity === 'medium'
                          ? '#fbbf24'
                          : '#3b82f6'
                    }}>
                      {leak.severity === 'high' ? '⚠️ Alto' : leak.severity === 'medium' ? '⚡ Médio' : '💡 Baixo'}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
                    {leak.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Premium */}
          <div className="card" style={{ 
            padding: 32, 
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(6, 182, 212, 0.1))',
            border: '1px solid rgba(139, 92, 246, 0.3)'
          }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 20, fontWeight: 700 }}>
              🚀 Integração SharkScope em Breve!
            </h3>
            <p style={{ margin: '0 0 20px', color: 'var(--text-secondary)', fontSize: 14, maxWidth: 500, marginLeft: 'auto', marginRight: 'auto' }}>
              Teremos análise real de jogadores com dados do SharkScope. 
              Assine o Premium para ter acesso assim que lançar!
            </p>
            <button
              onClick={() => navigate('/premium')}
              style={{
                padding: '14px 32px',
                background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                border: 'none',
                borderRadius: 12,
                color: 'white',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)'
              }}
            >
              👑 Assinar Premium
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes drawLine {
          to { stroke-dashoffset: 0; }
        }
        @keyframes fadeInPoint {
          from { opacity: 0; transform: scale(0); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeInArea {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pulseGlow {
          0%, 100% { filter: drop-shadow(0 0 8px rgba(236, 72, 153, 0.6)); }
          50% { filter: drop-shadow(0 0 20px rgba(236, 72, 153, 0.9)); }
        }
      `}</style>
    </div>
  );
}

// Componentes auxiliares
function StatCard({ label, value, icon, color }: { label: string; value: string; icon: string; color?: string }) {
  return (
    <div className="card" style={{ padding: 16, textAlign: 'center' }}>
      <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: color || 'var(--text-primary)' }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
    </div>
  );
}

function StatBar({ label, value, max, color, suffix }: { label: string; value: number; max: number; color: string; suffix?: string }) {
  const percentage = (value / max) * 100;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{suffix || `${value}%`}</span>
      </div>
      <div style={{ height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${percentage}%`,
          background: color,
          borderRadius: 4,
          transition: 'width 0.5s ease-out'
        }} />
      </div>
    </div>
  );
}
