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
  const [showPaywall, setShowPaywall] = useState(false);
  const [userGoal, setUserGoal] = useState<number>(1000); // Meta padrão: R$ 1.000
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState('1000');

  // Constantes FREE
  const FREE_SESSION_LIMIT = 10;

  // Carregar meta do localStorage
  useEffect(() => {
    const storedGoal = localStorage.getItem('pokerwizard_user_goal');
    if (storedGoal) {
      const goal = parseFloat(storedGoal);
      if (!isNaN(goal) && goal > 0) {
        setUserGoal(goal);
        setGoalInput(goal.toString());
      }
    }
  }, []);

  // Salvar meta no localStorage
  const saveGoal = (goal: number) => {
    setUserGoal(goal);
    localStorage.setItem('pokerwizard_user_goal', goal.toString());
  };

  // Atualizar meta
  const handleUpdateGoal = () => {
    const newGoal = parseFloat(goalInput);
    if (!isNaN(newGoal) && newGoal > 0) {
      saveGoal(newGoal);
      setIsEditingGoal(false);
    }
  };

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

  // Calcular total acumulado e progresso da meta
  const totalAccumulated = sessions.reduce((acc, s) => acc + s.net, 0);
  const progressPercentage = Math.min(100, Math.max(0, (totalAccumulated / userGoal) * 100));
  const remainingPercentage = Math.max(0, 100 - progressPercentage);
  const remainingAmount = Math.max(0, userGoal - totalAccumulated);

  // Verificar limite FREE
  const isBlocked = !isReallyPremium && sessions.length >= FREE_SESSION_LIMIT;
  const shouldBlurChart = !isReallyPremium && sessions.length >= FREE_SESSION_LIMIT;

  // Barra Circular de Progresso Animada - Estilo Semicircular
  const CircularProgressBar = ({ percentage, total, goal, remaining }: { percentage: number; total: number; goal: number; remaining: number }) => {
    const size = 340;
    const strokeWidth = 22;
    const radius = size / 2 - strokeWidth;
    const circumference = Math.PI * radius; // Semicírculo
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <div style={{ position: 'relative', width: size, height: size * 0.65, margin: '0 auto', overflow: 'hidden' }}>
        {/* Círculos de fundo decorativos */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: size * 1.5,
          height: size * 1.5,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: size * 1.2,
          height: size * 1.2,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.25) 0%, transparent 60%)',
          pointerEvents: 'none'
        }} />
        
        <svg width={size} height={size * 0.65} viewBox={`0 0 ${size} ${size * 0.65}`} style={{ display: 'block' }}>
          <defs>
            <linearGradient id="gradient-semi-profit" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="50%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
            <linearGradient id="gradient-semi-loss" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
            <filter id="glow-effect" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feFlood floodColor={total >= 0 ? "#a855f7" : "#ef4444"} floodOpacity="0.9" />
              <feComposite in2="blur" operator="in" />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          
          {/* Background arc */}
          <path
            d={`M ${strokeWidth} ${size * 0.65 - strokeWidth} A ${radius} ${radius} 0 0 1 ${size - strokeWidth} ${size * 0.65 - strokeWidth}`}
            fill="none"
            stroke="rgba(168, 85, 247, 0.2)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          
          {/* Progress arc */}
          <path
            d={`M ${strokeWidth} ${size * 0.65 - strokeWidth} A ${radius} ${radius} 0 0 1 ${size - strokeWidth} ${size * 0.65 - strokeWidth}`}
            fill="none"
            stroke={`url(#gradient-semi-${total >= 0 ? 'profit' : 'loss'})`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            filter="url(#glow-effect)"
            style={{
              transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        </svg>
        
        {/* Texto central */}
        <div style={{ 
          position: 'absolute', 
          bottom: 20, 
          left: '50%', 
          transform: 'translateX(-50%)', 
          textAlign: 'center',
          width: '100%'
        }}>
          <div style={{ 
            fontSize: 14, 
            color: '#94a3b8', 
            fontWeight: 600,
            marginBottom: 8
          }}>
            {percentage >= 100 ? 'Meta atingida! 🎉' : 'Total em Vendas'}
          </div>
          <div style={{ 
            fontSize: 56, 
            fontWeight: 900, 
            color: '#a855f7',
            textShadow: '0 0 40px rgba(168, 85, 247, 0.9), 0 0 80px rgba(168, 85, 247, 0.6), 0 0 120px rgba(168, 85, 247, 0.3)',
            marginBottom: 8,
            lineHeight: 1
          }}>
            {percentage.toFixed(1)}%
          </div>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
            Meta: {goal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        </div>
      </div>
    );
  };

  // Gráfico de Evolução (igual Análise de Jogadores)
  const EvolutionChart = ({ data, isBlurred }: { data: SessionResult[]; isBlurred: boolean }) => {
    if (data.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: 60, color: '#6b7280' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📈</div>
          <p style={{ fontSize: 14 }}>Adicione sessões para ver o gráfico de evolução</p>
        </div>
      );
    }

    // Calcular valores acumulados
    let accumulated = 0;
    const chartData = data.map(session => {
      accumulated += session.net;
      return { ...session, accumulated };
    }).reverse(); // Mais antigo primeiro

    const maxValue = Math.max(...chartData.map(d => Math.abs(d.accumulated)), 100);
    const minValue = Math.min(...chartData.map(d => d.accumulated), 0);
    const range = maxValue - minValue;

    // Calcular pontos da linha
    const points = chartData.map((d, i) => {
      const x = (i / (chartData.length - 1 || 1)) * 100;
      const y = 100 - (((d.accumulated - minValue) / range) * 80 + 10);
      return `${x},${y}`;
    }).join(' ');

    // Área sob a linha
    const areaPoints = points + ` 100,100 0,100`;

    return (
      <div style={{ position: 'relative', filter: isBlurred ? 'blur(8px)' : 'none', transition: 'filter 0.3s ease' }}>
        <svg width="100%" height="280" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ display: 'block' }}>
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="50%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#f472b6" />
            </linearGradient>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ec4899" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#a855f7" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          
          {/* Área */}
          <polygon points={areaPoints} fill="url(#areaGradient)" />
          
          {/* Linha */}
          <polyline
            points={points}
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="0.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#glow)"
          />
          
          {/* Pontos */}
          {chartData.map((d, i) => {
            const x = (i / (chartData.length - 1 || 1)) * 100;
            const y = 100 - (((d.accumulated - minValue) / range) * 80 + 10);
            return (
              <circle
                key={d.id}
                cx={x}
                cy={y}
                r="0.8"
                fill={d.net >= 0 ? '#10b981' : '#ef4444'}
                filter="url(#glow)"
              />
            );
          })}
        </svg>
        
        {/* Legenda */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 11, color: '#6b7280' }}>
          <span>Sessão 1</span>
          <span>Evolução Acumulada</span>
          <span>Sessão {chartData.length}</span>
        </div>
      </div>
    );
  };

  // Progress Ring SVG (mantido para compatibilidade, mas não usado no novo layout)
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

      {/* 1️⃣ NOVA SESSÃO - INPUT NO TOPO */}
      <div className="card" style={{ padding: 24, maxWidth: 600, margin: '0 auto 32px', width: '100%' }}>
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
              disabled={isBlocked}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: isBlocked ? 'rgba(107, 114, 128, 0.1)' : 'rgba(16, 185, 129, 0.05)',
                border: `1px solid ${isBlocked ? 'rgba(107, 114, 128, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                borderRadius: 8,
                color: isBlocked ? '#6b7280' : '#10b981',
                fontSize: 16,
                fontWeight: 600,
                outline: 'none',
                transition: 'all 0.3s ease',
                cursor: isBlocked ? 'not-allowed' : 'text'
              }}
              onFocus={(e) => !isBlocked && (e.currentTarget.style.border = '1px solid rgba(16, 185, 129, 0.6)')}
              onBlur={(e) => !isBlocked && (e.currentTarget.style.border = '1px solid rgba(16, 185, 129, 0.3)')}
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
              disabled={isBlocked}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: isBlocked ? 'rgba(107, 114, 128, 0.1)' : 'rgba(239, 68, 68, 0.05)',
                border: `1px solid ${isBlocked ? 'rgba(107, 114, 128, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                borderRadius: 8,
                color: isBlocked ? '#6b7280' : '#ef4444',
                fontSize: 16,
                fontWeight: 600,
                outline: 'none',
                transition: 'all 0.3s ease',
                cursor: isBlocked ? 'not-allowed' : 'text'
              }}
              onFocus={(e) => !isBlocked && (e.currentTarget.style.border = '1px solid rgba(239, 68, 68, 0.6)')}
              onBlur={(e) => !isBlocked && (e.currentTarget.style.border = '1px solid rgba(239, 68, 68, 0.3)')}
            />
          </div>

          {/* Limite FREE */}
          {!isReallyPremium && (
            <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
              Sessões: {sessions.length}/{FREE_SESSION_LIMIT} {isBlocked && '(Limite atingido)'}
            </div>
          )}

          {/* Botão Adicionar */}
          <button
            onClick={handleAddSession}
            disabled={!gains && !losses || isBlocked}
            style={{
              padding: '14px 20px',
              background: (!gains && !losses || isBlocked) ? 'rgba(168, 85, 247, 0.2)' : 'linear-gradient(145deg, rgba(168, 85, 247, 0.9), rgba(124, 58, 237, 0.9))',
              border: 'none',
              borderRadius: 10,
              color: (!gains && !losses || isBlocked) ? '#6b7280' : '#fff',
              fontSize: 15,
              fontWeight: 700,
              cursor: (!gains && !losses || isBlocked) ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: (!gains && !losses || isBlocked) ? 'none' : '0 4px 20px rgba(168, 85, 247, 0.4)'
            }}
            onMouseEnter={(e) => {
              if ((gains || losses) && !isBlocked) {
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

      {/* 2️⃣ BARRA CIRCULAR DE PROGRESSO */}
      {sessions.length > 0 && (
        <div className="card" style={{ padding: 32, maxWidth: 600, margin: '0 auto 32px', width: '100%', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc' }}>
              🎯 Progresso da Meta
            </h3>
            <button
              onClick={() => setIsEditingGoal(!isEditingGoal)}
              style={{
                padding: '6px 12px',
                background: 'rgba(168, 85, 247, 0.15)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                borderRadius: 8,
                color: '#a855f7',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(168, 85, 247, 0.25)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(168, 85, 247, 0.15)'}
            >
              ✏️ Editar Meta
            </button>
          </div>

          {/* Editor de Meta */}
          {isEditingGoal && (
            <div style={{ marginBottom: 24, padding: 16, background: 'rgba(168, 85, 247, 0.1)', borderRadius: 12, border: '1px solid rgba(168, 85, 247, 0.3)' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center' }}>
                <input
                  type="number"
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  placeholder="1000"
                  step="100"
                  style={{
                    width: 150,
                    padding: '10px 14px',
                    background: 'rgba(10, 15, 36, 0.8)',
                    border: '1px solid rgba(168, 85, 247, 0.4)',
                    borderRadius: 8,
                    color: '#a855f7',
                    fontSize: 16,
                    fontWeight: 600,
                    outline: 'none',
                    textAlign: 'center'
                  }}
                />
                <button
                  onClick={handleUpdateGoal}
                  style={{
                    padding: '10px 20px',
                    background: 'linear-gradient(145deg, rgba(168, 85, 247, 0.9), rgba(124, 58, 237, 0.9))',
                    border: 'none',
                    borderRadius: 8,
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  ✓ Salvar
                </button>
              </div>
              <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>
                Digite sua meta de lucro em R$
              </p>
            </div>
          )}

          {/* Barra Circular */}
          <CircularProgressBar 
            percentage={progressPercentage} 
            total={totalAccumulated} 
            goal={userGoal}
            remaining={remainingAmount}
          />
          
          {/* Informações da Meta */}
          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Texto Principal */}
            <div style={{ fontSize: 15, fontWeight: 700, color: progressPercentage >= 100 ? '#10b981' : '#a855f7' }}>
              {progressPercentage >= 100 ? (
                <>🎉 Meta atingida! Parabéns!</>
              ) : (
                <>{remainingPercentage.toFixed(0)}% faltam para atingir sua meta</>
              )}
            </div>

            {/* Valores */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 8 }}>
              <div style={{ padding: 12, background: 'rgba(168, 85, 247, 0.1)', borderRadius: 10, border: '1px solid rgba(168, 85, 247, 0.3)' }}>
                <div style={{ fontSize: 11, color: '#a855f7', fontWeight: 600, marginBottom: 6 }}>RESULTADO ATUAL</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: totalAccumulated >= 0 ? '#10b981' : '#ef4444' }}>
                  {totalAccumulated >= 0 ? '+' : ''}{totalAccumulated.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              </div>
              <div style={{ padding: 12, background: 'rgba(168, 85, 247, 0.1)', borderRadius: 10, border: '1px solid rgba(168, 85, 247, 0.3)' }}>
                <div style={{ fontSize: 11, color: '#a855f7', fontWeight: 600, marginBottom: 6 }}>META DEFINIDA</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#a855f7' }}>
                  {userGoal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              </div>
            </div>

            {/* Quanto falta (se não atingiu) */}
            {progressPercentage < 100 && (
              <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
                Faltam <strong style={{ color: '#a855f7' }}>{remainingAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong> para sua meta
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3️⃣ GRÁFICO DE EVOLUÇÃO */}
      {sessions.length > 0 && (
        <div className="card" style={{ padding: 24, maxWidth: 900, margin: '0 auto 32px', width: '100%', position: 'relative' }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: '#f8fafc' }}>
            📈 Evolução de Resultados
          </h3>
          <EvolutionChart data={sessions} isBlurred={shouldBlurChart} />
          
          {/* Paywall sobre gráfico */}
          {shouldBlurChart && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              zIndex: 10,
              background: 'rgba(10, 15, 36, 0.95)',
              padding: 32,
              borderRadius: 16,
              border: '1px solid rgba(168, 85, 247, 0.4)',
              boxShadow: '0 8px 40px rgba(0, 0, 0, 0.6)',
              maxWidth: 400
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
              <h4 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: '#f8fafc' }}>
                Limite FREE Atingido
              </h4>
              <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 20, lineHeight: 1.6 }}>
                Você atingiu o limite de <strong style={{ color: '#a855f7' }}>{FREE_SESSION_LIMIT} sessões</strong>.<br />
                Upgrade para <strong style={{ color: '#a855f7' }}>PRO</strong> e tenha histórico ilimitado!
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
          )}
        </div>
      )}

      {/* PRO Features - Histórico Semanal/Mensal */}
      {isReallyPremium && sessions.length > 0 && (
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
      )}

      {/* 4️⃣ HISTÓRICO DE SESSÕES (Removido - substituído por gráfico) */}
    </div>
  );
}
