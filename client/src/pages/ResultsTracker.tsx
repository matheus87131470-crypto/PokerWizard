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

interface Cycle {
  id: string;
  startDate: string;
  endDate: string;
  sessions: SessionResult[];
  totalNet: number;
  goal: number;
  percentageReached: number;
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
  const [completedCycles, setCompletedCycles] = useState<Cycle[]>([]);
  const [showFinalizeCycleModal, setShowFinalizeCycleModal] = useState(false);
  const [showResetTotalModal, setShowResetTotalModal] = useState(false);
  const [cycleNumber, setCycleNumber] = useState(1);

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

    // Carregar ciclos completados
    const storedCycles = localStorage.getItem('pokerwizard_completed_cycles');
    if (storedCycles) {
      try {
        const cycles = JSON.parse(storedCycles);
        setCompletedCycles(cycles);
        setCycleNumber(cycles.length + 1);
      } catch (error) {
        console.error('Erro ao carregar ciclos:', error);
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

  // Finalizar Ciclo
  const handleFinalizeCycle = () => {
    if (sessions.length === 0) return;

    const totalNet = sessions.reduce((acc, s) => acc + s.net, 0);
    const percentageReached = (totalNet / userGoal) * 100;

    const newCycle: Cycle = {
      id: Date.now().toString(),
      startDate: sessions[sessions.length - 1]?.date || new Date().toLocaleDateString('pt-BR'),
      endDate: sessions[0]?.date || new Date().toLocaleDateString('pt-BR'),
      sessions: [...sessions],
      totalNet,
      goal: userGoal,
      percentageReached
    };

    const updatedCycles = [...completedCycles, newCycle];
    setCompletedCycles(updatedCycles);
    localStorage.setItem('pokerwizard_completed_cycles', JSON.stringify(updatedCycles));

    // Resetar sessões e iniciar novo ciclo
    setSessions([]);
    localStorage.setItem('pokerwizard_results_sessions', JSON.stringify([]));
    setCycleNumber(updatedCycles.length + 1);
    setShowFinalizeCycleModal(false);

    // Animação
    setAnimateRing(true);
    setTimeout(() => setAnimateRing(false), 600);
  };

  // Reset Total (apenas PRO)
  const handleResetTotal = () => {
    setSessions([]);
    setCompletedCycles([]);
    setCycleNumber(1);
    localStorage.setItem('pokerwizard_results_sessions', JSON.stringify([]));
    localStorage.setItem('pokerwizard_completed_cycles', JSON.stringify([]));
    setShowResetTotalModal(false);
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

  // Barra Circular de Progresso Animada - Estilo Premium Semicircular
  const CircularProgressBar = ({ percentage, total, goal, remaining }: { percentage: number; total: number; goal: number; remaining: number }) => {
    const [animatedPercentage, setAnimatedPercentage] = useState(0);
    
    useEffect(() => {
      // Animação de preenchimento suave
      const duration = 1500;
      const steps = 60;
      const stepDuration = duration / steps;
      const increment = percentage / steps;
      let current = 0;
      
      const timer = setInterval(() => {
        current += increment;
        if (current >= percentage) {
          setAnimatedPercentage(percentage);
          clearInterval(timer);
        } else {
          setAnimatedPercentage(current);
        }
      }, stepDuration);
      
      return () => clearInterval(timer);
    }, [percentage]);

    const size = 460;
    const strokeWidth = 32;
    const radius = size / 2 - strokeWidth;
    const circumference = Math.PI * radius;
    const offset = circumference - (animatedPercentage / 100) * circumference;

    return (
      <div style={{ position: 'relative', width: '100%', maxWidth: size, height: size * 0.65, margin: '0 auto', overflow: 'visible', padding: '20px 0' }}>
        {/* Círculos decorativos de fundo com glow SUAVIZADO (~40% redução) */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: size * 1.6,
          height: size * 1.6,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.12) 0%, rgba(236, 72, 153, 0.06) 50%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
          opacity: 0.8,
          animation: 'pulse-subtle 5s ease-in-out infinite'
        }} />
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: size * 1.3,
          height: size * 1.3,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, rgba(236, 72, 153, 0.08) 40%, transparent 65%)',
          filter: 'blur(45px)',
          pointerEvents: 'none',
          opacity: 0.7
        }} />
        
        {/* SVG Progress Arc */}
        <svg width={size} height={size * 0.65} viewBox={`0 0 ${size} ${size * 0.65}`} style={{ display: 'block' }}>
          <defs>
            {/* Gradientes com saturação reduzida (~20%) */}
            <linearGradient id="gradient-arc-profit" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#9d6fc9" />
              <stop offset="50%" stopColor="#d96ba6" />
              <stop offset="100%" stopColor="#e589b8" />
            </linearGradient>
            <linearGradient id="gradient-arc-loss" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#e57373" />
              <stop offset="100%" stopColor="#9d6fc9" />
            </linearGradient>
            {/* Filtro de glow SUAVIZADO (~35% redução intensidade) */}
            <filter id="neon-glow-arc" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur1" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur2" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="15" result="blur3" />
              <feMerge>
                <feMergeNode in="blur3" />
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          
          {/* Background arc (parte vazia) */}
          <path
            d={`M ${strokeWidth} ${size * 0.65 - strokeWidth} A ${radius} ${radius} 0 0 1 ${size - strokeWidth} ${size * 0.65 - strokeWidth}`}
            fill="none"
            stroke="rgba(148, 163, 184, 0.12)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          
          {/* Progress arc (parte preenchida) */}
          <path
            d={`M ${strokeWidth} ${size * 0.65 - strokeWidth} A ${radius} ${radius} 0 0 1 ${size - strokeWidth} ${size * 0.65 - strokeWidth}`}
            fill="none"
            stroke={`url(#gradient-arc-${total >= 0 ? 'profit' : 'loss'})`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            filter="url(#neon-glow-arc)"
            style={{
              transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        </svg>
        
        {/* Texto central - HIERARQUIA REFORÇADA (tipografia > efeitos) */}
        <div style={{ 
          position: 'absolute', 
          bottom: 15, 
          left: '50%', 
          transform: 'translateX(-50%)', 
          textAlign: 'center',
          width: '100%'
        }}>
          <div style={{ 
            fontSize: 10, 
            color: '#94a3b8', 
            fontWeight: 600,
            letterSpacing: '1.2px',
            marginBottom: 6,
            textTransform: 'uppercase',
            opacity: 0.7
          }}>
            Total Acumulado
          </div>
          
          {/* VALOR PRINCIPAL - Maior destaque tipográfico */}
          <div style={{ 
            fontSize: 44, 
            fontWeight: 900, 
            color: '#9d6fc9',
            textShadow: '0 0 20px rgba(157, 111, 201, 0.4), 0 0 40px rgba(157, 111, 201, 0.2)',
            marginBottom: 6,
            lineHeight: 1,
            letterSpacing: '-0.02em'
          }}>
            {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
          
          {/* Percentual - Secundário */}
          <div style={{ 
            fontSize: 22, 
            fontWeight: 800, 
            color: '#d96ba6',
            textShadow: '0 0 15px rgba(217, 107, 166, 0.3)',
            marginBottom: 6,
            lineHeight: 1,
            opacity: 0.9
          }}>
            {animatedPercentage.toFixed(1)}%
          </div>
          
          {/* Meta - Terciário */}
          <div style={{ 
            fontSize: 11, 
            color: '#6b7280',
            fontWeight: 600,
            opacity: 0.6
          }}>
            Meta: {goal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        </div>

        <style>{`
          @keyframes pulse-subtle {
            0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
            50% { transform: translate(-50%, -50%) scale(1.05); opacity: 0.7; }
          }
        `}</style>
      </div>
    );
  };

  // Gráfico de Evolução - Dual Style: Analytics (profissional) vs Highlight (emocional)
  const EvolutionChart = ({ data, isBlurred, variant = 'analytics' }: { data: SessionResult[]; isBlurred: boolean; variant?: 'analytics' | 'highlight' }) => {
    const [hoveredPoint, setHoveredPoint] = useState<{ index: number; x: number; y: number; value: number; date: string; sessionData: SessionResult } | null>(null);

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

    // Calcular totalProfit ANTES de usar em styles
    const totalProfit = chartData[chartData.length - 1].accumulated;

    // 🎨 Configurações de estilo por variante
    const styles = variant === 'analytics' ? {
      // 📊 ANALYTICS: Visual profissional para histórico/análise
      lineColor: totalProfit >= 0 ? '#10b981' : '#ef4444',
      lineWidth: '1.5',
      lineGlow: false,
      areaOpacity: 0.03,
      areaColor: totalProfit >= 0 ? '#10b981' : '#ef4444',
      gridOpacity: 0.06,
      gridColor: '#94a3b8',
      pointRadius: { normal: 0.6, hover: 1.2, last: 1.0 },
      pointOpacity: 0.8,
      background: 'transparent',
      legendBg: 'rgba(148, 163, 184, 0.04)',
      legendBorder: 'rgba(148, 163, 184, 0.12)',
      tooltipBg: 'rgba(30, 41, 59, 0.98)',
      tooltipBorder: 'rgba(148, 163, 184, 0.3)'
    } : {
      // ✨ HIGHLIGHT: Visual emocional para destaque/progressão
      lineGradient: true,
      lineWidth: '1.2',
      lineGlow: true,
      areaOpacity: 0.15,
      gridOpacity: 0.08,
      gridColor: '#a855f7',
      pointRadius: { normal: 0.8, hover: 1.5, last: 1.8 },
      pointOpacity: 0.6,
      background: 'transparent',
      legendBg: 'rgba(168, 85, 247, 0.05)',
      legendBorder: 'rgba(168, 85, 247, 0.15)',
      tooltipBg: 'rgba(15, 23, 42, 0.98)',
      tooltipBorder: 'rgba(168, 85, 247, 0.3)'
    };

    const maxValue = Math.max(...chartData.map(d => d.accumulated), 100);
    const minValue = Math.min(...chartData.map(d => d.accumulated), 0);
    const range = maxValue - minValue || 1;
    const padding = range * 0.1;

    // Calcular estatísticas
    const firstValue = chartData[0].accumulated;
    const growthPercent = firstValue !== 0 ? ((totalProfit - firstValue) / Math.abs(firstValue)) * 100 : 0;
    const positiveMonths = chartData.filter(d => d.net > 0).length;
    const avgMonthly = totalProfit / chartData.length;
    
    // 📊 Linha de referência (saldo inicial = 0)
    const referenceValue = 0;

    // 📅 Período em dias
    const firstDate = new Date(chartData[0].date.split('/').reverse().join('-'));
    const lastDate = new Date(chartData[chartData.length - 1].date.split('/').reverse().join('-'));
    const daysDiff = Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));

    // Função para calcular Y
    const getY = (value: number) => {
      return ((maxValue + padding - value) / (range + 2 * padding)) * 100;
    };

    // Calcular pontos da linha
    const points = chartData.map((d, i) => {
      const x = (i / Math.max(chartData.length - 1, 1)) * 100;
      const y = getY(d.accumulated);
      return { x, y, data: d };
    });

    // Linha SVG com segmentos coloridos para quedas (apenas highlight)
    const segments: Array<{ path: string; isNegative: boolean }> = [];
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const isNegative = next.data.accumulated < current.data.accumulated;
      segments.push({
        path: `M ${current.x} ${current.y} L ${next.x} ${next.y}`,
        isNegative
      });
    }

    // Grid Y labels
    const yLabels = [];
    const numLabels = 5;
    for (let i = 0; i <= numLabels; i++) {
      const value = maxValue + padding - (i * (range + 2 * padding) / numLabels);
      yLabels.push(value);
    }

    return (
      <div style={{ position: 'relative', filter: isBlurred ? 'blur(8px)' : 'none', transition: 'filter 0.3s ease' }}>
        {/* 📊 Micro-legenda */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 16,
          padding: '12px 16px',
          background: styles.legendBg,
          borderRadius: 8,
          border: `1px solid ${styles.legendBorder}`
        }}>
          <div>
            <span style={{ fontSize: 12, color: '#94a3b8', marginRight: 8 }}>Resultado atual:</span>
            <strong style={{ 
              fontSize: 16, 
              fontWeight: 700,
              color: totalProfit >= 0 ? '#10b981' : '#ef4444'
            }}>
              {totalProfit >= 0 ? '+' : ''}{totalProfit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </strong>
          </div>
          <div>
            <span style={{ fontSize: 12, color: '#94a3b8', marginRight: 8 }}>Período:</span>
            <strong style={{ fontSize: 14, fontWeight: 600, color: variant === 'analytics' ? '#64748b' : '#a855f7' }}>
              {daysDiff === 0 ? 'Hoje' : `Últimos ${daysDiff} ${daysDiff === 1 ? 'dia' : 'dias'}`}
            </strong>
          </div>
        </div>

        {/* Grid e gráfico - Fluido sem card */}
        <div style={{ position: 'relative', background: 'transparent', padding: '24px 0' }}>
          {/* Eixo Y */}
          <div style={{ position: 'absolute', left: 0, top: 24, bottom: 50, width: 60, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            {yLabels.map((value, i) => (
              <div key={i} style={{ fontSize: 11, color: '#6b7280', textAlign: 'right', paddingRight: 8 }}>
                {value >= 1000 ? `R$${(value / 1000).toFixed(1)}K` : `R$${value.toFixed(0)}`}
              </div>
            ))}
          </div>

          {/* SVG Chart Container */}
          <div style={{ marginLeft: 60, marginRight: 16, position: 'relative' }}>
            <svg 
              width="100%" 
              height="300" 
              viewBox="0 0 100 100" 
              preserveAspectRatio="none" 
              style={{ display: 'block' }}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              <defs>
                {/* ANALYTICS: Linha sólida simples */}
                {variant === 'analytics' && (
                  <>
                    <linearGradient id="areaGradientAnalytics" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor={styles.areaColor} stopOpacity={styles.areaOpacity} />
                      <stop offset="100%" stopColor={styles.areaColor} stopOpacity="0" />
                    </linearGradient>
                  </>
                )}
                
                {/* HIGHLIGHT: Gradientes e glows */}
                {variant === 'highlight' && (
                  <>
                    <linearGradient id="lineGradientEvolution" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="50%" stopColor="#ec4899" />
                      <stop offset="100%" stopColor="#f472b6" />
                    </linearGradient>
                    <linearGradient id="lineGradientNegative" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#f472b6" stopOpacity="0.7" />
                      <stop offset="100%" stopColor="#fb923c" stopOpacity="0.7" />
                    </linearGradient>
                    <linearGradient id="areaGradientEvolution" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#ec4899" stopOpacity="0.15" />
                      <stop offset="50%" stopColor="#a855f7" stopOpacity="0.08" />
                      <stop offset="100%" stopColor="#1e293b" stopOpacity="0" />
                    </linearGradient>
                    <filter id="glowEvolution">
                      <feGaussianBlur stdDeviation="1.5" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    <filter id="glowLastPoint">
                      <feGaussianBlur stdDeviation="2" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="blur" />
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </>
                )}
              </defs>

              {/* Grid horizontal lines */}
              {[0, 25, 50, 75, 100].map((y) => (
                <line 
                  key={y} 
                  x1="0" 
                  y1={y} 
                  x2="100" 
                  y2={y} 
                  stroke={`rgba(${styles.gridColor === '#94a3b8' ? '148, 163, 184' : '168, 85, 247'}, ${styles.gridOpacity})`}
                  strokeWidth="0.3" 
                />
              ))}
              
              {/* 📏 Linha vertical de referência ao passar o mouse */}
              {hoveredPoint && (
                <line
                  x1={points[hoveredPoint.index].x}
                  y1="0"
                  x2={points[hoveredPoint.index].x}
                  y2="100"
                  stroke={variant === 'analytics' ? 'rgba(148, 163, 184, 0.3)' : 'rgba(168, 85, 247, 0.4)'}
                  strokeWidth="0.5"
                  strokeDasharray="3,3"
                />
              )}
              
              {/* 📏 Linha de referência tracejada (saldo inicial) */}
              <line
                x1="0"
                y1={getY(referenceValue)}
                x2="100"
                y2={getY(referenceValue)}
                stroke="rgba(148, 163, 184, 0.25)"
                strokeWidth="0.4"
                strokeDasharray="2,2"
              />
              
              {/* Área sob a linha */}
              {variant === 'analytics' ? (
                <path 
                  d={`M 0 ${points[0].y} ${points.map((p, i) => `L ${p.x} ${p.y}`).join(' ')} L 100 100 L 0 100 Z`} 
                  fill="url(#areaGradientAnalytics)" 
                />
              ) : (
                <path 
                  d={`M 0 ${points[0].y} ${points.map((p, i) => `L ${p.x} ${p.y}`).join(' ')} L 100 100 L 0 100 Z`} 
                  fill="url(#areaGradientEvolution)" 
                />
              )}
              
              {/* Linha principal */}
              {variant === 'analytics' ? (
                /* ANALYTICS: Linha sólida única cor */
                <path
                  d={points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')}
                  fill="none"
                  stroke={styles.lineColor}
                  strokeWidth={styles.lineWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : (
                /* HIGHLIGHT: Segmentos com gradiente e glow */
                segments.map((seg, i) => (
                  <path
                    key={i}
                    d={seg.path}
                    fill="none"
                    stroke={seg.isNegative ? "url(#lineGradientNegative)" : "url(#lineGradientEvolution)"}
                    strokeWidth={styles.lineWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#glowEvolution)"
                  />
                ))
              )}
              
              {/* Pontos - mais discretos, exceto o último */}
              {points.map((p, i) => {
                const isLast = i === points.length - 1;
                const isHovered = hoveredPoint?.index === i;
                const radius = isLast ? 
                  (isHovered ? styles.pointRadius.last * 1.2 : styles.pointRadius.last) : 
                  (isHovered ? styles.pointRadius.hover : styles.pointRadius.normal);
                
                return (
                  <circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r={radius}
                    fill={variant === 'analytics' ? 
                      (isLast ? styles.lineColor : styles.lineColor) : 
                      (isLast ? "#ec4899" : "rgba(236, 72, 153, 0.6)")
                    }
                    stroke={variant === 'analytics' ? '#fff' : (isLast ? "#fff" : "rgba(255, 255, 255, 0.4)")}
                    strokeWidth={variant === 'analytics' ? "0.3" : (isLast ? "0.4" : "0.2")}
                    opacity={variant === 'analytics' ? styles.pointOpacity : 1}
                    filter={variant === 'highlight' && isLast ? "url(#glowLastPoint)" : "none"}
                    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
                      if (rect) {
                        const xPos = rect.left + (p.x / 100) * rect.width;
                        const yPos = rect.top + (p.y / 100) * rect.height;
                        setHoveredPoint({ 
                          index: i, 
                          x: xPos, 
                          y: yPos, 
                          value: p.data.accumulated,
                          date: p.data.date,
                          sessionData: p.data
                        });
                      }
                    }}
                  />
                );
              })}
            </svg>

            {/* Eixo X - Datas */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingLeft: 4, paddingRight: 4 }}>
              {chartData.map((d, i) => {
                const showLabel = chartData.length <= 12 || i % Math.ceil(chartData.length / 12) === 0 || i === chartData.length - 1;
                return showLabel ? (
                  <span key={i} style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>
                    {d.date.split('/')[0]}/{d.date.split('/')[1]}
                  </span>
                ) : null;
              })}
            </div>
          </div>
        </div>

        {/* Tooltip flutuante aprimorado */}
        {hoveredPoint && (
          <div style={{
            position: 'fixed',
            left: hoveredPoint.x,
            top: hoveredPoint.y - 80,
            transform: 'translateX(-50%)',
            background: styles.tooltipBg,
            padding: '12px 16px',
            borderRadius: variant === 'analytics' ? 8 : 10,
            fontSize: 13,
            color: '#fff',
            whiteSpace: 'nowrap',
            boxShadow: variant === 'analytics' ? 
              '0 4px 20px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(148, 163, 184, 0.2)' : 
              '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(168, 85, 247, 0.4)',
            pointerEvents: 'none',
            zIndex: 9999,
            border: `1px solid ${styles.tooltipBorder}`
          }}>
            {/* Valor principal */}
            <div style={{ 
              fontSize: 18, 
              fontWeight: 800, 
              color: hoveredPoint.value >= 0 ? '#10b981' : '#ef4444',
              marginBottom: 6
            }}>
              {hoveredPoint.value >= 0 ? '+' : ''}{hoveredPoint.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            
            {/* Informações da sessão */}
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>
              Sessão #{hoveredPoint.index + 1}
            </div>
            <div style={{ fontSize: 12, color: variant === 'analytics' ? '#c4b5fd' : '#c4b5fd', fontWeight: 600 }}>
              {hoveredPoint.date}
            </div>
            
            {/* Resultado da sessão específica */}
            {hoveredPoint.sessionData && (
              <div style={{ 
                marginTop: 8, 
                paddingTop: 8, 
                borderTop: `1px solid ${variant === 'analytics' ? 'rgba(148, 163, 184, 0.2)' : 'rgba(168, 85, 247, 0.2)'}`,
                fontSize: 11,
                color: variant === 'analytics' ? '#94a3b8' : '#a78bfa'
              }}>
                Resultado: <strong style={{ color: hoveredPoint.sessionData.net >= 0 ? '#10b981' : '#ef4444' }}>
                  {hoveredPoint.sessionData.net >= 0 ? '+' : ''}{hoveredPoint.sessionData.net.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </strong>
              </div>
            )}
          </div>
        )}

        {/* Estatísticas abaixo do gráfico */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 20 }}>
          <div style={{ textAlign: 'center', padding: 16, background: 'rgba(16, 185, 129, 0.1)', borderRadius: 10, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: totalProfit >= 0 ? '#10b981' : '#ef4444', marginBottom: 4 }}>
              {totalProfit >= 0 ? '+' : ''}{Math.abs(growthPercent).toFixed(0)}%
            </div>
            <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>Crescimento Total</div>
          </div>
          <div style={{ textAlign: 'center', padding: 16, background: 'rgba(168, 85, 247, 0.1)', borderRadius: 10, border: '1px solid rgba(168, 85, 247, 0.3)' }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#a855f7', marginBottom: 4 }}>
              {positiveMonths}
            </div>
            <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>Sessões Positivas</div>
          </div>
          <div style={{ textAlign: 'center', padding: 16, background: 'rgba(236, 72, 153, 0.1)', borderRadius: 10, border: '1px solid rgba(236, 72, 153, 0.3)' }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#ec4899', marginBottom: 4 }}>
              {avgMonthly >= 1000 ? `R$${(avgMonthly / 1000).toFixed(1)}K` : avgMonthly.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>Média por Sessão</div>
          </div>
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

      {/* 1️⃣ NOVA SESSÃO - FULL WIDTH */}
      <div style={{ padding: '48px 5%', marginBottom: 32, width: '100%' }}>
        <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 32, color: '#f8fafc', textAlign: 'center', textShadow: '0 0 20px rgba(168, 85, 247, 0.3)' }}>
          💰 Nova Sessão
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 800, margin: '0 auto' }}>
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

      {/* 2️⃣ PROGRESSO DA META - FULL WIDTH */}
      {sessions.length > 0 && (
        <div style={{ padding: '48px 5%', marginBottom: 32, width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 12, maxWidth: 1200, margin: '0 auto 32px' }}>
            <h3 style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc', textShadow: '0 0 20px rgba(168, 85, 247, 0.3)' }}>
              🎯 Progresso da Meta (Ciclo #{cycleNumber})
            </h3>
            <div style={{ display: 'flex', gap: 8 }}>
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
              <button
                onClick={() => setShowFinalizeCycleModal(true)}
                disabled={sessions.length === 0}
                style={{
                  padding: '6px 12px',
                  background: sessions.length === 0 ? 'rgba(107, 114, 128, 0.15)' : 'rgba(236, 72, 153, 0.15)',
                  border: `1px solid ${sessions.length === 0 ? 'rgba(107, 114, 128, 0.3)' : 'rgba(236, 72, 153, 0.3)'}`,
                  borderRadius: 8,
                  color: sessions.length === 0 ? '#6b7280' : '#ec4899',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: sessions.length === 0 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => sessions.length > 0 && (e.currentTarget.style.background = 'rgba(236, 72, 153, 0.25)')}
                onMouseLeave={(e) => sessions.length > 0 && (e.currentTarget.style.background = 'rgba(236, 72, 153, 0.15)')}
              >
                🏁 Finalizar Ciclo
              </button>
              {isReallyPremium && (
                <button
                  onClick={() => setShowResetTotalModal(true)}
                  style={{
                    padding: '6px 12px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 8,
                    color: '#ef4444',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
                >
                  🗑️ Reset Total
                </button>
              )}
            </div>
          </div>

          {/* Editor de Meta */}
          {isEditingGoal && (
            <div style={{ marginBottom: 32, padding: 20, background: 'rgba(168, 85, 247, 0.08)', borderRadius: 16, border: '1px solid rgba(168, 85, 247, 0.2)', maxWidth: 400, margin: '0 auto 32px' }}>
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
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <CircularProgressBar 
              percentage={progressPercentage} 
              total={totalAccumulated} 
              goal={userGoal}
              remaining={remainingAmount}
            />
          </div>
          
          {/* Informações da Meta */}
          <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 700, margin: '32px auto 0' }}>
            {/* Texto Principal */}
            <div style={{ fontSize: 16, fontWeight: 700, color: progressPercentage >= 100 ? '#10b981' : '#a855f7', textAlign: 'center' }}>
              {progressPercentage >= 100 ? (
                <>🎉 Meta atingida! Parabéns!</>
              ) : (
                <>{remainingPercentage.toFixed(0)}% faltam para atingir sua meta</>
              )}
            </div>

            {/* Valores */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ padding: 20, background: 'rgba(16, 185, 129, 0.08)', borderRadius: 12, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div style={{ fontSize: 12, color: '#10b981', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>RESULTADO ATUAL</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: totalAccumulated >= 0 ? '#10b981' : '#ef4444' }}>
                  {totalAccumulated >= 0 ? '+' : ''}{totalAccumulated.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              </div>
              <div style={{ padding: 20, background: 'rgba(168, 85, 247, 0.08)', borderRadius: 12, border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                <div style={{ fontSize: 12, color: '#a855f7', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>META DEFINIDA</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#a855f7' }}>
                  {userGoal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              </div>
            </div>

            {/* Quanto falta (se não atingiu) */}
            {progressPercentage < 100 && (
              <div style={{ fontSize: 14, color: '#94a3b8', textAlign: 'center', marginTop: 8 }}>
                Faltam <strong style={{ color: '#a855f7' }}>{remainingAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong> para sua meta
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3️⃣ GRÁFICO DE EVOLUÇÃO - FLUTUANTE FULL WIDTH */}
      {sessions.length > 0 && (
        <div className="chart-floating" style={{ maxWidth: 1400, margin: '0 auto 32px', width: '100%', padding: '0 5%', position: 'relative' }}>
          <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 32, color: '#f8fafc', textAlign: 'center', textShadow: '0 0 20px rgba(168, 85, 247, 0.3)' }}>
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

      {/* PRO Features - Histórico Semanal/Mensal - FULL WIDTH */}
      {isReallyPremium && sessions.length > 0 && (
        <div style={{ padding: '48px 5%', marginBottom: 32, width: '100%' }}>
          <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 32, color: '#f8fafc', textAlign: 'center', textShadow: '0 0 20px rgba(168, 85, 247, 0.3)' }}>
            📈 Histórico PRO
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, maxWidth: 1200, margin: '0 auto' }}>
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

      {/* Modal: Finalizar Ciclo */}
      {showFinalizeCycleModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 20
        }}>
          <div style={{
            background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.98))',
            borderRadius: 16,
            padding: 32,
            maxWidth: 500,
            width: '100%',
            border: '1px solid rgba(236, 72, 153, 0.3)',
            boxShadow: '0 20px 60px rgba(236, 72, 153, 0.3)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🏁</div>
              <h3 style={{ fontSize: 24, fontWeight: 800, color: '#f8fafc', marginBottom: 12 }}>
                Finalizar Ciclo #{cycleNumber}?
              </h3>
              <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6 }}>
                Isso vai <strong style={{ color: '#ec4899' }}>salvar todo o histórico atual</strong> e iniciar um novo ciclo zerado.
                <br />
                Você poderá visualizar este ciclo no histórico.
              </p>
            </div>

            {/* Resumo do ciclo */}
            <div style={{ 
              background: 'rgba(168, 85, 247, 0.1)', 
              borderRadius: 12, 
              padding: 16, 
              marginBottom: 24,
              border: '1px solid rgba(168, 85, 247, 0.3)'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Total</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: totalAccumulated >= 0 ? '#10b981' : '#ef4444' }}>
                    {totalAccumulated >= 0 ? '+' : ''}{totalAccumulated.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Progresso</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#a855f7' }}>
                    {progressPercentage.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Sessões</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#ec4899' }}>
                    {sessions.length}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Meta</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#f472b6' }}>
                    {userGoal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                </div>
              </div>
            </div>

            {/* Botões */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowFinalizeCycleModal(false)}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  background: 'rgba(107, 114, 128, 0.2)',
                  border: '1px solid rgba(107, 114, 128, 0.4)',
                  borderRadius: 10,
                  color: '#94a3b8',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(107, 114, 128, 0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(107, 114, 128, 0.2)'}
              >
                Cancelar
              </button>
              <button
                onClick={handleFinalizeCycle}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  background: 'linear-gradient(145deg, rgba(236, 72, 153, 0.9), rgba(219, 39, 119, 0.9))',
                  border: 'none',
                  borderRadius: 10,
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 20px rgba(236, 72, 153, 0.4)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 30px rgba(236, 72, 153, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(236, 72, 153, 0.4)';
                }}
              >
                🏁 Finalizar e Iniciar Novo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Reset Total (PRO) */}
      {showResetTotalModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 20
        }}>
          <div style={{
            background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.98))',
            borderRadius: 16,
            padding: 32,
            maxWidth: 500,
            width: '100%',
            border: '2px solid rgba(239, 68, 68, 0.5)',
            boxShadow: '0 20px 60px rgba(239, 68, 68, 0.5)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>⚠️</div>
              <h3 style={{ fontSize: 24, fontWeight: 800, color: '#ef4444', marginBottom: 12 }}>
                ATENÇÃO: Reset Total
              </h3>
              <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6, marginBottom: 16 }}>
                Esta ação é <strong style={{ color: '#ef4444' }}>IRREVERSÍVEL</strong>!
                <br />
                <br />
                Você vai <strong style={{ color: '#ef4444' }}>DELETAR PERMANENTEMENTE</strong>:
              </p>
              <ul style={{ textAlign: 'left', fontSize: 14, color: '#f8fafc', lineHeight: 2, marginBottom: 16 }}>
                <li>✖️ Todas as sessões do ciclo atual</li>
                <li>✖️ Todos os {completedCycles.length} ciclos completados</li>
                <li>✖️ Todo o histórico de progresso</li>
              </ul>
              <p style={{ fontSize: 13, color: '#6b7280', fontStyle: 'italic' }}>
                (Apenas usuários PRO têm acesso a esta função)
              </p>
            </div>

            {/* Confirmação de segurança */}
            <div style={{ 
              background: 'rgba(239, 68, 68, 0.1)', 
              borderRadius: 12, 
              padding: 16, 
              marginBottom: 24,
              border: '1px solid rgba(239, 68, 68, 0.3)'
            }}>
              <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8, fontWeight: 600 }}>
                ⚡ Dados que serão perdidos:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ fontSize: 11, color: '#6b7280' }}>
                  Sessões atuais: <strong style={{ color: '#ef4444' }}>{sessions.length}</strong>
                </div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>
                  Ciclos salvos: <strong style={{ color: '#ef4444' }}>{completedCycles.length}</strong>
                </div>
              </div>
            </div>

            {/* Botões */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowResetTotalModal(false)}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  background: 'rgba(107, 114, 128, 0.2)',
                  border: '1px solid rgba(107, 114, 128, 0.4)',
                  borderRadius: 10,
                  color: '#94a3b8',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(107, 114, 128, 0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(107, 114, 128, 0.2)'}
              >
                ← Cancelar (Recomendado)
              </button>
              <button
                onClick={handleResetTotal}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  background: 'linear-gradient(145deg, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.9))',
                  border: 'none',
                  borderRadius: 10,
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 20px rgba(239, 68, 68, 0.5)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 30px rgba(239, 68, 68, 0.7)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(239, 68, 68, 0.5)';
                }}
              >
                🗑️ Deletar Tudo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4️⃣ HISTÓRICO DE SESSÕES (Removido - substituído por gráfico) */}
    </div>
  );
}
