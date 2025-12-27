/**
 * BLACKJACK CARD COUNTING TRAINER - Sistema Hi-Lo
 * 
 * MVP: Treinamento profissional de contagem de cartas
 * Sistema Hi-Lo: 2-6 = +1 | 7-9 = 0 | 10-A = -1
 * 
 * Modos:
 * - AUTO: Sistema mostra cartas automaticamente
 * - TRAIN: Usuário identifica a carta e valida contagem
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// ===== TIPOS =====
type TrainingMode = 'SETUP' | 'AUTO' | 'TRAIN' | 'RESULTS';
type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';
type Suit = '♠' | '♥' | '♦' | '♣';

interface Card {
  rank: Rank;
  suit: Suit;
  hiLoValue: number;
}

interface TrainingStats {
  totalCards: number;
  correctCounts: number;
  wrongCounts: number;
  accuracy: number;
  startTime: number;
  endTime?: number;
}

interface SessionConfig {
  mode: 'AUTO' | 'TRAIN';
  deckCount: number;
  speedMs: number; // Para modo AUTO
  totalCards: number;
}

// ===== CONSTANTES =====
const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const SUITS: Suit[] = ['♠', '♥', '♦', '♣'];

// Sistema Hi-Lo
const HI_LO_VALUES: Record<Rank, number> = {
  '2': 1, '3': 1, '4': 1, '5': 1, '6': 1,
  '7': 0, '8': 0, '9': 0,
  '10': -1, 'J': -1, 'Q': -1, 'K': -1, 'A': -1,
};

// ===== FUNÇÕES UTILITÁRIAS =====
function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        rank,
        suit,
        hiLoValue: HI_LO_VALUES[rank],
      });
    }
  }
  return deck;
}

function createShoe(deckCount: number): Card[] {
  const shoe: Card[] = [];
  for (let i = 0; i < deckCount; i++) {
    shoe.push(...createDeck());
  }
  return shuffleArray(shoe);
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function calculateTrueCount(runningCount: number, decksRemaining: number): number {
  if (decksRemaining <= 0) return 0;
  return Math.round((runningCount / decksRemaining) * 10) / 10;
}

// ===== COMPONENTES VISUAIS =====
function CasinoCard({ 
  card, 
  isFaceDown = false,
  onClick,
  isAnimating = false,
}: { 
  card?: Card; 
  isFaceDown?: boolean;
  onClick?: () => void;
  isAnimating?: boolean;
}) {
  if (isFaceDown || !card) {
    return (
      <div 
        style={{
          width: 100,
          height: 140,
          background: 'linear-gradient(135deg, #1e3a8a, #1e40af)',
          borderRadius: 12,
          border: '3px solid #3b82f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 48,
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          cursor: onClick ? 'pointer' : 'default',
          transition: 'transform 0.2s',
          position: 'relative',
          overflow: 'hidden',
        }}
        onClick={onClick}
      >
        {/* Pattern de fundo */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.03) 10px, rgba(255,255,255,0.03) 20px)',
        }} />
        <span style={{ color: '#60a5fa', fontSize: 56, opacity: 0.5 }}>🂠</span>
      </div>
    );
  }

  const isRed = card.suit === '♥' || card.suit === '♦';
  
  return (
    <div 
      style={{
        width: 100,
        height: 140,
        background: '#fff',
        borderRadius: 12,
        border: '3px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        transform: isAnimating ? 'scale(1.1) rotateY(10deg)' : 'scale(1)',
        animation: isAnimating ? 'cardPop 0.5s ease-out' : 'none',
      }}
      onClick={onClick}
    >
      {/* Rank no canto superior esquerdo */}
      <div style={{
        position: 'absolute',
        top: 8,
        left: 10,
        fontSize: 20,
        fontWeight: 900,
        color: isRed ? '#ef4444' : '#1e293b',
      }}>
        {card.rank}
      </div>
      
      {/* Naipe principal */}
      <div style={{
        fontSize: 52,
        fontWeight: 700,
        color: isRed ? '#ef4444' : '#1e293b',
      }}>
        {card.suit}
      </div>

      {/* Rank no canto inferior direito (invertido) */}
      <div style={{
        position: 'absolute',
        bottom: 8,
        right: 10,
        fontSize: 20,
        fontWeight: 900,
        color: isRed ? '#ef4444' : '#1e293b',
        transform: 'rotate(180deg)',
      }}>
        {card.rank}
      </div>
    </div>
  );
}

function CounterDisplay({ 
  runningCount, 
  trueCount, 
  decksRemaining 
}: { 
  runningCount: number; 
  trueCount: number;
  decksRemaining: number;
}) {
  const countColor = runningCount > 0 ? '#10b981' : runningCount < 0 ? '#ef4444' : '#94a3b8';
  
  return (
    <div style={{
      display: 'flex',
      gap: 24,
      padding: '24px 32px',
      background: 'rgba(15, 23, 42, 0.95)',
      borderRadius: 16,
      border: '2px solid rgba(139, 92, 246, 0.4)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    }}>
      {/* Running Count */}
      <div style={{ flex: 1, textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8, fontWeight: 600 }}>
          Running Count
        </div>
        <div style={{
          fontSize: 48,
          fontWeight: 900,
          color: countColor,
          fontFamily: 'monospace',
          textShadow: `0 0 20px ${countColor}80`,
        }}>
          {runningCount >= 0 ? '+' : ''}{runningCount}
        </div>
      </div>

      {/* True Count */}
      <div style={{ flex: 1, textAlign: 'center', borderLeft: '1px solid rgba(139, 92, 246, 0.3)', paddingLeft: 24 }}>
        <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8, fontWeight: 600 }}>
          True Count
        </div>
        <div style={{
          fontSize: 36,
          fontWeight: 700,
          color: '#8b5cf6',
          fontFamily: 'monospace',
        }}>
          {trueCount >= 0 ? '+' : ''}{trueCount.toFixed(1)}
        </div>
      </div>

      {/* Decks Remaining */}
      <div style={{ flex: 1, textAlign: 'center', borderLeft: '1px solid rgba(139, 92, 246, 0.3)', paddingLeft: 24 }}>
        <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8, fontWeight: 600 }}>
          Baralhos Restantes
        </div>
        <div style={{
          fontSize: 32,
          fontWeight: 700,
          color: '#60a5fa',
          fontFamily: 'monospace',
        }}>
          {decksRemaining.toFixed(1)}
        </div>
      </div>
    </div>
  );
}

// ===== FASE 1: SETUP =====
function SetupScreen({ 
  config, 
  setConfig, 
  onStart 
}: { 
  config: SessionConfig;
  setConfig: (config: SessionConfig) => void;
  onStart: () => void;
}) {
  return (
    <div style={{ maxWidth: 700, margin: '40px auto', padding: '20px' }}>
      {/* Aviso Legal */}
      <div style={{
        marginBottom: 32,
        padding: 24,
        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(15, 23, 42, 0.95))',
        border: '2px solid #ef4444',
        borderRadius: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <span style={{ fontSize: 32 }}>⚠️</span>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#ef4444', margin: 0 }}>
            Aviso Legal - Conteúdo Educacional
          </h3>
        </div>
        <p style={{ color: '#fca5a5', fontSize: 13, lineHeight: 1.7, margin: 0 }}>
          Este é um simulador educacional de contagem de cartas. Não incentivamos nem apoiamos jogos de azar. 
          A contagem de cartas é legal, mas cassinos podem proibir jogadores que a utilizem. 
          Use este conhecimento apenas para fins educacionais.
        </p>
      </div>

      <h1 style={{ 
        fontSize: 36, 
        fontWeight: 700, 
        marginBottom: 16, 
        textAlign: 'center',
        background: 'linear-gradient(135deg, #f8fafc, #8b5cf6)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}>
        ♠️ Card Counting Trainer
      </h1>
      <p style={{ textAlign: 'center', color: '#94a3b8', marginBottom: 40, fontSize: 15 }}>
        Aprenda o sistema Hi-Lo de contagem de cartas no Blackjack
      </p>

      <div className="card" style={{ padding: 40, marginBottom: 32 }}>
        {/* Modo de Treinamento */}
        <label style={{ display: 'block', marginBottom: 32 }}>
          <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 12, fontWeight: 600 }}>
            Modo de Treinamento
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <button
              onClick={() => setConfig({ ...config, mode: 'AUTO' })}
              style={{
                padding: '20px',
                background: config.mode === 'AUTO' ? 'linear-gradient(135deg, #8b5cf6, #a855f7)' : '#334155',
                border: config.mode === 'AUTO' ? '2px solid #a855f7' : '1px solid #475569',
                borderRadius: 12,
                color: '#fff',
                fontSize: 14,
                fontWeight: config.mode === 'AUTO' ? 700 : 500,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 8 }}>🎬</div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Modo Automático</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>Cartas aparecem automaticamente</div>
            </button>
            <button
              onClick={() => setConfig({ ...config, mode: 'TRAIN' })}
              style={{
                padding: '20px',
                background: config.mode === 'TRAIN' ? 'linear-gradient(135deg, #10b981, #059669)' : '#334155',
                border: config.mode === 'TRAIN' ? '2px solid #10b981' : '1px solid #475569',
                borderRadius: 12,
                color: '#fff',
                fontSize: 14,
                fontWeight: config.mode === 'TRAIN' ? 700 : 500,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 8 }}>🎯</div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Modo Treino</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>Você identifica as cartas</div>
            </button>
          </div>
        </label>

        {/* Número de Baralhos */}
        <label style={{ display: 'block', marginBottom: 32 }}>
          <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 12, fontWeight: 600 }}>
            Número de Baralhos no Shoe
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[1, 2, 4, 6, 8].map(count => (
              <button
                key={count}
                onClick={() => setConfig({ ...config, deckCount: count })}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: config.deckCount === count ? '#3b82f6' : '#334155',
                  border: 'none',
                  borderRadius: 10,
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: config.deckCount === count ? 700 : 500,
                  cursor: 'pointer',
                }}
              >
                {count}
              </button>
            ))}
          </div>
        </label>

        {/* Velocidade (apenas para AUTO) */}
        {config.mode === 'AUTO' && (
          <label style={{ display: 'block', marginBottom: 32 }}>
            <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 12, fontWeight: 600 }}>
              Velocidade das Cartas
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              {[
                { label: 'Lento', ms: 2000 },
                { label: 'Médio', ms: 1000 },
                { label: 'Rápido', ms: 500 },
              ].map(({ label, ms }) => (
                <button
                  key={ms}
                  onClick={() => setConfig({ ...config, speedMs: ms })}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: config.speedMs === ms ? '#f59e0b' : '#334155',
                    border: 'none',
                    borderRadius: 10,
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: config.speedMs === ms ? 700 : 500,
                    cursor: 'pointer',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </label>
        )}

        {/* Quantidade de Cartas */}
        <label style={{ display: 'block', marginBottom: 40 }}>
          <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 12, fontWeight: 600 }}>
            Quantidade de Cartas para Treinar
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[20, 52, 104, 208].map(count => (
              <button
                key={count}
                onClick={() => setConfig({ ...config, totalCards: count })}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: config.totalCards === count ? '#10b981' : '#334155',
                  border: 'none',
                  borderRadius: 10,
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: config.totalCards === count ? 700 : 500,
                  cursor: 'pointer',
                }}
              >
                {count}
              </button>
            ))}
          </div>
        </label>

        {/* Botão Iniciar */}
        <button
          onClick={onStart}
          style={{
            width: '100%',
            padding: '20px',
            background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
            border: 'none',
            borderRadius: 12,
            color: '#fff',
            fontSize: 18,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(139, 92, 246, 0.4)',
          }}
        >
          🎮 Iniciar Treinamento
        </button>
      </div>

      {/* Guia Hi-Lo */}
      <div className="card" style={{ padding: 32 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: '#f8fafc' }}>
          📚 Sistema Hi-Lo
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <div style={{ textAlign: 'center', padding: 16, background: 'rgba(16, 185, 129, 0.1)', borderRadius: 10 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>+1</div>
            <div style={{ color: '#10b981', fontWeight: 700, marginBottom: 4 }}>Cartas Baixas</div>
            <div style={{ fontSize: 20, color: '#94a3b8' }}>2, 3, 4, 5, 6</div>
          </div>
          <div style={{ textAlign: 'center', padding: 16, background: 'rgba(148, 163, 184, 0.1)', borderRadius: 10 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>0</div>
            <div style={{ color: '#94a3b8', fontWeight: 700, marginBottom: 4 }}>Neutras</div>
            <div style={{ fontSize: 20, color: '#94a3b8' }}>7, 8, 9</div>
          </div>
          <div style={{ textAlign: 'center', padding: 16, background: 'rgba(239, 68, 68, 0.1)', borderRadius: 10 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>-1</div>
            <div style={{ color: '#ef4444', fontWeight: 700, marginBottom: 4 }}>Cartas Altas</div>
            <div style={{ fontSize: 20, color: '#94a3b8' }}>10, J, Q, K, A</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== MODO AUTOMÁTICO =====
function AutoMode({ 
  config,
  shoe,
  onComplete,
}: { 
  config: SessionConfig;
  shoe: Card[];
  onComplete: (stats: TrainingStats) => void;
}) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [runningCount, setRunningCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentCard = shoe[currentCardIndex];
  const cardsRemaining = shoe.length - currentCardIndex;
  const decksRemaining = cardsRemaining / 52;
  const trueCount = calculateTrueCount(runningCount, decksRemaining);
  const progress = (currentCardIndex / config.totalCards) * 100;

  useEffect(() => {
    if (isPaused || currentCardIndex >= config.totalCards) return;

    intervalRef.current = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setRunningCount(prev => prev + currentCard.hiLoValue);
        setCurrentCardIndex(prev => prev + 1);
        setIsAnimating(false);
      }, 300);
    }, config.speedMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [currentCardIndex, isPaused, config.speedMs, config.totalCards]);

  useEffect(() => {
    if (currentCardIndex >= config.totalCards) {
      const stats: TrainingStats = {
        totalCards: config.totalCards,
        correctCounts: config.totalCards,
        wrongCounts: 0,
        accuracy: 100,
        startTime: Date.now() - (config.totalCards * config.speedMs),
        endTime: Date.now(),
      };
      onComplete(stats);
    }
  }, [currentCardIndex, config.totalCards]);

  return (
    <div style={{ maxWidth: 1100, margin: '40px auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#f8fafc' }}>
          ♠️ Modo Automático
        </h2>
        <button
          onClick={() => setIsPaused(!isPaused)}
          style={{
            padding: '12px 24px',
            background: isPaused ? '#10b981' : '#f59e0b',
            border: 'none',
            borderRadius: 10,
            color: '#fff',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {isPaused ? '▶️ Continuar' : '⏸️ Pausar'}
        </button>
      </div>

      {/* Contador */}
      <CounterDisplay 
        runningCount={runningCount} 
        trueCount={trueCount}
        decksRemaining={decksRemaining}
      />

      {/* Mesa de Cartas */}
      <div style={{
        marginTop: 32,
        padding: 60,
        background: 'linear-gradient(135deg, #0f172a, #1e293b)',
        borderRadius: 20,
        border: '2px solid rgba(139, 92, 246, 0.3)',
        minHeight: 300,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {currentCard && (
          <CasinoCard card={currentCard} isAnimating={isAnimating} />
        )}
        
        <div style={{ marginTop: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 8 }}>
            Carta {currentCardIndex + 1} / {config.totalCards}
          </div>
          <div style={{ width: 400, height: 8, background: '#334155', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #8b5cf6, #a855f7)',
              transition: 'width 0.3s',
            }} />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes cardPop {
          0% { transform: scale(0.8) rotateY(-90deg); opacity: 0; }
          50% { transform: scale(1.15) rotateY(10deg); }
          100% { transform: scale(1) rotateY(0deg); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ===== MODO TREINO =====
function TrainMode({ 
  config,
  shoe,
  onComplete,
}: { 
  config: SessionConfig;
  shoe: Card[];
  onComplete: (stats: TrainingStats) => void;
}) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [runningCount, setRunningCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [showingCard, setShowingCard] = useState(false);
  const [correctCounts, setCorrectCounts] = useState(0);
  const [wrongCounts, setWrongCounts] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const currentCard = shoe[currentCardIndex];
  const cardsRemaining = shoe.length - currentCardIndex;
  const decksRemaining = cardsRemaining / 52;
  const trueCount = calculateTrueCount(runningCount, decksRemaining);
  const progress = (currentCardIndex / config.totalCards) * 100;

  const handleRevealCard = () => {
    setShowingCard(true);
  };

  const handleSubmitCount = () => {
    const correctCount = runningCount + currentCard.hiLoValue;
    const isCorrect = userCount === correctCount;

    if (isCorrect) {
      setCorrectCounts(prev => prev + 1);
      setFeedback('correct');
    } else {
      setWrongCounts(prev => prev + 1);
      setFeedback('wrong');
    }

    setTimeout(() => {
      setRunningCount(correctCount);
      setCurrentCardIndex(prev => prev + 1);
      setUserCount(correctCount); // Reset para a contagem correta
      setShowingCard(false);
      setFeedback(null);
    }, 1500);
  };

  useEffect(() => {
    if (currentCardIndex >= config.totalCards) {
      const stats: TrainingStats = {
        totalCards: config.totalCards,
        correctCounts,
        wrongCounts,
        accuracy: (correctCounts / config.totalCards) * 100,
        startTime: Date.now() - (config.totalCards * 3000), // Estimativa
        endTime: Date.now(),
      };
      onComplete(stats);
    }
  }, [currentCardIndex, config.totalCards]);

  return (
    <div style={{ maxWidth: 1100, margin: '40px auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#f8fafc', marginBottom: 16 }}>
          🎯 Modo Treino
        </h2>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ flex: 1, padding: 16, background: 'rgba(16, 185, 129, 0.1)', borderRadius: 10, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981' }}>{correctCounts}</div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>Acertos</div>
          </div>
          <div style={{ flex: 1, padding: 16, background: 'rgba(239, 68, 68, 0.1)', borderRadius: 10, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#ef4444' }}>{wrongCounts}</div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>Erros</div>
          </div>
          <div style={{ flex: 1, padding: 16, background: 'rgba(139, 92, 246, 0.1)', borderRadius: 10, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#8b5cf6' }}>
              {((correctCounts / (currentCardIndex || 1)) * 100).toFixed(0)}%
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>Precisão</div>
          </div>
        </div>
      </div>

      {/* Contador */}
      <CounterDisplay 
        runningCount={runningCount} 
        trueCount={trueCount}
        decksRemaining={decksRemaining}
      />

      {/* Mesa de Cartas */}
      <div style={{
        marginTop: 32,
        padding: 60,
        background: 'linear-gradient(135deg, #0f172a, #1e293b)',
        borderRadius: 20,
        border: `2px solid ${feedback === 'correct' ? '#10b981' : feedback === 'wrong' ? '#ef4444' : 'rgba(139, 92, 246, 0.3)'}`,
        minHeight: 400,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'border-color 0.3s',
      }}>
        {!showingCard ? (
          <button
            onClick={handleRevealCard}
            style={{
              padding: '24px 48px',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              border: 'none',
              borderRadius: 12,
              color: '#fff',
              fontSize: 18,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)',
            }}
          >
            🎴 Revelar Próxima Carta
          </button>
        ) : (
          <>
            <CasinoCard card={currentCard} isAnimating={true} />
            
            <div style={{ marginTop: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 12 }}>
                Qual é a contagem agora?
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center' }}>
                <button
                  onClick={() => setUserCount(prev => prev - 1)}
                  style={{
                    width: 48,
                    height: 48,
                    background: '#ef4444',
                    border: 'none',
                    borderRadius: 10,
                    color: '#fff',
                    fontSize: 24,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  -
                </button>
                <div style={{
                  minWidth: 120,
                  padding: '12px 24px',
                  background: '#1e293b',
                  border: '2px solid #475569',
                  borderRadius: 10,
                  fontSize: 32,
                  fontWeight: 900,
                  color: '#fff',
                  fontFamily: 'monospace',
                  textAlign: 'center',
                }}>
                  {userCount >= 0 ? '+' : ''}{userCount}
                </div>
                <button
                  onClick={() => setUserCount(prev => prev + 1)}
                  style={{
                    width: 48,
                    height: 48,
                    background: '#10b981',
                    border: 'none',
                    borderRadius: 10,
                    color: '#fff',
                    fontSize: 24,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  +
                </button>
              </div>
              <button
                onClick={handleSubmitCount}
                disabled={feedback !== null}
                style={{
                  marginTop: 24,
                  padding: '16px 48px',
                  background: feedback === null ? 'linear-gradient(135deg, #8b5cf6, #a855f7)' : '#334155',
                  border: 'none',
                  borderRadius: 12,
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: feedback === null ? 'pointer' : 'not-allowed',
                  opacity: feedback === null ? 1 : 0.5,
                }}
              >
                ✓ Confirmar
              </button>
            </div>

            {feedback && (
              <div style={{
                marginTop: 24,
                padding: 16,
                background: feedback === 'correct' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                border: `2px solid ${feedback === 'correct' ? '#10b981' : '#ef4444'}`,
                borderRadius: 12,
                fontSize: 18,
                fontWeight: 700,
                color: feedback === 'correct' ? '#10b981' : '#ef4444',
              }}>
                {feedback === 'correct' ? '✅ Correto!' : '❌ Incorreto! Contagem correta: ' + (runningCount + currentCard.hiLoValue)}
              </div>
            )}
          </>
        )}

        <div style={{ marginTop: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 8 }}>
            Carta {currentCardIndex + 1} / {config.totalCards}
          </div>
          <div style={{ width: 400, height: 8, background: '#334155', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #8b5cf6, #a855f7)',
              transition: 'width 0.3s',
            }} />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes cardPop {
          0% { transform: scale(0.8) rotateY(-90deg); opacity: 0; }
          50% { transform: scale(1.15) rotateY(10deg); }
          100% { transform: scale(1) rotateY(0deg); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ===== RESULTADOS =====
function ResultsScreen({ 
  stats, 
  onRestart 
}: { 
  stats: TrainingStats; 
  onRestart: () => void;
}) {
  const duration = stats.endTime ? Math.round((stats.endTime - stats.startTime) / 1000) : 0;
  const scoreColor = stats.accuracy >= 90 ? '#10b981' : stats.accuracy >= 75 ? '#3b82f6' : stats.accuracy >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', padding: '20px' }}>
      <div className="card" style={{ padding: 48, textAlign: 'center' }}>
        <div style={{
          width: 120,
          height: 120,
          margin: '0 auto 24px',
          background: `linear-gradient(135deg, ${scoreColor}, ${scoreColor}dd)`,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 56,
          boxShadow: `0 12px 32px ${scoreColor}50`,
        }}>
          {stats.accuracy >= 90 ? '🏆' : stats.accuracy >= 75 ? '🌟' : stats.accuracy >= 60 ? '📚' : '💪'}
        </div>

        <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 12, color: scoreColor }}>
          {stats.accuracy >= 90 ? 'Excelente!' : stats.accuracy >= 75 ? 'Muito Bom!' : stats.accuracy >= 60 ? 'Bom Trabalho!' : 'Continue Praticando!'}
        </h2>

        <p style={{ fontSize: 16, color: '#94a3b8', marginBottom: 40 }}>
          Treinamento completo
        </p>

        {/* Estatísticas */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 24,
          marginBottom: 40,
          padding: '32px 0',
          borderTop: '1px solid rgba(139, 92, 246, 0.2)',
          borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
        }}>
          <div>
            <div style={{ fontSize: 36, fontWeight: 700, color: '#8b5cf6', marginBottom: 8 }}>
              {stats.totalCards}
            </div>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>Cartas</div>
          </div>
          <div>
            <div style={{ fontSize: 36, fontWeight: 700, color: '#10b981', marginBottom: 8 }}>
              {stats.correctCounts}
            </div>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>Acertos</div>
          </div>
          <div>
            <div style={{ fontSize: 36, fontWeight: 700, color: scoreColor, marginBottom: 8 }}>
              {stats.accuracy.toFixed(1)}%
            </div>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>Precisão</div>
          </div>
          <div>
            <div style={{ fontSize: 36, fontWeight: 700, color: '#60a5fa', marginBottom: 8 }}>
              {duration}s
            </div>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>Tempo</div>
          </div>
        </div>

        {/* Feedback */}
        <div style={{
          padding: 20,
          background: 'rgba(139, 92, 246, 0.1)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: 12,
          marginBottom: 32,
          textAlign: 'left',
        }}>
          <p style={{ color: '#c084fc', fontSize: 14, lineHeight: 1.8 }}>
            {stats.accuracy >= 90
              ? '🎯 Impressionante! Você dominou o sistema Hi-Lo. Continue praticando com mais baralhos ou velocidade maior.'
              : stats.accuracy >= 75
              ? '👍 Ótimo desempenho! Você está no caminho certo. Pratique mais para alcançar 90%+ de precisão.'
              : stats.accuracy >= 60
              ? '📖 Bom início! Continue treinando. Foque em memorizar os valores Hi-Lo de cada carta.'
              : '💪 A prática leva à perfeição! Comece com velocidade lenta e poucos baralhos, depois aumente a dificuldade.'
            }
          </p>
        </div>

        {/* Botões */}
        <div style={{ display: 'flex', gap: 16 }}>
          <button
            onClick={onRestart}
            style={{
              flex: 1,
              padding: '18px',
              background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
              border: 'none',
              borderRadius: 12,
              color: '#fff',
              fontSize: 16,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(139, 92, 246, 0.4)',
            }}
          >
            🔄 Treinar Novamente
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== COMPONENTE PRINCIPAL =====
export default function BlackjackCardCounting() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<TrainingMode>('SETUP');
  const [config, setConfig] = useState<SessionConfig>({
    mode: 'AUTO',
    deckCount: 6,
    speedMs: 1000,
    totalCards: 52,
  });
  const [shoe, setShoe] = useState<Card[]>([]);
  const [stats, setStats] = useState<TrainingStats | null>(null);

  const handleStart = () => {
    const newShoe = createShoe(config.deckCount);
    setShoe(newShoe);
    setMode(config.mode);
  };

  const handleComplete = (completedStats: TrainingStats) => {
    setStats(completedStats);
    setMode('RESULTS');
  };

  const handleRestart = () => {
    setMode('SETUP');
    setStats(null);
    setShoe([]);
  };

  if (mode === 'SETUP') {
    return <SetupScreen config={config} setConfig={setConfig} onStart={handleStart} />;
  }

  if (mode === 'AUTO') {
    return <AutoMode config={config} shoe={shoe} onComplete={handleComplete} />;
  }

  if (mode === 'TRAIN') {
    return <TrainMode config={config} shoe={shoe} onComplete={handleComplete} />;
  }

  if (mode === 'RESULTS' && stats) {
    return <ResultsScreen stats={stats} onRestart={handleRestart} />;
  }

  return null;
}
