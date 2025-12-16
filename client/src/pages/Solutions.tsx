import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HandMatrix, { HandData, HandAction } from '../components/HandMatrix';
import ActionPanel, { ActionData } from '../components/ActionPanel';
import RangeBar, { RangeSegment } from '../components/RangeBar';
import SelectedHands, { SelectedHandData } from '../components/SelectedHands';
import PositionTabs, { Position } from '../components/PositionTabs';
import { useAuth } from '../contexts/AuthContext';

// Mock data generator for positions
function generateMockRangeData(position: Position): HandData[] {
  const allHands: string[] = [];
  
  // Generate all possible hands
  const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
  
  for (let i = 0; i < ranks.length; i++) {
    for (let j = i; j < ranks.length; j++) {
      if (i === j) {
        // Pocket pairs
        allHands.push(`${ranks[i]}${ranks[j]}`);
      } else {
        // Suited and offsuit
        allHands.push(`${ranks[i]}${ranks[j]}s`);
        allHands.push(`${ranks[i]}${ranks[j]}o`);
      }
    }
  }

  // Define ranges based on position (simplified GTO-like ranges)
  const ranges: Record<Position, { allin: string[], raise: string[], call: string[], fold: string[] }> = {
    UTG: {
      allin: ['AA', 'KK', 'QQ'],
      raise: ['JJ', 'TT', '99', 'AKs', 'AKo', 'AQs', 'AJs', 'KQs'],
      call: ['88', '77', 'AQo', 'AJo', 'ATs', 'KJs', 'KTs', 'QJs'],
      fold: [] // Rest are folds
    },
    HJ: {
      allin: ['AA', 'KK', 'QQ'],
      raise: ['JJ', 'TT', '99', '88', 'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'AJo', 'ATs', 'KQs', 'KJs'],
      call: ['77', '66', 'A9s', 'KQo', 'KTs', 'QJs', 'QTs', 'JTs'],
      fold: []
    },
    CO: {
      allin: ['AA', 'KK', 'QQ', 'JJ'],
      raise: ['TT', '99', '88', '77', 'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'AJo', 'ATs', 'A9s', 'KQs', 'KQo', 'KJs', 'KTs', 'QJs'],
      call: ['66', '55', 'A8s', 'A7s', 'KJo', 'K9s', 'QTs', 'QJo', 'JTs', 'J9s', 'T9s'],
      fold: []
    },
    BTN: {
      allin: ['AA', 'KK', 'QQ', 'JJ', 'TT'],
      raise: ['99', '88', '77', '66', '55', 'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'AJo', 'ATs', 'ATo', 'A9s', 'A8s', 'A7s', 'KQs', 'KQo', 'KJs', 'KJo', 'KTs', 'K9s', 'QJs', 'QJo', 'QTs', 'JTs', 'T9s'],
      call: ['44', '33', '22', 'A6s', 'A5s', 'A4s', 'K8s', 'K7s', 'Q9s', 'J9s', 'T8s', '98s'],
      fold: []
    },
    SB: {
      allin: ['AA', 'KK', 'QQ', 'JJ'],
      raise: ['TT', '99', '88', '77', 'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'AJo', 'ATs', 'A9s', 'KQs', 'KQo', 'KJs', 'KTs', 'QJs', 'QTs', 'JTs'],
      call: ['66', '55', '44', 'A8s', 'A7s', 'A6s', 'KJo', 'K9s', 'QJo', 'Q9s', 'J9s', 'T9s', '98s'],
      fold: []
    },
    BB: {
      allin: ['AA', 'KK'],
      raise: ['QQ', 'JJ', 'TT', 'AKs', 'AKo'],
      call: ['99', '88', '77', '66', '55', '44', '33', '22', 'AQs', 'AQo', 'AJs', 'AJo', 'ATs', 'ATo', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'KQs', 'KQo', 'KJs', 'KJo', 'KTs', 'K9s', 'QJs', 'QJo', 'QTs', 'JTs', 'T9s'],
      fold: []
    }
  };

  const positionRange = ranges[position];
  const handDataArray: HandData[] = [];

  allHands.forEach(hand => {
    let action: HandAction = 'fold';
    
    if (positionRange.allin.includes(hand)) action = 'allin';
    else if (positionRange.raise.includes(hand)) action = 'raise';
    else if (positionRange.call.includes(hand)) action = 'call';

    handDataArray.push({ hand, action });
  });

  return handDataArray;
}

// Detectar ambiente automaticamente
function getApiBase(): string {
  if (import.meta && (import.meta as any).env && (import.meta as any).env.VITE_API_BASE) {
    return (import.meta as any).env.VITE_API_BASE;
  }
  if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
    return 'https://pokerwizard.onrender.com';
  }
  return 'http://localhost:3000';
}
const API_BASE = getApiBase();

export default function Solutions() {
  const { user, token, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [activePosition, setActivePosition] = useState<Position>('BTN');
  const [hands, setHands] = useState<HandData[]>([]);
  const [selectedHandsList, setSelectedHandsList] = useState<string[]>([]);
  const [aiMode, setAiMode] = useState(true); // IA ativa por padrão
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [handHistory, setHandHistory] = useState<string>('');
  const [showAiTooltip, setShowAiTooltip] = useState(false);

  // Controle de usos - Análise de Mãos tem 5 usos gratuitos
  const usosAnalise = (user as any)?.usosAnalise ?? 5;
  const isPremium = user?.premium || (user as any)?.statusPlano === 'premium';
  const canUse = isPremium || usosAnalise > 0;

  const positions: Position[] = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];

  // Load range data when position changes
  useEffect(() => {
    const rangeData = generateMockRangeData(activePosition);
    setHands(rangeData);
    setSelectedHandsList([]); // Clear selection on position change
  }, [activePosition]);

  // Calculate action statistics
  const actionStats: ActionData[] = React.useMemo(() => {
    const total = hands.length;
    const counts = {
      allin: hands.filter(h => h.action === 'allin').length,
      raise: hands.filter(h => h.action === 'raise').length,
      call: hands.filter(h => h.action === 'call').length,
      fold: hands.filter(h => h.action === 'fold').length,
    };

    return [
      {
        name: 'All-in',
        percentage: Math.round((counts.allin / total) * 100),
        combos: counts.allin,
        color: 'border-red-500',
        bgColor: 'bg-red-600',
      },
      {
        name: 'Raise 2.5x',
        percentage: Math.round((counts.raise / total) * 100),
        combos: counts.raise,
        color: 'border-orange-500',
        bgColor: 'bg-orange-600',
      },
      {
        name: 'Call',
        percentage: Math.round((counts.call / total) * 100),
        combos: counts.call,
        color: 'border-green-500',
        bgColor: 'bg-green-600',
      },
      {
        name: 'Fold',
        percentage: Math.round((counts.fold / total) * 100),
        combos: counts.fold,
        color: 'border-blue-500',
        bgColor: 'bg-blue-600',
      },
    ];
  }, [hands]);

  // Range bar segments
  const rangeSegments: RangeSegment[] = React.useMemo(() => {
    return [
      { action: 'All-in', percentage: actionStats[0].percentage, color: 'bg-red-600' },
      { action: 'Raise', percentage: actionStats[1].percentage, color: 'bg-orange-600' },
      { action: 'Call', percentage: actionStats[2].percentage, color: 'bg-green-600' },
      { action: 'Fold', percentage: actionStats[3].percentage, color: 'bg-blue-600' },
    ];
  }, [actionStats]);

  // Selected hands with action percentages
  const selectedHandsData: SelectedHandData[] = React.useMemo(() => {
    return selectedHandsList.map(handName => {
      const handData = hands.find(h => h.hand === handName);
      
      // Mock action distribution for selected hand
      const actions = [
        { action: 'All-in', percentage: handData?.action === 'allin' ? 100 : 0, color: 'bg-red-600' },
        { action: 'Raise', percentage: handData?.action === 'raise' ? 100 : 0, color: 'bg-orange-600' },
        { action: 'Call', percentage: handData?.action === 'call' ? 100 : 0, color: 'bg-green-600' },
        { action: 'Fold', percentage: handData?.action === 'fold' ? 100 : 0, color: 'bg-blue-600' },
      ].filter(a => a.percentage > 0);

      return {
        hand: handName,
        actions,
      };
    });
  }, [selectedHandsList, hands]);

  const handleHandClick = (hand: string) => {
    setSelectedHandsList(prev => {
      if (prev.includes(hand)) {
        return prev.filter(h => h !== hand);
      } else {
        return [...prev, hand];
      }
    });
  };

  const handleRemoveHand = (hand: string) => {
    setSelectedHandsList(prev => prev.filter(h => h !== hand));
  };

  // Análise do histórico de mão digitado
  const handleAIAnalysis = async () => {
    if (!handHistory.trim()) {
      setAiAnalysis('⚠️ Digite ou cole o histórico da mão para analisar!');
      return;
    }

    // Verificar se pode usar
    if (!canUse) {
      setAiAnalysis('💎 Você atingiu o limite de 5 análises gratuitas.\n\nAssine o Premium para análises ilimitadas!');
      return;
    }

    setLoadingAI(true);
    
    // Se IA não está ativa, análise básica
    if (!aiMode) {
      setAiAnalysis('🎯 Análise Básica\n\nPara receber análise completa com GTO, ative a IA no botão acima.');
      setTimeout(() => setLoadingAI(false), 800);
      return;
    }

    setAiAnalysis('🤖 Analisando com IA...');

    try {
      // Chama a API de análise (que vai consumir o uso)
      const response = await fetch(`${API_BASE}/api/ai/analyze`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          history: handHistory,
          fileName: 'manual_input',
        }),
      });

      const data = await response.json();
      
      // Verificar se acabaram os usos
      if (data.error === 'no_credits') {
        setAiAnalysis('💎 Você atingiu o limite de 5 análises gratuitas.\n\nAssine o Premium para análises ilimitadas!');
        if (refreshUser) await refreshUser();
        return;
      }
      
      if (data.ok && data.analysis) {
        setAiAnalysis(data.analysis);
        // Atualiza os usos restantes
        if (refreshUser) await refreshUser();
      } else {
        setAiAnalysis(data.error || '❌ Erro ao analisar. Tente novamente.');
      }
    } catch (error) {
      console.error('AI Analysis error:', error);
      setAiAnalysis('❌ Erro de conexão. Verifique sua internet e tente novamente.');
    } finally {
      setLoadingAI(false);
    }
  };

  // Análise das mãos selecionadas no matrix
  const handleMatrixAnalysis = async () => {
    if (selectedHandsList.length === 0) {
      setAiAnalysis('⚠️ Selecione pelo menos uma mão no matrix para analisar!');
      return;
    }

    setLoadingAI(true);
    setAiAnalysis('🤖 Analisando mãos selecionadas...');

    try {
      const rangeData = hands.map(h => ({ hand: h.hand, action: h.action }));
      
      const response = await fetch(`${API_BASE}/api/gto/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          position: activePosition,
          hands: selectedHandsList,
          rangeData: rangeData,
        }),
      });

      const data = await response.json();
      
      if (data.ok && data.analysis) {
        setAiAnalysis(data.analysis);
      } else {
        setAiAnalysis(data.error || '❌ Erro ao analisar. Tente novamente.');
      }
    } catch (error) {
      console.error('Matrix Analysis error:', error);
      setAiAnalysis('❌ Erro de conexão. Verifique sua internet e tente novamente.');
    } finally {
      setLoadingAI(false);
    }
  };

  // Tela de bloqueio quando acabam os usos
  if (user && !canUse) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-gray-800/80 border border-purple-500/30 rounded-2xl p-10 text-center backdrop-blur-xl">
          <div className="text-6xl mb-6">💎</div>
          <h2 className="text-2xl font-bold text-white mb-4">Trial Finalizado</h2>
          <p className="text-gray-400 mb-2">
            Você utilizou suas <strong className="text-white">5 análises gratuitas</strong>.
          </p>
          <p className="text-gray-500 text-sm mb-8">
            Para continuar analisando suas mãos com IA, assine o plano Premium.
          </p>
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-5 mb-6">
            <div className="text-3xl font-bold text-purple-400 mb-1">
              R$ 5,90<span className="text-sm font-normal">/mês</span>
            </div>
            <div className="text-xs text-gray-500">Análises ilimitadas • Cancele quando quiser</div>
          </div>
          <button
            onClick={() => navigate('/premium')}
            className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-bold text-lg hover:opacity-90 transition-all"
          >
            ⚡ Desbloquear Acesso Premium
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
                📊 Análise de Mãos
              </h1>
              <p className="text-gray-400 text-sm">
                Analise ranges por posição ou cole uma mão para análise completa
              </p>
            </div>
            <div className="flex items-center gap-4">
              {user && !isPremium && usosAnalise <= 0 && (
                <button
                  onClick={() => navigate('/premium')}
                  className="px-5 py-2 rounded-lg font-bold text-sm"
                  style={{
                    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                    color: '#000',
                    border: 'none',
                    boxShadow: '0 4px 20px rgba(251, 191, 36, 0.4)',
                  }}
                >
                  👑 Assinar Premium
                </button>
              )}
              {user && isPremium && (
                <div className="px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <span className="text-green-400 font-semibold text-xs">♾️ PREMIUM</span>
                </div>
              )}
              {user && (
                <div className="text-right">
                  <div className="text-sm text-gray-400">Olá,</div>
                  <div className="text-white font-semibold">{user.name}</div>
                </div>
              )}
            </div>
          </div>

          {/* Action Card - Analisar Mão Específica */}
          <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 border border-gray-700/50 rounded-2xl p-8 mb-6 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">Analisar Situação</h3>
                <p className="text-gray-400 text-sm">Cole o histórico ou descreva a mão</p>
              </div>
              {/* Toggle IA */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 font-medium">IA Avançada</span>
                <button
                  onClick={() => setAiMode(!aiMode)}
                  className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
                    aiMode ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gray-700'
                  }`}
                  style={{ boxShadow: aiMode ? '0 0 20px rgba(168, 85, 247, 0.4)' : 'none' }}
                >
                  <div
                    className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${
                      aiMode ? 'translate-x-7' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
            
            <textarea
              value={handHistory}
              onChange={(e) => setHandHistory(e.target.value)}
              placeholder="Exemplo: UTG raises 2.5bb, Hero no BTN com AKs decide 3bet para 7.5bb..."
              className="w-full bg-gray-800/60 border border-gray-600/50 rounded-xl p-4 text-white text-sm resize-none focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
              rows={4}
              style={{ fontFamily: 'inherit' }}
            />
            
            <div className="flex items-center gap-3 mt-5">
              {/* Botão Principal - Estilo GTO Wizard */}
              <button
                onClick={handleAIAnalysis}
                disabled={loadingAI || !handHistory.trim()}
                className="group relative flex-1 overflow-hidden"
                style={{
                  padding: '16px 28px',
                  background: loadingAI || !handHistory.trim()
                    ? 'linear-gradient(135deg, #4b5563, #374151)'
                    : 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '15px',
                  letterSpacing: '0.3px',
                  borderRadius: '14px',
                  border: 'none',
                  cursor: loadingAI || !handHistory.trim() ? 'not-allowed' : 'pointer',
                  boxShadow: loadingAI || !handHistory.trim()
                    ? 'none'
                    : '0 4px 20px rgba(139, 92, 246, 0.35)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: 'scale(1)',
                }}
                onMouseEnter={(e) => {
                  if (!loadingAI && handHistory.trim()) {
                    e.currentTarget.style.transform = 'translateY(-2px) scale(1.01)';
                    e.currentTarget.style.boxShadow = '0 8px 30px rgba(139, 92, 246, 0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = loadingAI || !handHistory.trim()
                    ? 'none'
                    : '0 4px 20px rgba(139, 92, 246, 0.35)';
                }}
              >
                <span className="flex items-center justify-center gap-2">
                  {loadingAI ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Analisando...
                    </>
                  ) : (
                    <>
                      <span className="text-lg">⚡</span>
                      Rodar Análise
                    </>
                  )}
                </span>
              </button>

              {handHistory && (
                <button
                  onClick={() => {
                    setHandHistory('');
                    setAiAnalysis('');
                  }}
                  className="px-5 py-4 bg-gray-700/50 hover:bg-gray-600/60 text-gray-300 hover:text-white rounded-xl transition-all duration-200 border border-gray-600/30 hover:border-gray-500/50"
                  style={{ fontWeight: 500, fontSize: '14px' }}
                >
                  Limpar
                </button>
              )}
            </div>

            {/* Resultado da Análise */}
            {aiAnalysis && (
              <div className="mt-6 bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 rounded-xl p-5 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">💡</span>
                  <span className="text-sm font-semibold text-gray-300">Resultado</span>
                </div>
                <div className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{aiAnalysis}</div>
              </div>
            )}
          </div>

          {/* Seção de Ranges */}
          <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 border border-gray-700/50 rounded-2xl p-8 mb-6 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  🎯 Ranges por Posição
                </h3>
                <p className="text-gray-400 text-sm mt-1">Selecione uma posição e explore as mãos recomendadas</p>
              </div>
            </div>
          
            {/* Position Tabs */}
            <PositionTabs
              positions={positions}
              activePosition={activePosition}
              onPositionChange={setActivePosition}
              aiMode={aiMode}
            />
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Hand Matrix (70%) */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-xl shadow-2xl p-6 border border-gray-700">
              <HandMatrix
                hands={hands}
                onHandClick={handleHandClick}
                selectedHands={selectedHandsList}
              />
            </div>
          </div>

          {/* Right Column - Actions and Selected Hands (30%) */}
          <div className="space-y-6">
            {/* Action Panel */}
            <div className="bg-gray-800 rounded-xl shadow-2xl p-6 border border-gray-700">
              <ActionPanel actions={actionStats} />
            </div>

            {/* Range Bar */}
            <div className="bg-gray-800 rounded-xl shadow-2xl p-6 border border-gray-700">
              <RangeBar segments={rangeSegments} />
            </div>

            {/* Selected Hands */}
            <div className="bg-gray-800 rounded-xl shadow-2xl p-6 border border-gray-700 max-h-96 overflow-y-auto">
              <SelectedHands
                selectedHands={selectedHandsData}
                onRemoveHand={handleRemoveHand}
              />
            </div>
          </div>
        </div>

        {/* AI Analysis Section */}
        {aiMode && (
          <div className="mt-6 bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-xl shadow-2xl p-6 border border-purple-500/30">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>🤖</span>
                Análise IA - {activePosition}
              </h2>
              <button
                onClick={handleMatrixAnalysis}
                disabled={loadingAI || selectedHandsList.length === 0}
                className={`group relative px-8 py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider transition-all duration-300 overflow-hidden ${
                  loadingAI || selectedHandsList.length === 0
                    ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed border border-gray-600/50'
                    : 'bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 text-white hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/40 border border-cyan-400/50 active:scale-95'
                }`}
              >
                {/* Animated background glow */}
                {!loadingAI && selectedHandsList.length > 0 && (
                  <span className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-500" />
                )}
                
                {/* Shine effect */}
                {!loadingAI && selectedHandsList.length > 0 && (
                  <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                )}
                
                <span className="relative flex items-center gap-2">
                  {loadingAI ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Analisando...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      Analisar {selectedHandsList.length} Mão{selectedHandsList.length !== 1 ? 's' : ''}
                    </>
                  )}
                </span>
              </button>
            </div>
            
            {aiAnalysis && (
              <div className="bg-gray-900/50 rounded-lg p-4 border border-purple-500/20">
                <p className="text-gray-200 whitespace-pre-wrap leading-relaxed">{aiAnalysis}</p>
              </div>
            )}
            
            {!aiAnalysis && (
              <div className="text-center text-gray-400 py-8">
                <p className="text-lg">Selecione mãos no matrix e clique em "Analisar" para receber insights da IA!</p>
                <p className="text-sm mt-2">A IA vai explicar as melhores jogadas para cada situação 🚀</p>
              </div>
            )}
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Ranges baseados em estratégia GTO (Game Theory Optimal) + Análise com IA</p>
          <p className="mt-1">Clique nas mãos para ver detalhes • Ative a IA para análises profundas</p>
        </div>
      </div>
    </div>
  );
}
