/**
 * 🧠 POKER ODDS TRAINER - Manual Training Mode
 * 
 * Simulador profissional para estudo de probabilidades no poker.
 * Permite construir cenários manualmente e ver odds em tempo real via Monte Carlo.
 * 
 * ⚠️ FERRAMENTA EDUCACIONAL - NÃO GARANTE RESULTADOS EM JOGOS REAIS
 * - Apenas para estudo matemático
 * - Não garante ganhos reais
 * - Sem apostas ou conexão com plataformas de poker
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// ===== TIPOS =====
type Rank = 'A' | 'K' | 'Q' | 'J' | 'T' | '9' | '8' | '7' | '6' | '5' | '4' | '3' | '2';
type Suit = '♠' | '♥' | '♦' | '♣';
type GameState = 'SETUP' | 'PLAYING';

interface Card {
  rank: Rank;
  suit: Suit;
}

interface GameConfig {
  numPlayers: number;
}

interface HandOdds {
  winChance: number;
  tieChance: number;
  loseChance: number;
  outs: number;
  explanation: string;
}

// ===== CONSTANTES =====
const RANKS: Rank[] = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
const SUITS: Suit[] = ['♠', '♥', '♦', '♣'];

const RANK_VALUES: Record<Rank, number> = {
  'A': 14, 'K': 13, 'Q': 12, 'J': 11, 'T': 10,
  '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2
};

// ===== UTILITÁRIOS =====
function cardId(card: Card): string {
  return `${card.rank}${card.suit}`;
}

function isCardUsed(card: Card, usedCards: Card[]): boolean {
  return usedCards.some(c => cardId(c) === cardId(card));
}

// ===== AVALIAÇÃO DE MÃOS (SIMPLIFICADA) =====
function evaluateHand(holeCards: Card[], boardCards: Card[]): number {
  const allCards = [...holeCards, ...boardCards];
  if (allCards.length < 2) return 0;

  // Agrupa por rank
  const rankCount: Record<string, number> = {};
  allCards.forEach(c => {
    rankCount[c.rank] = (rankCount[c.rank] || 0) + 1;
  });

  const counts = Object.values(rankCount).sort((a, b) => b - a);
  const ranks = allCards.map(c => RANK_VALUES[c.rank]).sort((a, b) => b - a);
  const suits = allCards.map(c => c.suit);
  const suitCount: Record<string, number> = {};
  suits.forEach(s => {
    suitCount[s] = (suitCount[s] || 0) + 1;
  });
  const maxSuit = Math.max(...Object.values(suitCount));

  // Detecção básica (simplificada)
  const hasFlush = maxSuit >= 5;
  const hasStraight = detectStraight(ranks);
  
  if (hasFlush && hasStraight) return 8000000 + ranks[0]; // Straight Flush
  if (counts[0] === 4) return 7000000 + ranks[0]; // Quadra
  if (counts[0] === 3 && counts[1] >= 2) return 6000000 + ranks[0]; // Full House
  if (hasFlush) return 5000000 + ranks[0]; // Flush
  if (hasStraight) return 4000000 + ranks[0]; // Straight
  if (counts[0] === 3) return 3000000 + ranks[0]; // Trinca
  if (counts[0] === 2 && counts[1] === 2) return 2000000 + ranks[0]; // Dois Pares
  if (counts[0] === 2) return 1000000 + ranks[0]; // Par
  return ranks[0]; // High Card
}

function detectStraight(sortedRanks: number[]): boolean {
  const unique = Array.from(new Set(sortedRanks)).sort((a, b) => b - a);
  if (unique.length < 5) return false;

  for (let i = 0; i <= unique.length - 5; i++) {
    if (unique[i] - unique[i + 4] === 4) return true;
  }

  // A-2-3-4-5 (wheel)
  if (unique.includes(14) && unique.includes(5) && unique.includes(4) && unique.includes(3) && unique.includes(2)) {
    return true;
  }

  return false;
}

// ===== SIMULAÇÃO MONTE CARLO =====
function calculateOdds(
  heroCards: Card[],
  boardCards: Card[],
  numPlayers: number,
  usedCards: Card[]
): HandOdds {
  if (heroCards.length !== 2) {
    return {
      winChance: 0,
      tieChance: 0,
      loseChance: 0,
      outs: 0,
      explanation: 'Selecione 2 cartas do HERO',
    };
  }

  const simulations = 2000;
  let wins = 0;
  let ties = 0;
  let losses = 0;

  // Criar deck restante
  const allUsed = [...heroCards, ...boardCards, ...usedCards];
  const deck: Card[] = [];
  SUITS.forEach(suit => {
    RANKS.forEach(rank => {
      const card: Card = { rank, suit };
      if (!isCardUsed(card, allUsed)) {
        deck.push(card);
      }
    });
  });

  const cardsToComplete = 5 - boardCards.length;

  for (let i = 0; i < simulations; i++) {
    // Shuffle deck
    const shuffled = [...deck].sort(() => Math.random() - 0.5);

    // Completar board
    const simBoard = [...boardCards, ...shuffled.slice(0, cardsToComplete)];
    let idx = cardsToComplete;

    // Distribuir cartas para os oponentes
    const opponentHands: Card[][] = [];
    for (let p = 1; p < numPlayers; p++) {
      opponentHands.push([shuffled[idx], shuffled[idx + 1]]);
      idx += 2;
    }

    // Avaliar mãos
    const heroScore = evaluateHand(heroCards, simBoard);
    const opponentScores = opponentHands.map(h => evaluateHand(h, simBoard));

    const maxOpponentScore = Math.max(...opponentScores, 0);

    if (heroScore > maxOpponentScore) {
      wins++;
    } else if (heroScore === maxOpponentScore) {
      ties++;
    } else {
      losses++;
    }
  }

  const winChance = (wins / simulations) * 100;
  const tieChance = (ties / simulations) * 100;
  const loseChance = (losses / simulations) * 100;

  // Outs aproximados (simplificado)
  const outs = Math.max(0, Math.round((winChance / 100) * (5 - boardCards.length) * 10));

  let explanation = '';
  if (boardCards.length === 0) {
    explanation = 'Pré-flop: suas chances dependem da força da mão inicial.';
  } else if (boardCards.length === 3) {
    explanation = `No flop, você tem ${outs} outs aproximados. Turn + River podem melhorar sua mão.`;
  } else if (boardCards.length === 4) {
    explanation = `No turn, você tem ${outs} outs aproximados. River é a última carta.`;
  } else {
    explanation = 'River completo. Mão final decidida.';
  }

  return {
    winChance: Math.round(winChance * 10) / 10,
    tieChance: Math.round(tieChance * 10) / 10,
    loseChance: Math.round(loseChance * 10) / 10,
    outs,
    explanation,
  };
}

// ===== COMPONENTE: CARTA =====
function PokerCard({ card }: { card: Card }) {
  const isRed = card.suit === '♥' || card.suit === '♦';
  return (
    <div
      style={{
        width: 56,
        height: 78,
        borderRadius: 8,
        background: 'linear-gradient(135deg, #fff 0%, #f9fafb 100%)',
        border: '2px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 22,
        fontWeight: 700,
        color: isRed ? '#dc2626' : '#1f2937',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        position: 'relative',
      }}
    >
      <div style={{ lineHeight: 1 }}>{card.rank}</div>
      <div style={{ fontSize: 26, lineHeight: 1 }}>{card.suit}</div>
    </div>
  );
}

// ===== COMPONENTE: SELETOR DE CARTAS =====
function CardSelector({
  onSelect,
  usedCards = [],
  compact = false,
}: {
  onSelect: (card: Card) => void;
  usedCards?: Card[];
  compact?: boolean;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 8 : 12 }}>
      {RANKS.map(rank => (
        <div key={rank} style={{ display: 'flex', gap: compact ? 4 : 6 }}>
          {SUITS.map(suit => {
            const card: Card = { rank, suit };
            const used = isCardUsed(card, usedCards);
            const isRed = suit === '♥' || suit === '♦';

            return (
              <button
                key={cardId(card)}
                onClick={() => !used && onSelect(card)}
                disabled={used}
                style={{
                  width: compact ? 32 : 42,
                  height: compact ? 44 : 58,
                  borderRadius: 6,
                  background: used
                    ? 'rgba(100, 100, 100, 0.2)'
                    : 'linear-gradient(135deg, #fff 0%, #f9fafb 100%)',
                  border: used ? '2px solid rgba(100,100,100,0.3)' : '2px solid #e5e7eb',
                  fontSize: compact ? 11 : 13,
                  fontWeight: 700,
                  color: used ? '#6b7280' : isRed ? '#dc2626' : '#1f2937',
                  cursor: used ? 'not-allowed' : 'pointer',
                  opacity: used ? 0.4 : 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  padding: 0,
                }}
                onMouseEnter={(e) => {
                  if (!used) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ lineHeight: 1, fontSize: compact ? 10 : 12 }}>{rank}</div>
                <div style={{ fontSize: compact ? 14 : 18, lineHeight: 1 }}>{suit}</div>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ===== TELA DE SETUP =====
function SetupScreen({
  config,
  setConfig,
  onStart,
}: {
  config: GameConfig;
  setConfig: (config: GameConfig) => void;
  onStart: () => void;
}) {
  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12, color: '#f8fafc' }}>
          🧠 Poker Odds Trainer (Beta)
        </h1>
        <p style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.6 }}>
          Treine decisões reais com cálculo de probabilidades em tempo real.
        </p>
        <p style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.6 }}>
          Selecione as cartas manualmente e veja suas chances mudarem a cada ação.
        </p>
      </div>

      {/* Aviso Educacional */}
      <div
        className="card"
        style={{
          padding: 20,
          marginBottom: 24,
          background: 'rgba(234, 179, 8, 0.1)',
          border: '1px solid rgba(234, 179, 8, 0.3)',
        }}
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'start' }}>
          <div style={{ fontSize: 24 }}>⚠️</div>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6, color: '#fbbf24' }}>
              Ferramenta Educacional
            </h3>
            <p style={{ fontSize: 13, color: '#fcd34d', lineHeight: 1.5, margin: 0 }}>
              Ferramenta educacional para estudo matemático. Não garante resultados em jogos reais.
            </p>
          </div>
        </div>
      </div>

      {/* Configurações */}
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#f8fafc' }}>
          ⚙️ Configurações
        </h3>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#e2e8f0' }}>
            Número de Jogadores
          </label>
          <select
            value={config.numPlayers}
            onChange={(e) => setConfig({ ...config, numPlayers: parseInt(e.target.value) })}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: 'rgba(30, 41, 59, 0.5)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: 8,
              color: '#f8fafc',
              fontSize: 14,
              outline: 'none',
            }}
          >
            {[2, 3, 4, 5, 6, 7, 8, 9].map(n => (
              <option key={n} value={n}>{n} jogadores</option>
            ))}
          </select>
        </div>
      </div>

      {/* Como Funciona */}
      <div className="card" style={{ padding: 24, marginBottom: 24, background: 'rgba(59, 130, 246, 0.05)' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#60a5fa' }}>
          📚 Como Funciona
        </h3>
        <ul style={{ fontSize: 13, color: '#93c5fd', lineHeight: 1.8, margin: 0, paddingLeft: 20 }}>
          <li>Selecione manualmente suas 2 cartas (HERO)</li>
          <li>Adicione cartas do board conforme o jogo avança (Flop/Turn/River)</li>
          <li>Veja as probabilidades atualizarem em tempo real via Monte Carlo</li>
          <li>Estude suas chances de vitória/empate/derrota</li>
          <li>Análise os outs e tome decisões informadas</li>
        </ul>
      </div>

      {/* Botão Iniciar */}
      <button
        onClick={onStart}
        className="btn btn-primary"
        style={{
          width: '100%',
          padding: '16px',
          fontSize: 16,
          fontWeight: 700,
        }}
      >
        🚀 Iniciar Treinamento
      </button>
    </div>
  );
}

// ===== TELA DE JOGO =====
function PlayingScreen({
  config,
  onExit,
}: {
  config: GameConfig;
  onExit: () => void;
}) {
  const [heroCards, setHeroCards] = useState<Card[]>([]);
  const [boardCards, setBoardCards] = useState<Card[]>([]);
  const [showHeroSelector, setShowHeroSelector] = useState(true);
  const [showBoardSelector, setShowBoardSelector] = useState(false);

  const allUsedCards = [...heroCards, ...boardCards];

  const odds = calculateOdds(heroCards, boardCards, config.numPlayers, []);

  const handleAddHeroCard = (card: Card) => {
    if (heroCards.length < 2) {
      setHeroCards([...heroCards, card]);
      if (heroCards.length === 1) {
        setShowHeroSelector(false);
      }
    }
  };

  const handleAddBoardCard = (card: Card) => {
    if (boardCards.length < 5) {
      setBoardCards([...boardCards, card]);
      if (boardCards.length === 4) {
        setShowBoardSelector(false);
      }
    }
  };

  const handleReset = () => {
    setHeroCards([]);
    setBoardCards([]);
    setShowHeroSelector(true);
    setShowBoardSelector(false);
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4, color: '#f8fafc' }}>
            🧠 Poker Odds Trainer
          </h1>
          <p style={{ fontSize: 14, color: '#94a3b8', margin: 0 }}>
            {config.numPlayers} jogadores | Monte Carlo Simulation
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={handleReset} className="btn btn-ghost">
            🔄 Reset
          </button>
          <button onClick={onExit} className="btn btn-ghost">
            ← Voltar
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
        {/* Área Principal */}
        <div>
          {/* Mesa de Poker */}
          <div className="card" style={{ padding: 32, marginBottom: 24 }}>
            {/* Hero Cards */}
            <div style={{ marginBottom: 32 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: '#6ee7b7' }}>
                👤 HERO (Suas Cartas)
              </h3>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                {heroCards.map((card, i) => (
                  <PokerCard key={i} card={card} />
                ))}
                {heroCards.length < 2 && (
                  <button
                    onClick={() => setShowHeroSelector(true)}
                    style={{
                      width: 56,
                      height: 78,
                      borderRadius: 8,
                      background: 'rgba(139, 92, 246, 0.1)',
                      border: '2px dashed rgba(139, 92, 246, 0.5)',
                      fontSize: 24,
                      color: '#a78bfa',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)';
                      e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.8)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
                      e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)';
                    }}
                  >
                    +
                  </button>
                )}
              </div>
            </div>

            {/* Board Cards */}
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: '#fbbf24' }}>
                🃏 BOARD (Cartas Comunitárias)
              </h3>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                {boardCards.map((card, i) => (
                  <PokerCard key={i} card={card} />
                ))}
                {boardCards.length < 5 && heroCards.length === 2 && (
                  <button
                    onClick={() => setShowBoardSelector(true)}
                    style={{
                      width: 56,
                      height: 78,
                      borderRadius: 8,
                      background: 'rgba(234, 179, 8, 0.1)',
                      border: '2px dashed rgba(234, 179, 8, 0.5)',
                      fontSize: 24,
                      color: '#fbbf24',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(234, 179, 8, 0.2)';
                      e.currentTarget.style.borderColor = 'rgba(234, 179, 8, 0.8)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(234, 179, 8, 0.1)';
                      e.currentTarget.style.borderColor = 'rgba(234, 179, 8, 0.5)';
                    }}
                  >
                    +
                  </button>
                )}
              </div>
              {boardCards.length === 0 && heroCards.length === 2 && (
                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 8, marginBottom: 0 }}>
                  Clique em + para adicionar o Flop (3 cartas)
                </p>
              )}
              {boardCards.length === 3 && (
                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 8, marginBottom: 0 }}>
                  Flop completo. Adicione o Turn (1 carta)
                </p>
              )}
              {boardCards.length === 4 && (
                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 8, marginBottom: 0 }}>
                  Turn completo. Adicione o River (1 carta)
                </p>
              )}
            </div>
          </div>

          {/* Probabilidades */}
          {heroCards.length === 2 && (
            <div className="card" style={{ padding: 24, background: 'rgba(16, 185, 129, 0.05)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#6ee7b7' }}>
                📊 Probabilidades em Tempo Real
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div style={{ padding: 16, background: 'rgba(16, 185, 129, 0.1)', borderRadius: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#6ee7b7', marginBottom: 4 }}>
                    VITÓRIA
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#10b981' }}>
                    {odds.winChance.toFixed(1)}%
                  </div>
                </div>

                <div style={{ padding: 16, background: 'rgba(234, 179, 8, 0.1)', borderRadius: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#fbbf24', marginBottom: 4 }}>
                    EMPATE
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#f59e0b' }}>
                    {odds.tieChance.toFixed(1)}%
                  </div>
                </div>

                <div style={{ padding: 16, background: 'rgba(239, 68, 68, 0.1)', borderRadius: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#f87171', marginBottom: 4 }}>
                    DERROTA
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#ef4444' }}>
                    {odds.loseChance.toFixed(1)}%
                  </div>
                </div>
              </div>

              <div style={{ padding: 16, background: 'rgba(139, 92, 246, 0.1)', borderRadius: 8, marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#a78bfa', marginBottom: 4 }}>
                  OUTS ESTIMADOS
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#8b5cf6' }}>
                  ~{odds.outs} outs
                </div>
              </div>

              <div style={{ padding: 16, background: 'rgba(59, 130, 246, 0.1)', borderRadius: 8 }}>
                <div style={{ fontSize: 13, color: '#93c5fd', lineHeight: 1.6 }}>
                  💡 {odds.explanation}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Seletor de Cartas */}
        <div>
          {showHeroSelector && heroCards.length < 2 && (
            <div className="card" style={{ padding: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                  👤 Selecione Carta do HERO
                </h3>
                <button
                  onClick={() => setShowHeroSelector(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: 18,
                    color: '#94a3b8',
                    cursor: 'pointer',
                  }}
                >
                  ×
                </button>
              </div>
              <CardSelector onSelect={handleAddHeroCard} usedCards={allUsedCards} compact />
            </div>
          )}

          {showBoardSelector && boardCards.length < 5 && heroCards.length === 2 && (
            <div className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                  🃏 Selecione Carta do BOARD
                </h3>
                <button
                  onClick={() => setShowBoardSelector(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: 18,
                    color: '#94a3b8',
                    cursor: 'pointer',
                  }}
                >
                  ×
                </button>
              </div>
              <CardSelector onSelect={handleAddBoardCard} usedCards={allUsedCards} compact />
            </div>
          )}

          {!showHeroSelector && !showBoardSelector && (
            <div className="card" style={{ padding: 20, background: 'rgba(59, 130, 246, 0.05)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: '#60a5fa' }}>
                💡 Dicas
              </h3>
              <ul style={{ fontSize: 12, color: '#93c5fd', lineHeight: 1.6, margin: 0, paddingLeft: 16 }}>
                <li>Clique em + para adicionar cartas</li>
                <li>As probabilidades atualizam automaticamente</li>
                <li>Use Reset para começar novo cenário</li>
                <li>Estude como as odds mudam a cada street</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ===== COMPONENTE PRINCIPAL =====
export default function PokerOddsTrainer() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<GameState>('SETUP');
  const [config, setConfig] = useState<GameConfig>({
    numPlayers: 6,
  });

  // Verificar autenticação (mesmo padrão do BlackjackPro)
  useEffect(() => {
    if (!auth.token) {
      navigate('/login');
    }
  }, [auth.token, navigate]);

  if (!auth.token) {
    return null;
  }

  return (
    <div className="page">
      {gameState === 'SETUP' && (
        <SetupScreen
          config={config}
          setConfig={setConfig}
          onStart={() => setGameState('PLAYING')}
        />
      )}

      {gameState === 'PLAYING' && (
        <PlayingScreen
          config={config}
          onExit={() => setGameState('SETUP')}
        />
      )}
    </div>
  );
}
