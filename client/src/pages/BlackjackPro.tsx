/**
 * 🎰 BLACKJACK PRO - Manual Training Mode
 * 
 * Simulador profissional para estudo matemático de Blackjack.
 * Permite construir cenários manualmente e ver probabilidades em tempo real.
 * 
 * ⚠️ FERRAMENTA EDUCACIONAL - NÃO INCENTIVA JOGOS DE AZAR
 * - Apenas para estudo matemático
 * - Não garante ganhos reais
 * - Sem apostas ou conexão com cassinos
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// ===== TIPOS =====
type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';
type Suit = '♠' | '♥' | '♦' | '♣';
type GameState = 'SETUP' | 'PLAYING';

interface Card {
  rank: Rank;
  suit: Suit;
  value: number;
  hiLoValue: number;
}

interface GameConfig {
  deckCount: number;
  cutCardPenetration: number;
}

interface Probabilities {
  winChance: number;
  bustChance: number;
  optimalAction: string;
  expectedValue: number;
  explanation: string;
}

// ===== CONSTANTES =====
const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const SUITS: Suit[] = ['♠', '♥', '♦', '♣'];

const HI_LO_VALUES: Record<Rank, number> = {
  '2': 1, '3': 1, '4': 1, '5': 1, '6': 1,
  '7': 0, '8': 0, '9': 0,
  '10': -1, 'J': -1, 'Q': -1, 'K': -1, 'A': -1,
};

// ===== UTILITÁRIOS =====
function getCardValue(rank: Rank): number {
  if (rank === 'A') return 11;
  if (['J', 'Q', 'K'].includes(rank)) return 10;
  return parseInt(rank);
}

function createCard(rank: Rank, suit: Suit): Card {
  return {
    rank,
    suit,
    value: getCardValue(rank),
    hiLoValue: HI_LO_VALUES[rank],
  };
}

function calculateHandValue(cards: Card[]): { value: number; isSoft: boolean } {
  let value = 0;
  let aces = 0;

  cards.forEach(card => {
    if (card.rank === 'A') {
      aces++;
      value += 11;
    } else {
      value += card.value;
    }
  });

  while (value > 21 && aces > 0) {
    value -= 10;
    aces--;
  }

  return { value, isSoft: aces > 0 };
}

function calculateRunningCount(cards: Card[]): number {
  return cards.reduce((count, card) => count + card.hiLoValue, 0);
}

function calculateTrueCount(runningCount: number, decksRemaining: number): number {
  if (decksRemaining <= 0) return 0;
  return Math.round((runningCount / decksRemaining) * 10) / 10;
}

function calculateRemainingCards(deckCount: number, usedCards: Card[]): Record<Rank, number> {
  const remaining: Record<Rank, number> = {} as Record<Rank, number>;
  
  RANKS.forEach(rank => {
    remaining[rank] = deckCount * 4;
  });

  usedCards.forEach(card => {
    remaining[card.rank]--;
  });

  return remaining;
}

// ===== CÁLCULO DE PROBABILIDADES EM TEMPO REAL =====
function calculateProbabilities(
  playerCards: Card[],
  dealerCard: Card | null,
  deckCount: number,
  allUsedCards: Card[],
  trueCount: number
): Probabilities {
  const { value: playerValue, isSoft } = calculateHandValue(playerCards);
  
  // Se já bust
  if (playerValue > 21) {
    return {
      winChance: 0,
      bustChance: 100,
      optimalAction: 'BUST',
      expectedValue: -1,
      explanation: 'Você estourou 21. Mão perdida.',
    };
  }

  // Se não tem dealer ainda
  if (!dealerCard) {
    return {
      winChance: 0,
      bustChance: 0,
      optimalAction: 'Escolha carta do dealer',
      expectedValue: 0,
      explanation: 'Aguardando carta do dealer para calcular probabilidades.',
    };
  }

  const remaining = calculateRemainingCards(deckCount, allUsedCards);
  const totalRemaining = Object.values(remaining).reduce((sum, count) => sum + count, 0);

  // Calcular chance de bust no próximo hit
  let bustCards = 0;
  Object.entries(remaining).forEach(([rank, count]) => {
    const cardValue = getCardValue(rank as Rank);
    let testValue = playerValue;
    
    if (rank === 'A' && isSoft) {
      testValue = playerValue; // Ás soft não causa bust
    } else if (rank === 'A') {
      testValue = playerValue + 1; // Ás conta como 1 se necessário
    } else {
      testValue = playerValue + cardValue;
    }

    if (testValue > 21) {
      bustCards += count;
    }
  });

  const bustChance = totalRemaining > 0 ? (bustCards / totalRemaining) * 100 : 0;

  // Simulação Monte Carlo para calcular vitória
  let wins = 0;
  let losses = 0;
  let ties = 0;
  const simulations = 1000;

  for (let i = 0; i < simulations; i++) {
    let simDealerValue = dealerCard.value;
    let dealerHasAce = dealerCard.rank === 'A';

    // Dealer tira cartas até 17+
    while (simDealerValue < 17) {
      const randomCard = getRandomCardFromRemaining(remaining);
      if (randomCard === 11 && !dealerHasAce) dealerHasAce = true;
      simDealerValue += randomCard;

      if (simDealerValue > 21 && dealerHasAce) {
        simDealerValue -= 10;
        dealerHasAce = false;
      }
    }

    // Comparar
    if (simDealerValue > 21) {
      wins++;
    } else if (playerValue > simDealerValue) {
      wins++;
    } else if (playerValue === simDealerValue) {
      ties++;
    } else {
      losses++;
    }
  }

  const winChance = (wins / simulations) * 100;
  const tieChance = (ties / simulations) * 100;
  const loseChance = (losses / simulations) * 100;

  // Calcular EV e decisão ótima
  const { action, explanation } = getOptimalAction(
    playerCards,
    dealerCard,
    trueCount,
    winChance,
    bustChance
  );

  const ev = ((winChance / 100) * 1) + ((tieChance / 100) * 0) + ((loseChance / 100) * -1);

  return {
    winChance: Math.round(winChance * 10) / 10,
    bustChance: Math.round(bustChance * 10) / 10,
    optimalAction: action,
    expectedValue: Math.round(ev * 1000) / 1000,
    explanation,
  };
}

function getRandomCardFromRemaining(remaining: Record<Rank, number>): number {
  const availableRanks: Rank[] = [];
  Object.entries(remaining).forEach(([rank, count]) => {
    for (let i = 0; i < count; i++) {
      availableRanks.push(rank as Rank);
    }
  });
  
  if (availableRanks.length === 0) return 10;
  
  const randomRank = availableRanks[Math.floor(Math.random() * availableRanks.length)];
  return getCardValue(randomRank);
}

function getOptimalAction(
  playerCards: Card[],
  dealerCard: Card,
  trueCount: number,
  winChance: number,
  bustChance: number
): { action: string; explanation: string } {
  const { value: playerValue, isSoft } = calculateHandValue(playerCards);
  const dealerValue = dealerCard.value;
  const isPair = playerCards.length === 2 && playerCards[0].rank === playerCards[1].rank;
  const canDouble = playerCards.length === 2;

  // Bust
  if (playerValue > 21) {
    return { action: 'BUST', explanation: 'Você estourou 21.' };
  }

  // Blackjack natural
  if (playerValue === 21 && playerCards.length === 2) {
    return { action: 'BLACKJACK!', explanation: 'Blackjack natural! Aguarde resolução.' };
  }

  // 21 sem blackjack
  if (playerValue === 21) {
    return { action: 'STAND', explanation: '21 - sempre stand.' };
  }

  // Pares
  if (isPair) {
    const pairRank = playerCards[0].rank;
    if (pairRank === 'A' || pairRank === '8') {
      return { action: 'SPLIT', explanation: `Sempre divida ${pairRank}s. EV máximo.` };
    }
    if (['10', 'J', 'Q', 'K'].includes(pairRank)) {
      return { action: 'STAND', explanation: '20 é muito forte. Nunca divida.' };
    }
  }

  // Soft hands
  if (isSoft) {
    if (playerValue >= 19) {
      return { action: 'STAND', explanation: `Soft ${playerValue} é forte.` };
    }
    if (playerValue === 18 && dealerValue >= 9) {
      return { action: 'HIT', explanation: `Soft 18 vs ${dealerValue}: melhorar.` };
    }
    if (playerValue === 18) {
      return { action: 'STAND', explanation: 'Soft 18 é bom contra carta fraca.' };
    }
    if (canDouble && playerValue <= 17 && dealerValue >= 4 && dealerValue <= 6) {
      return { action: 'DOUBLE', explanation: `Soft ${playerValue} vs ${dealerValue}: dobrar maximiza EV.` };
    }
    return { action: 'HIT', explanation: `Soft ${playerValue}: seguro fazer hit.` };
  }

  // Hard 17+
  if (playerValue >= 17) {
    return { action: 'STAND', explanation: `${playerValue} é alto. Risco de bust: ${bustChance.toFixed(1)}%.` };
  }

  // Hard 11
  if (canDouble && playerValue === 11) {
    return { action: 'DOUBLE', explanation: '11 é a melhor mão para dobrar. Chance de 10: ~30%.' };
  }

  // Hard 10
  if (canDouble && playerValue === 10 && dealerValue <= 9) {
    return { action: 'DOUBLE', explanation: `10 vs ${dealerValue}: dobrar é ótimo.` };
  }

  // Hard 9
  if (canDouble && playerValue === 9 && dealerValue >= 3 && dealerValue <= 6) {
    return { action: 'DOUBLE', explanation: `9 vs ${dealerValue}: dealer fraco.` };
  }

  // Hard 12-16
  if (playerValue >= 12 && playerValue <= 16) {
    // Dealer mostra carta fraca (2-6)
    if (dealerValue >= 2 && dealerValue <= 6) {
      return { action: 'STAND', explanation: `${playerValue} vs ${dealerValue}: dealer tem ~42% de bust.` };
    }
    
    // Ajuste por True Count
    if (trueCount >= 2 && playerValue === 16 && dealerValue === 10) {
      return { action: 'STAND', explanation: `16 vs 10 com TC+${trueCount}: muitas cartas altas. Stand.` };
    }
    
    if (trueCount >= 1 && playerValue === 15 && dealerValue === 10) {
      return { action: 'STAND', explanation: `15 vs 10 com TC+${trueCount}: stand é melhor.` };
    }

    return { action: 'HIT', explanation: `${playerValue} vs ${dealerValue}: sua mão é fraca. Hit melhora EV.` };
  }

  // Hard ≤11
  if (playerValue <= 11) {
    return { action: 'HIT', explanation: `${playerValue} não pode bust. Sempre peça carta.` };
  }

  return { action: 'STAND', explanation: 'Stand é a decisão padrão.' };
}

// ===== COMPONENTES VISUAIS =====
function BlackjackCard({ card }: { card: Card }) {
  const isRed = card.suit === '♥' || card.suit === '♦';
  
  return (
    <div style={{
      width: 90,
      height: 130,
      background: '#fff',
      borderRadius: 10,
      border: '2px solid #e5e7eb',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute',
        top: 6,
        left: 8,
        fontSize: 16,
        fontWeight: 800,
        color: isRed ? '#dc2626' : '#1e293b',
      }}>
        {card.rank}
      </div>
      <div style={{ fontSize: 42, fontWeight: 700, color: isRed ? '#dc2626' : '#1e293b' }}>
        {card.suit}
      </div>
      <div style={{
        position: 'absolute',
        bottom: 6,
        right: 8,
        fontSize: 16,
        fontWeight: 800,
        color: isRed ? '#dc2626' : '#1e293b',
        transform: 'rotate(180deg)',
      }}>
        {card.rank}
      </div>
    </div>
  );
}

function CardSelector({ 
  onSelect, 
  usedCards = [],
  compact = false,
}: { 
  onSelect: (card: Card) => void; 
  usedCards?: Card[];
  compact?: boolean;
}) {
  const [selectedRank, setSelectedRank] = useState<Rank | null>(null);

  const isCardUsed = (rank: Rank, suit: Suit) => {
    return usedCards.some(card => card.rank === rank && card.suit === suit);
  };

  return (
    <div style={{ 
      padding: compact ? 12 : 20, 
      background: 'rgba(15, 23, 42, 0.6)', 
      borderRadius: 12,
      border: '1px solid rgba(100, 116, 139, 0.3)',
    }}>
      {/* Ranks */}
      <div style={{ marginBottom: compact ? 8 : 16 }}>
        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8, fontWeight: 600 }}>Valor</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {RANKS.map(rank => (
            <button
              key={rank}
              onClick={() => setSelectedRank(rank)}
              style={{
                padding: compact ? '8px 12px' : '10px 14px',
                background: selectedRank === rank ? '#8b5cf6' : '#334155',
                border: 'none',
                borderRadius: 8,
                color: '#fff',
                fontSize: compact ? 13 : 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {rank}
            </button>
          ))}
        </div>
      </div>

      {/* Suits */}
      {selectedRank && (
        <div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8, fontWeight: 600 }}>Naipe</div>
          <div style={{ display: 'flex', gap: 10 }}>
            {SUITS.map(suit => {
              const used = isCardUsed(selectedRank, suit);
              const isRed = suit === '♥' || suit === '♦';
              return (
                <button
                  key={suit}
                  onClick={() => !used && onSelect(createCard(selectedRank, suit))}
                  disabled={used}
                  style={{
                    flex: 1,
                    padding: compact ? '12px' : '16px',
                    background: used ? '#1e293b' : '#334155',
                    border: `2px solid ${used ? '#475569' : isRed ? '#dc2626' : '#1e293b'}`,
                    borderRadius: 10,
                    color: used ? '#64748b' : isRed ? '#dc2626' : '#fff',
                    fontSize: compact ? 28 : 32,
                    cursor: used ? 'not-allowed' : 'pointer',
                    opacity: used ? 0.4 : 1,
                  }}
                >
                  {suit}
                  {used && <div style={{ fontSize: 9, marginTop: 4 }}>Usada</div>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ===== PAYWALL =====
function PaywallScreen({ onBack }: { onBack: () => void }) {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: 700, margin: '60px auto', padding: '20px' }}>
      {/* Aviso Legal */}
      <div style={{
        marginBottom: 32,
        padding: 20,
        background: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fca5a5', margin: 0 }}>
            Ferramenta Educacional para Estudo Matemático
          </h3>
        </div>
        <p style={{ color: '#fca5a5', fontSize: 12, lineHeight: 1.6, margin: 0 }}>
          Não garante ganhos reais. Sem apostas. Sem cassino. Apenas simulação educacional.
        </p>
      </div>

      <div style={{
        padding: '48px 5%',
        textAlign: 'center',
        width: '100%',
        marginBottom: 32
      }}>
        <div style={{
          width: 100,
          height: 100,
          margin: '0 auto 24px',
          background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 48,
          boxShadow: '0 12px 32px rgba(139, 92, 246, 0.4)',
        }}>
          🎰
        </div>

        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12, color: '#f8fafc' }}>
          Blackjack Pro - Exclusivo PRO
        </h2>
        <p style={{ fontSize: 15, color: '#94a3b8', marginBottom: 32, lineHeight: 1.7 }}>
          Simulador profissional com controle total e cálculos em tempo real.
        </p>

        {/* Features */}
        <div style={{
          textAlign: 'left',
          marginBottom: 32,
          padding: 24,
          background: 'rgba(15, 23, 42, 0.6)',
          borderRadius: 12,
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#c084fc' }}>
            🎰 Recursos Exclusivos PRO:
          </h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {[
              'Entrada manual completa de cartas',
              'Probabilidades calculadas em TEMPO REAL',
              'Chance de vitória e bust instantâneas',
              'Melhor decisão matemática com EV',
              'Running Count e True Count integrados',
              'Configuração profissional de baralhos',
              'Simulador de cenários customizados',
              'Feedback educacional detalhado',
            ].map((feature, i) => (
              <li key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 12,
                color: '#e2e8f0',
                fontSize: 14,
              }}>
                <span style={{ color: '#10b981', fontSize: 18 }}>✓</span> {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Botões */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onBack} style={{
            flex: 1,
            padding: '14px',
            background: '#334155',
            border: 'none',
            borderRadius: 10,
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}>
            ← Voltar
          </button>
          <button onClick={() => navigate('/premium')} style={{
            flex: 2,
            padding: '16px',
            background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
            border: 'none',
            borderRadius: 10,
            color: '#fff',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 6px 20px rgba(139, 92, 246, 0.4)',
          }}>
            ⚡ Desbloquear PRO
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== SETUP SCREEN =====
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
    <div style={{ maxWidth: 800, margin: '40px auto', padding: '20px' }}>
      {/* Aviso Legal */}
      <div style={{
        marginBottom: 32,
        padding: 20,
        background: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fca5a5', margin: 0 }}>
            Ferramenta Educacional para Estudo Matemático
          </h3>
        </div>
        <p style={{ color: '#fca5a5', fontSize: 12, lineHeight: 1.6, margin: 0 }}>
          Não garante ganhos reais. Sem apostas. Sem cassino. Apenas simulação educacional.
        </p>
      </div>

      <h1 style={{
        fontSize: 32,
        fontWeight: 700,
        marginBottom: 12,
        textAlign: 'center',
        background: 'linear-gradient(135deg, #f8fafc, #8b5cf6)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}>
        🎰 Blackjack Pro
      </h1>
      <p style={{ textAlign: 'center', color: '#94a3b8', marginBottom: 32, fontSize: 14 }}>
        Manual Training Mode - Simulador Profissional
      </p>

      <div className="card" style={{ padding: 40 }}>
        {/* Baralhos */}
        <label style={{ display: 'block', marginBottom: 28 }}>
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12, fontWeight: 600 }}>
            Número de Baralhos
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {[1, 2, 4, 6, 8].map(count => (
              <button key={count} onClick={() => setConfig({ ...config, deckCount: count })} style={{
                flex: 1,
                padding: '12px',
                background: config.deckCount === count ? '#8b5cf6' : '#334155',
                border: 'none',
                borderRadius: 8,
                color: '#fff',
                fontSize: 14,
                fontWeight: config.deckCount === count ? 700 : 500,
                cursor: 'pointer',
              }}>
                {count}
              </button>
            ))}
          </div>
        </label>

        {/* Cut Card */}
        <label style={{ display: 'block', marginBottom: 32 }}>
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12, fontWeight: 600 }}>
            Cut Card (%)
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {[
              { label: '50%', value: 0.5 },
              { label: '60%', value: 0.6 },
              { label: '70%', value: 0.7 },
              { label: '75%', value: 0.75 },
            ].map(({ label, value }) => (
              <button key={value} onClick={() => setConfig({ ...config, cutCardPenetration: value })} style={{
                flex: 1,
                padding: '12px',
                background: config.cutCardPenetration === value ? '#3b82f6' : '#334155',
                border: 'none',
                borderRadius: 8,
                color: '#fff',
                fontSize: 13,
                fontWeight: config.cutCardPenetration === value ? 700 : 500,
                cursor: 'pointer',
              }}>
                {label}
              </button>
            ))}
          </div>
        </label>

        {/* Botão Iniciar */}
        <button onClick={onStart} style={{
          width: '100%',
          padding: '18px',
          background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
          border: 'none',
          borderRadius: 12,
          color: '#fff',
          fontSize: 16,
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 6px 20px rgba(139, 92, 246, 0.4)',
        }}>
          🎰 Iniciar Simulador
        </button>
      </div>
    </div>
  );
}

// ===== PLAYING SCREEN =====
function PlayingScreen({
  config,
  onExit,
}: {
  config: GameConfig;
  onExit: () => void;
}) {
  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [dealerCard, setDealerCard] = useState<Card | null>(null);
  const [allUsedCards, setAllUsedCards] = useState<Card[]>([]);
  const [showPlayerSelector, setShowPlayerSelector] = useState(true);
  const [showDealerSelector, setShowDealerSelector] = useState(false);

  const runningCount = calculateRunningCount(allUsedCards);
  const totalCards = config.deckCount * 52;
  const usedCardsCount = allUsedCards.length;
  const decksRemaining = (totalCards - usedCardsCount) / 52;
  const trueCount = calculateTrueCount(runningCount, decksRemaining);

  const { value: playerValue, isSoft: playerSoft } = calculateHandValue(playerCards);
  const playerBust = playerValue > 21;

  // Calcular probabilidades em tempo real
  const probabilities = calculateProbabilities(
    playerCards,
    dealerCard,
    config.deckCount,
    allUsedCards,
    trueCount
  );

  const handleAddPlayerCard = (card: Card) => {
    setPlayerCards([...playerCards, card]);
    setAllUsedCards([...allUsedCards, card]);
    setShowPlayerSelector(true);
  };

  const handleSetDealerCard = (card: Card) => {
    setDealerCard(card);
    setAllUsedCards([...allUsedCards, card]);
    setShowDealerSelector(false);
  };

  const handleAction = (action: string) => {
    if (action === 'RESET') {
      setPlayerCards([]);
      setDealerCard(null);
      setShowPlayerSelector(true);
      setShowDealerSelector(false);
      // Manter cartas usadas para contagem contínua
    }
    
    if (action === 'NEW_SHOE') {
      setPlayerCards([]);
      setDealerCard(null);
      setAllUsedCards([]);
      setShowPlayerSelector(true);
      setShowDealerSelector(false);
    }
  };

  return (
    <div style={{ maxWidth: 1400, margin: '20px auto', padding: '20px' }}>
      {/* Header com Contadores */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        padding: '16px 24px',
        background: 'rgba(15, 23, 42, 0.8)',
        borderRadius: 12,
        border: '1px solid rgba(100, 116, 139, 0.3)',
      }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
            🎰 Blackjack Pro - Manual Training
          </h2>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0' }}>
            {config.deckCount} baralho(s) • Cut: {(config.cutCardPenetration * 100).toFixed(0)}%
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: 20 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4 }}>Running</div>
            <div style={{ 
              fontSize: 20, 
              fontWeight: 800, 
              color: runningCount > 0 ? '#10b981' : runningCount < 0 ? '#ef4444' : '#64748b' 
            }}>
              {runningCount >= 0 ? '+' : ''}{runningCount}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4 }}>True Count</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#8b5cf6' }}>
              {trueCount >= 0 ? '+' : ''}{trueCount.toFixed(1)}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4 }}>Decks Left</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#60a5fa' }}>
              {decksRemaining.toFixed(1)}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4 }}>Usadas</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#f59e0b' }}>
              {usedCardsCount}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 24 }}>
        {/* Mesa */}
        <div>
          {/* Dealer */}
          <div className="card" style={{ padding: 32, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                🎰 Dealer {dealerCard && `- ${dealerCard.value}`}
              </h3>
              {!dealerCard && (
                <button onClick={() => setShowDealerSelector(!showDealerSelector)} style={{
                  padding: '8px 16px',
                  background: showDealerSelector ? '#ef4444' : '#8b5cf6',
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}>
                  {showDealerSelector ? '✕ Fechar' : '+ Adicionar'}
                </button>
              )}
            </div>
            
            {dealerCard ? (
              <div style={{ display: 'flex', gap: 12 }}>
                <BlackjackCard card={dealerCard} />
              </div>
            ) : (
              <div style={{
                width: 90,
                height: 130,
                border: '2px dashed #475569',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b',
                fontSize: 12,
              }}>
                Vazio
              </div>
            )}

            {showDealerSelector && !dealerCard && (
              <div style={{ marginTop: 16 }}>
                <CardSelector onSelect={handleSetDealerCard} usedCards={allUsedCards} compact />
              </div>
            )}
          </div>

          {/* Player */}
          <div className="card" style={{ padding: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                👤 Você {playerCards.length > 0 && `- ${playerValue}`}
                {playerSoft && ' (Soft)'}
                {playerBust && ' - BUST!'}
              </h3>
              <button onClick={() => setShowPlayerSelector(!showPlayerSelector)} style={{
                padding: '8px 16px',
                background: showPlayerSelector ? '#ef4444' : '#10b981',
                border: 'none',
                borderRadius: 8,
                color: '#fff',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}>
                {showPlayerSelector ? '✕ Fechar' : '+ Adicionar Carta'}
              </button>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: showPlayerSelector ? 16 : 0, flexWrap: 'wrap' }}>
              {playerCards.map((card, i) => (
                <BlackjackCard key={i} card={card} />
              ))}
              {playerCards.length === 0 && (
                <div style={{
                  width: 90,
                  height: 130,
                  border: '2px dashed #475569',
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                  fontSize: 12,
                }}>
                  Vazio
                </div>
              )}
            </div>

            {showPlayerSelector && (
              <CardSelector onSelect={handleAddPlayerCard} usedCards={allUsedCards} compact />
            )}
          </div>

          {/* Ações */}
          <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
            <button onClick={() => handleAction('RESET')} style={{
              flex: 1,
              padding: '14px',
              background: '#334155',
              border: 'none',
              borderRadius: 10,
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}>
              🔄 Nova Mão
            </button>
            <button onClick={() => handleAction('NEW_SHOE')} style={{
              flex: 1,
              padding: '14px',
              background: '#475569',
              border: 'none',
              borderRadius: 10,
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}>
              🃏 Novo Shoe
            </button>
            <button onClick={onExit} style={{
              flex: 1,
              padding: '14px',
              background: '#1e293b',
              border: 'none',
              borderRadius: 10,
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}>
              ← Sair
            </button>
          </div>
        </div>

        {/* Painel de Análise */}
        <div>
          {/* Probabilidades */}
          <div className="card" style={{ padding: 24, marginBottom: 16, background: 'rgba(139, 92, 246, 0.05)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: '#c084fc' }}>
              📊 Análise em Tempo Real
            </h3>
            
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>Chance de Vitória</div>
              <div style={{
                padding: '12px',
                background: 'rgba(16, 185, 129, 0.1)',
                borderRadius: 8,
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#10b981' }}>
                  {probabilities.winChance.toFixed(1)}%
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>Chance de Bust (Próximo Hit)</div>
              <div style={{
                padding: '12px',
                background: 'rgba(239, 68, 68, 0.1)',
                borderRadius: 8,
                border: '1px solid rgba(239, 68, 68, 0.3)',
              }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#ef4444' }}>
                  {probabilities.bustChance.toFixed(1)}%
                </div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>Expected Value</div>
              <div style={{
                padding: '12px',
                background: 'rgba(139, 92, 246, 0.1)',
                borderRadius: 8,
                border: '1px solid rgba(139, 92, 246, 0.3)',
              }}>
                <div style={{ 
                  fontSize: 24, 
                  fontWeight: 800, 
                  color: probabilities.expectedValue >= 0 ? '#8b5cf6' : '#f97316' 
                }}>
                  {probabilities.expectedValue >= 0 ? '+' : ''}{probabilities.expectedValue.toFixed(3)}
                </div>
              </div>
            </div>
          </div>

          {/* Decisão Ótima */}
          <div className="card" style={{ padding: 24, background: 'rgba(16, 185, 129, 0.05)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: '#6ee7b7' }}>
              🎯 Decisão Matemática Ótima
            </h3>
            
            <div style={{
              padding: '16px',
              background: 'rgba(16, 185, 129, 0.1)',
              borderRadius: 10,
              border: '2px solid rgba(16, 185, 129, 0.3)',
              marginBottom: 16,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#10b981' }}>
                {probabilities.optimalAction}
              </div>
            </div>

            <div style={{
              padding: 16,
              background: 'rgba(15, 23, 42, 0.6)',
              borderRadius: 8,
              border: '1px solid rgba(100, 116, 139, 0.2)',
            }}>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8, fontWeight: 600 }}>
                💡 Explicação
              </div>
              <p style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.6, margin: 0 }}>
                {probabilities.explanation}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== COMPONENTE PRINCIPAL =====
export default function BlackjackPro() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<GameState>('SETUP');
  const [config, setConfig] = useState<GameConfig>({
    deckCount: 6,
    cutCardPenetration: 0.75,
  });

  const isPremium = auth.user?.premium || false;

  // Paywall para não-premium
  if (!isPremium) {
    return <PaywallScreen onBack={() => navigate('/')} />;
  }

  if (gameState === 'SETUP') {
    return (
      <SetupScreen
        config={config}
        setConfig={setConfig}
        onStart={() => setGameState('PLAYING')}
      />
    );
  }

  if (gameState === 'PLAYING') {
    return (
      <PlayingScreen
        config={config}
        onExit={() => setGameState('SETUP')}
      />
    );
  }

  return null;
}
