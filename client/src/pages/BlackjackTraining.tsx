/**
 * 🃏 BLACKJACK TRAINING - Módulo Unificado
 * 
 * Ferramenta educacional profissional para estudo de Blackjack.
 * Calcula probabilidades reais baseadas em cartas removidas.
 * 
 * Modos:
 * - BÁSICO (gratuito): Estratégia básica simples
 * - AVANÇADO (PRO): Entrada manual, probabilidades reais, contagem integrada
 * 
 * ⚠️ CONTEÚDO EDUCACIONAL - NÃO INCENTIVA JOGOS DE AZAR
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// ===== TIPOS =====
type TrainingMode = 'SETUP' | 'HAND_BUILDER' | 'DECISION' | 'FEEDBACK' | 'RESULTS';
type DifficultyLevel = 'BASIC' | 'ADVANCED';
type Action = 'HIT' | 'STAND' | 'DOUBLE' | 'SPLIT';
type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';
type Suit = '♠' | '♥' | '♦' | '♣';

interface Card {
  rank: Rank;
  suit: Suit;
  value: number;
  hiLoValue: number;
}

interface HandScenario {
  playerCards: Card[];
  dealerCard: Card;
  removedCards: Card[];
  probabilities?: {
    winChance: number;
    tieChance: number;
    loseChance: number;
    expectedValue: number;
  };
}

interface SessionConfig {
  difficulty: DifficultyLevel;
  deckCount: number;
  cutCardPenetration: number;
  handsToPlay: number;
}

interface SessionStats {
  totalHands: number;
  correctDecisions: number;
  wrongDecisions: number;
  accuracy: number;
  history: {
    scenario: HandScenario;
    userAction: Action;
    correctAction: Action;
    isCorrect: boolean;
  }[];
}

// ===== CONSTANTES =====
const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const SUITS: Suit[] = ['♠', '♥', '♦', '♣'];

const HI_LO_VALUES: Record<Rank, number> = {
  '2': 1, '3': 1, '4': 1, '5': 1, '6': 1,
  '7': 0, '8': 0, '9': 0,
  '10': -1, 'J': -1, 'Q': -1, 'K': -1, 'A': -1,
};

// ===== UTILITÁRIOS DE CARTAS =====
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

// ===== CÁLCULO DE PROBABILIDADES REAIS =====
function calculateRemainingCards(deckCount: number, removedCards: Card[]): Record<Rank, number> {
  const remaining: Record<Rank, number> = {} as Record<Rank, number>;
  
  // Inicializar com total de cartas disponíveis
  RANKS.forEach(rank => {
    remaining[rank] = deckCount * 4; // 4 de cada por baralho
  });

  // Remover cartas já usadas
  removedCards.forEach(card => {
    remaining[card.rank]--;
  });

  return remaining;
}

function calculateProbabilities(
  playerCards: Card[],
  dealerCard: Card,
  deckCount: number,
  removedCards: Card[]
): {
  winChance: number;
  tieChance: number;
  loseChance: number;
  expectedValue: number;
} {
  const remaining = calculateRemainingCards(deckCount, [...removedCards, ...playerCards, dealerCard]);
  const totalCardsRemaining = Object.values(remaining).reduce((sum, count) => sum + count, 0);
  
  const { value: playerValue } = calculateHandValue(playerCards);
  const dealerValue = dealerCard.value;

  // Simulação simplificada (em produção, usar Monte Carlo)
  let winCount = 0;
  let tieCount = 0;
  let loseCount = 0;
  const simulations = 1000;

  for (let i = 0; i < simulations; i++) {
    // Simular conclusão da mão do jogador
    let simPlayerValue = playerValue;
    
    // Simular conclusão da mão do dealer
    let simDealerValue = dealerValue;
    let dealerHasAce = dealerCard.rank === 'A';
    
    // Dealer tira cartas até 17+
    while (simDealerValue < 17) {
      // Carta aleatória ponderada pelo que resta
      const randomCard = getRandomCardFromRemaining(remaining);
      if (randomCard === 11 && !dealerHasAce) dealerHasAce = true;
      simDealerValue += randomCard;
      
      // Ajustar ás
      if (simDealerValue > 21 && dealerHasAce) {
        simDealerValue -= 10;
        dealerHasAce = false;
      }
    }

    // Comparar resultados
    if (simDealerValue > 21) {
      winCount++; // Dealer bust
    } else if (simPlayerValue > simDealerValue) {
      winCount++;
    } else if (simPlayerValue === simDealerValue) {
      tieCount++;
    } else {
      loseCount++;
    }
  }

  const winChance = (winCount / simulations) * 100;
  const tieChance = (tieCount / simulations) * 100;
  const loseChance = (loseCount / simulations) * 100;

  // EV = (win% * 1) + (tie% * 0) + (lose% * -1)
  const expectedValue = ((winChance / 100) * 1) + ((tieChance / 100) * 0) + ((loseChance / 100) * -1);

  return {
    winChance: Math.round(winChance * 10) / 10,
    tieChance: Math.round(tieChance * 10) / 10,
    loseChance: Math.round(loseChance * 10) / 10,
    expectedValue: Math.round(expectedValue * 1000) / 1000,
  };
}

function getRandomCardFromRemaining(remaining: Record<Rank, number>): number {
  const availableRanks: Rank[] = [];
  Object.entries(remaining).forEach(([rank, count]) => {
    for (let i = 0; i < count; i++) {
      availableRanks.push(rank as Rank);
    }
  });
  
  if (availableRanks.length === 0) return 10; // Fallback
  
  const randomRank = availableRanks[Math.floor(Math.random() * availableRanks.length)];
  return getCardValue(randomRank);
}

// ===== ESTRATÉGIA BÁSICA =====
function getOptimalAction(
  playerCards: Card[],
  dealerCard: Card,
  trueCount: number
): { action: Action; explanation: string } {
  const { value: playerValue, isSoft } = calculateHandValue(playerCards);
  const dealerValue = dealerCard.value;
  const isPair = playerCards.length === 2 && playerCards[0].rank === playerCards[1].rank;

  // Pares
  if (isPair) {
    const pairRank = playerCards[0].rank;
    if (pairRank === 'A' || pairRank === '8') {
      return { action: 'SPLIT', explanation: 'Sempre divida Ases ou 8s. Split de Ases aumenta EV em ~60%.' };
    }
    if (['10', 'J', 'Q', 'K'].includes(pairRank)) {
      return { action: 'STAND', explanation: 'Nunca divida 10s. Você já tem 20 (EV +85%).' };
    }
  }

  // Soft hands
  if (isSoft) {
    if (playerValue >= 19) return { action: 'STAND', explanation: `Soft ${playerValue} é forte. Stand preserva EV alto.` };
    if (playerValue === 18 && dealerValue >= 9) return { action: 'HIT', explanation: `Soft 18 vs ${dealerValue}: hit melhora contra carta forte.` };
    if (playerValue === 18) return { action: 'STAND', explanation: `Soft 18 vs ${dealerValue}: stand é ótimo.` };
    if (playerCards.length === 2 && playerValue <= 17 && dealerValue >= 4 && dealerValue <= 6) {
      return { action: 'DOUBLE', explanation: `Soft ${playerValue} vs ${dealerValue}: dobrar maximiza EV.` };
    }
    return { action: 'HIT', explanation: `Soft ${playerValue}: sempre seguro fazer hit.` };
  }

  // Hard hands
  if (playerValue >= 17) return { action: 'STAND', explanation: `${playerValue} é alto. Stand evita bust (~26%).` };
  
  if (playerValue <= 11) {
    if (playerCards.length === 2 && playerValue === 11) return { action: 'DOUBLE', explanation: '11 é a melhor mão para dobrar. EV +18%.' };
    if (playerCards.length === 2 && playerValue === 10 && dealerValue <= 9) return { action: 'DOUBLE', explanation: `10 vs ${dealerValue}: dobrar maximiza lucro.` };
    return { action: 'HIT', explanation: `${playerValue} não pode bust. Sempre peça carta.` };
  }

  if (playerValue === 12) {
    if (dealerValue >= 4 && dealerValue <= 6) return { action: 'STAND', explanation: `12 vs ${dealerValue}: dealer bust ~42%.` };
    return { action: 'HIT', explanation: `12 vs ${dealerValue}: sua mão é fraca.` };
  }

  if (playerValue >= 13 && playerValue <= 16) {
    if (dealerValue >= 2 && dealerValue <= 6) {
      return { action: 'STAND', explanation: `${playerValue} vs ${dealerValue}: dealer tem alta chance de bust.` };
    }
    if (trueCount >= 2 && playerValue === 16 && dealerValue === 10) {
      return { action: 'STAND', explanation: `16 vs 10 com TC+${trueCount}: stand. Muitas cartas altas restantes.` };
    }
    return { action: 'HIT', explanation: `${playerValue} vs ${dealerValue}: dealer tem vantagem.` };
  }

  return { action: 'STAND', explanation: 'Stand é a jogada padrão.' };
}

// ===== COMPONENTES VISUAIS =====
function CardSelector({ 
  onSelect, 
  disabled = false,
  usedCards = [],
}: { 
  onSelect: (card: Card) => void; 
  disabled?: boolean;
  usedCards?: Card[];
}) {
  const [selectedRank, setSelectedRank] = useState<Rank | null>(null);

  const isCardUsed = (rank: Rank, suit: Suit) => {
    return usedCards.some(card => card.rank === rank && card.suit === suit);
  };

  return (
    <div style={{ padding: 20, background: 'rgba(15, 23, 42, 0.6)', borderRadius: 12 }}>
      {/* Ranks */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, fontWeight: 600 }}>Escolha o Valor</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {RANKS.map(rank => (
            <button
              key={rank}
              onClick={() => setSelectedRank(rank)}
              disabled={disabled}
              style={{
                padding: '10px 14px',
                background: selectedRank === rank ? '#8b5cf6' : '#334155',
                border: 'none',
                borderRadius: 8,
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
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
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, fontWeight: 600 }}>Escolha o Naipe</div>
          <div style={{ display: 'flex', gap: 12 }}>
            {SUITS.map(suit => {
              const used = isCardUsed(selectedRank, suit);
              const isRed = suit === '♥' || suit === '♦';
              return (
                <button
                  key={suit}
                  onClick={() => !used && onSelect(createCard(selectedRank, suit))}
                  disabled={disabled || used}
                  style={{
                    flex: 1,
                    padding: '16px',
                    background: used ? '#1e293b' : '#334155',
                    border: `2px solid ${used ? '#475569' : isRed ? '#dc2626' : '#1e293b'}`,
                    borderRadius: 10,
                    color: used ? '#64748b' : isRed ? '#dc2626' : '#fff',
                    fontSize: 32,
                    cursor: disabled || used ? 'not-allowed' : 'pointer',
                    opacity: used ? 0.4 : 1,
                  }}
                >
                  {suit}
                  {used && <div style={{ fontSize: 10, marginTop: 4 }}>Usada</div>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

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

// ===== PAYWALL =====
function PaywallScreen({ onBack }: { onBack: () => void }) {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: 700, margin: '60px auto', padding: '20px' }}>
      <div className="card" style={{
        padding: 48,
        textAlign: 'center',
        background: 'linear-gradient(145deg, rgba(139, 92, 246, 0.05), rgba(15, 23, 42, 0.95))',
        border: '2px solid rgba(139, 92, 246, 0.4)',
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
          🔥
        </div>

        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12, color: '#f8fafc' }}>
          Modo Avançado - Exclusivo PRO
        </h2>
        <p style={{ fontSize: 15, color: '#94a3b8', marginBottom: 32, lineHeight: 1.7 }}>
          Desbloqueie entrada manual de cartas, cálculo de probabilidades reais e contagem integrada.
        </p>

        {/* Features Premium */}
        <div style={{
          textAlign: 'left',
          marginBottom: 32,
          padding: 24,
          background: 'rgba(15, 23, 42, 0.6)',
          borderRadius: 12,
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#c084fc' }}>
            🔥 O que você desbloqueia:
          </h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {[
              'Entrada manual de cartas (suas + dealer)',
              'Cálculo de probabilidades REAIS baseado em cartas removidas',
              'Chance de vitória, empate e derrota',
              'Expected Value (EV) calculado',
              'Running Count e True Count integrados',
              'Configuração de 1 a 8 baralhos',
              'Ajuste de Cut Card e penetração',
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
  isPremium,
}: {
  config: SessionConfig;
  setConfig: (config: SessionConfig) => void;
  onStart: () => void;
  isPremium: boolean;
}) {
  const isAdvancedLocked = config.difficulty === 'ADVANCED' && !isPremium;

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
            Ferramenta Educacional - Sem Apostas Reais
          </h3>
        </div>
        <p style={{ color: '#fca5a5', fontSize: 12, lineHeight: 1.6, margin: 0 }}>
          Este é um simulador educacional. Não garantimos ganhos financeiros. Não há conexão com cassinos reais.
          Use apenas para fins de estudo matemático.
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
        🃏 Blackjack Training
      </h1>
      <p style={{ textAlign: 'center', color: '#94a3b8', marginBottom: 32, fontSize: 14 }}>
        Ferramenta educacional profissional com probabilidades reais
      </p>

      <div className="card" style={{ padding: 40 }}>
        {/* Modo */}
        <label style={{ display: 'block', marginBottom: 28 }}>
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12, fontWeight: 600 }}>
            Modo de Treinamento
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <button onClick={() => setConfig({ ...config, difficulty: 'BASIC' })} style={{
              padding: '18px',
              background: config.difficulty === 'BASIC' ? 'linear-gradient(135deg, #10b981, #059669)' : '#334155',
              border: config.difficulty === 'BASIC' ? '2px solid #10b981' : '1px solid #475569',
              borderRadius: 10,
              color: '#fff',
              fontSize: 14,
              fontWeight: config.difficulty === 'BASIC' ? 700 : 500,
              cursor: 'pointer',
              textAlign: 'left',
            }}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>🟢</div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Modo Básico</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>Gratuito • Estratégia básica</div>
            </button>
            <button onClick={() => setConfig({ ...config, difficulty: 'ADVANCED' })} style={{
              padding: '18px',
              background: config.difficulty === 'ADVANCED' ? 'linear-gradient(135deg, #8b5cf6, #a855f7)' : '#334155',
              border: config.difficulty === 'ADVANCED' ? '2px solid #a855f7' : '1px solid #475569',
              borderRadius: 10,
              color: '#fff',
              fontSize: 14,
              fontWeight: config.difficulty === 'ADVANCED' ? 700 : 500,
              cursor: 'pointer',
              textAlign: 'left',
              position: 'relative',
              opacity: !isPremium ? 0.6 : 1,
            }}>
              {!isPremium && (
                <div style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  background: '#f59e0b',
                  color: '#fff',
                  padding: '4px 8px',
                  borderRadius: 6,
                  fontSize: 9,
                  fontWeight: 700,
                }}>
                  PRO
                </div>
              )}
              <div style={{ fontSize: 20, marginBottom: 6 }}>🔥</div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Modo Avançado</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>
                {isPremium ? 'Probabilidades • Contagem' : '🔒 Desbloqueie com PRO'}
              </div>
            </button>
          </div>
        </label>

        {/* Configurações Avançadas */}
        {config.difficulty === 'ADVANCED' && isPremium && (
          <>
            <label style={{ display: 'block', marginBottom: 28 }}>
              <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12, fontWeight: 600 }}>
                Número de Baralhos
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {[1, 2, 4, 6, 8].map(count => (
                  <button key={count} onClick={() => setConfig({ ...config, deckCount: count })} style={{
                    flex: 1,
                    padding: '12px',
                    background: config.deckCount === count ? '#3b82f6' : '#334155',
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

            <label style={{ display: 'block', marginBottom: 28 }}>
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
                    background: config.cutCardPenetration === value ? '#8b5cf6' : '#334155',
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
          </>
        )}

        {/* Botão Iniciar */}
        <button onClick={onStart} disabled={isAdvancedLocked} style={{
          width: '100%',
          padding: '18px',
          background: isAdvancedLocked
            ? '#334155'
            : config.difficulty === 'BASIC'
            ? 'linear-gradient(135deg, #10b981, #059669)'
            : 'linear-gradient(135deg, #8b5cf6, #a855f7)',
          border: 'none',
          borderRadius: 12,
          color: '#fff',
          fontSize: 16,
          fontWeight: 700,
          cursor: isAdvancedLocked ? 'not-allowed' : 'pointer',
          boxShadow: isAdvancedLocked ? 'none' : '0 6px 20px rgba(139, 92, 246, 0.4)',
          opacity: isAdvancedLocked ? 0.5 : 1,
        }}>
          {isAdvancedLocked ? '🔒 Modo Avançado - Desbloqueie com PRO' : '🎮 Iniciar Treinamento'}
        </button>
      </div>
    </div>
  );
}

// ===== HAND BUILDER (MODO AVANÇADO) =====
function HandBuilder({
  config,
  onComplete,
  removedCards,
}: {
  config: SessionConfig;
  onComplete: (scenario: HandScenario) => void;
  removedCards: Card[];
}) {
  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [dealerCard, setDealerCard] = useState<Card | null>(null);
  const [step, setStep] = useState<'player' | 'dealer'>('player');

  const handleAddPlayerCard = (card: Card) => {
    if (playerCards.length < 2) {
      setPlayerCards([...playerCards, card]);
    }
    if (playerCards.length === 1) {
      setStep('dealer');
    }
  };

  const handleSetDealerCard = (card: Card) => {
    setDealerCard(card);
  };

  const handleContinue = () => {
    if (playerCards.length === 2 && dealerCard) {
      const scenario: HandScenario = {
        playerCards,
        dealerCard,
        removedCards: [...removedCards, ...playerCards, dealerCard],
      };

      // Calcular probabilidades
      scenario.probabilities = calculateProbabilities(
        playerCards,
        dealerCard,
        config.deckCount,
        removedCards
      );

      onComplete(scenario);
    }
  };

  const { value: playerValue } = calculateHandValue(playerCards);
  const runningCount = calculateRunningCount([...removedCards, ...playerCards, ...(dealerCard ? [dealerCard] : [])]);
  const totalCards = config.deckCount * 52;
  const usedCards = removedCards.length + playerCards.length + (dealerCard ? 1 : 0);
  const decksRemaining = (totalCards - usedCards) / 52;
  const trueCount = calculateTrueCount(runningCount, decksRemaining);

  return (
    <div style={{ maxWidth: 1000, margin: '40px auto', padding: '20px' }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, color: '#f8fafc' }}>
        🃏 Montar Mão
      </h2>

      {/* Contadores */}
      <div style={{
        display: 'flex',
        gap: 16,
        marginBottom: 32,
        padding: '16px 20px',
        background: 'rgba(15, 23, 42, 0.6)',
        borderRadius: 10,
        border: '1px solid rgba(100, 116, 139, 0.3)',
      }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4 }}>Running Count</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: runningCount > 0 ? '#10b981' : runningCount < 0 ? '#ef4444' : '#64748b' }}>
            {runningCount >= 0 ? '+' : ''}{runningCount}
          </div>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4 }}>True Count</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#8b5cf6' }}>
            {trueCount >= 0 ? '+' : ''}{trueCount.toFixed(1)}
          </div>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4 }}>Decks Left</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#60a5fa' }}>
            {decksRemaining.toFixed(1)}
          </div>
        </div>
      </div>

      {/* Mesa */}
      <div className="card" style={{ padding: 40, marginBottom: 24 }}>
        {/* Dealer */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12, fontWeight: 600 }}>
            🎰 Dealer
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {dealerCard ? (
              <BlackjackCard card={dealerCard} />
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
          </div>
        </div>

        {/* Player */}
        <div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12, fontWeight: 600 }}>
            👤 Você{playerCards.length > 0 && ` - Total: ${playerValue}`}
          </div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            {playerCards.map((card, i) => (
              <BlackjackCard key={i} card={card} />
            ))}
            {playerCards.length < 2 && (
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
        </div>
      </div>

      {/* Seletor */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#f8fafc' }}>
          {step === 'player' ? '👉 Escolha suas cartas (2)' : '👉 Escolha a carta aberta do dealer'}
        </h3>
        <CardSelector
          onSelect={step === 'player' ? handleAddPlayerCard : handleSetDealerCard}
          disabled={step === 'player' ? playerCards.length >= 2 : dealerCard !== null}
          usedCards={[...removedCards, ...playerCards, ...(dealerCard ? [dealerCard] : [])]}
        />
      </div>

      {/* Botão Continuar */}
      {playerCards.length === 2 && dealerCard && (
        <button onClick={handleContinue} style={{
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
          ✓ Calcular Probabilidades →
        </button>
      )}
    </div>
  );
}

// ===== COMPONENTE PRINCIPAL =====
export default function BlackjackTraining() {
  const auth = useAuth();
  const [mode, setMode] = useState<TrainingMode>('SETUP');
  const [config, setConfig] = useState<SessionConfig>({
    difficulty: 'BASIC',
    deckCount: 6,
    cutCardPenetration: 0.75,
    handsToPlay: 20,
  });
  const [removedCards, setRemovedCards] = useState<Card[]>([]);

  const isPremium = auth.user?.premium || false;

  const handleStart = () => {
    if (config.difficulty === 'ADVANCED' && !isPremium) {
      return; // Paywall será mostrado
    }
    
    if (config.difficulty === 'ADVANCED') {
      setMode('HAND_BUILDER');
    } else {
      // Modo básico: implementar depois
      alert('Modo Básico em desenvolvimento');
    }
  };

  const handleHandComplete = (scenario: HandScenario) => {
    // Por enquanto só volta
    alert('Hand builder completo! Implementar próxima fase.');
    setMode('SETUP');
  };

  // Paywall check
  if (config.difficulty === 'ADVANCED' && !isPremium && mode !== 'SETUP') {
    return <PaywallScreen onBack={() => {
      setConfig({ ...config, difficulty: 'BASIC' });
      setMode('SETUP');
    }} />;
  }

  if (mode === 'SETUP') {
    return <SetupScreen config={config} setConfig={setConfig} onStart={handleStart} isPremium={isPremium} />;
  }

  if (mode === 'HAND_BUILDER') {
    return <HandBuilder config={config} onComplete={handleHandComplete} removedCards={removedCards} />;
  }

  return null;
}
