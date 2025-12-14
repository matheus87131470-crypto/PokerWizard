import React, { useState, useEffect } from 'react';
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
  const { user } = useAuth();
  const [activePosition, setActivePosition] = useState<Position>('BTN');
  const [hands, setHands] = useState<HandData[]>([]);
  const [selectedHandsList, setSelectedHandsList] = useState<string[]>([]);
  const [aiMode, setAiMode] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [handHistory, setHandHistory] = useState<string>('');

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

  const handleAIAnalysis = async () => {
    if (!handHistory.trim()) {
      setAiAnalysis('⚠️ Digite ou cole o histórico da mão para analisar!');
      return;
    }

    setLoadingAI(true);
    setAiAnalysis('🤖 Analisando com IA...');

    try {
      const response = await fetch(`${API_BASE}/api/gto/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          handHistory: handHistory,
          position: activePosition,
        }),
      });

      const data = await response.json();
      
      if (data.ok && data.analysis) {
        setAiAnalysis(data.analysis);
      } else {
        setAiAnalysis('❌ Erro ao analisar. Tente novamente.');
      }
    } catch (error) {
      console.error('AI Analysis error:', error);
      setAiAnalysis('❌ Erro de conexão com IA. Verifique sua internet.');
    } finally {
      setLoadingAI(false);
    }
  };

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
            {user && (
              <div className="text-right">
                <div className="text-sm text-gray-400">Olá,</div>
                <div className="text-white font-semibold">{user.name}</div>
              </div>
            )}
          </div>

          {/* Action Card - Analisar Mão Específica */}
          <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 border border-purple-500/30 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">✍️</span>
              <div>
                <h3 className="text-xl font-bold text-white">Analisar Mão Específica</h3>
                <p className="text-gray-400 text-xs">Cole o histórico ou descreva a situação</p>
              </div>
            </div>
            <textarea
              value={handHistory}
              onChange={(e) => setHandHistory(e.target.value)}
              placeholder="Exemplo: UTG raises 2.5bb, Hero no BTN com AKs decide 3bet para 7.5bb..."
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-4 text-white text-sm resize-none focus:border-purple-500 focus:outline-none transition-colors"
              rows={4}
            />
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={handleAIAnalysis}
                disabled={loadingAI || !handHistory.trim()}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3 rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingAI ? '🤖 Analisando...' : '🚀 Analisar com IA'}
              </button>
              {handHistory && (
                <button
                  onClick={() => setHandHistory('')}
                  className="px-4 py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Limpar
                </button>
              )}
            </div>
            {aiAnalysis && (
              <div className="mt-4 bg-gray-800/50 border border-purple-500/30 rounded-lg p-4">
                <div className="text-sm text-gray-300 whitespace-pre-wrap">{aiAnalysis}</div>
              </div>
            )}
          </div>

          {/* Seção de Ranges */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  🎯 Ranges por Posição
                </h3>
                <p className="text-gray-400 text-xs mt-1">Clique nas mãos da matriz abaixo para ver detalhes</p>
              </div>
              <button
                onClick={() => setAiMode(!aiMode)}
                className={`px-6 py-2 font-semibold rounded-lg transition-all ${
                  aiMode 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/50' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {aiMode ? '✅ IA Ativa' : '🤖 Ativar IA'}
              </button>
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
                onClick={handleAIAnalysis}
                disabled={loadingAI || selectedHandsList.length === 0}
                className={`px-6 py-3 rounded-lg font-bold transition-all ${
                  loadingAI || selectedHandsList.length === 0
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/50'
                }`}
              >
                {loadingAI ? '⏳ Analisando...' : `✨ Analisar ${selectedHandsList.length} mão${selectedHandsList.length !== 1 ? 's' : ''}`}
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
