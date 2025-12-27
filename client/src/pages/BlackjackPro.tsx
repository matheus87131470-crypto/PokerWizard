/**
 * BLACKJACK PRO TRAINER - Modo Avançado Premium
 * 
 * Ferramenta educacional profissional para estudo sério de Blackjack.
 * Simula ambiente real de cassino com feedback matemático e estratégico.
 * 
 * ⚠️ CONTEÚDO EDUCACIONAL - NÃO INCENTIVA JOGOS DE AZAR
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// ===== TIPOS =====
type TrainingMode = 'SETUP' | 'PLAYING' | 'FEEDBACK' | 'RESULTS';
type DifficultyLevel = 'BEGINNER' | 'ADVANCED';
type Action = 'HIT' | 'STAND' | 'DOUBLE' | 'SPLIT';
type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';
type Suit = '♠' | '♥' | '♦' | '♣';

interface Card {
  rank: Rank;
  suit: Suit;
  value: number;
  hiLoValue: number;
}

interface HandResult {
  playerCards: Card[];
  dealerCards: Card[];
  userAction: Action;
  correctAction: Action;
  isCorrect: boolean;
  evImpact: number;
  explanation: string;
  runningCount: number;
  trueCount: number;
}

interface SessionConfig {
  difficulty: DifficultyLevel;
  deckCount: number;
  cutCardPenetration: number; // 0.5 = 50%, 0.75 = 75%
  handsToPlay: number;
}

interface SessionStats {
  totalHands: number;
  correctDecisions: number;
  wrongDecisions: number;
  accuracy: number;
  evTotal: number;
  decisionsByType: Record<Action, { correct: number; total: number }>;
  commonMistakes: string[];
  history: HandResult[];
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

function createShoe(deckCount: number): Card[] {
  const shoe: Card[] = [];
  for (let d = 0; d < deckCount; d++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        shoe.push(createCard(rank, suit));
      }
    }
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

function calculateTrueCount(runningCount: number, decksRemaining: number): number {
  if (decksRemaining <= 0) return 0;
  return Math.round((runningCount / decksRemaining) * 10) / 10;
}

function getOptimalAction(
  playerCards: Card[],
  dealerCard: Card,
  trueCount: number
): { action: Action; explanation: string; evImpact: number } {
  const { value: playerValue, isSoft } = calculateHandValue(playerCards);
  const dealerValue = dealerCard.value;
  const isPair = playerCards.length === 2 && playerCards[0].rank === playerCards[1].rank;

  // Pares
  if (isPair) {
    const pairRank = playerCards[0].rank;
    if (pairRank === 'A' || pairRank === '8') {
      return {
        action: 'SPLIT',
        explanation: `Sempre divida Ases ou 8s. Split de Ases aumenta EV em ~60%.`,
        evImpact: 0.15,
      };
    }
    if (pairRank === '10' || ['J', 'Q', 'K'].includes(pairRank)) {
      return {
        action: 'STAND',
        explanation: `Nunca divida 10s. Você já tem 20 (EV +85%).`,
        evImpact: 0.20,
      };
    }
  }

  // Soft hands
  if (isSoft) {
    if (playerValue >= 19) {
      return { action: 'STAND', explanation: `Soft ${playerValue} é forte. Stand preserva EV alto.`, evImpact: 0.10 };
    }
    if (playerValue === 18 && dealerValue >= 9) {
      return { action: 'HIT', explanation: `Soft 18 vs ${dealerValue}: hit melhora EV contra carta forte.`, evImpact: 0.05 };
    }
    if (playerValue === 18) {
      return { action: 'STAND', explanation: `Soft 18 vs ${dealerValue}: stand é ótimo (EV ~0%).`, evImpact: 0.02 };
    }
    if (playerCards.length === 2 && playerValue <= 17 && dealerValue >= 4 && dealerValue <= 6) {
      return {
        action: 'DOUBLE',
        explanation: `Soft ${playerValue} vs ${dealerValue}: dobrar maximiza EV (+12%).`,
        evImpact: 0.12,
      };
    }
    return { action: 'HIT', explanation: `Soft ${playerValue}: hit é sempre seguro e melhora a mão.`, evImpact: 0.03 };
  }

  // Hard hands
  if (playerValue >= 17) {
    return { action: 'STAND', explanation: `${playerValue} é alto. Stand evita bust (~26% de chance).`, evImpact: 0.08 };
  }

  if (playerValue <= 11) {
    if (playerCards.length === 2 && playerValue === 11) {
      return { action: 'DOUBLE', explanation: `11 é a melhor mão para dobrar. EV aumenta ~18%.`, evImpact: 0.18 };
    }
    if (playerCards.length === 2 && playerValue === 10 && dealerValue <= 9) {
      return { action: 'DOUBLE', explanation: `10 vs ${dealerValue}: dobrar maximiza lucro (~15% EV).`, evImpact: 0.15 };
    }
    return { action: 'HIT', explanation: `${playerValue} não pode bust. Sempre peça carta.`, evImpact: 0.05 };
  }

  if (playerValue === 12) {
    if (dealerValue >= 4 && dealerValue <= 6) {
      return { action: 'STAND', explanation: `12 vs ${dealerValue}: dealer bust ~42%. Stand preserva EV.`, evImpact: 0.04 };
    }
    return { action: 'HIT', explanation: `12 vs ${dealerValue}: sua mão é fraca. Hit melhora EV.`, evImpact: 0.03 };
  }

  if (playerValue >= 13 && playerValue <= 16) {
    if (dealerValue >= 2 && dealerValue <= 6) {
      return {
        action: 'STAND',
        explanation: `${playerValue} vs ${dealerValue}: dealer bust ~${40 + (6 - dealerValue) * 2}%. Stand é ótimo.`,
        evImpact: 0.06,
      };
    }
    // Ajuste baseado em True Count
    if (trueCount >= 2 && playerValue === 16 && dealerValue === 10) {
      return {
        action: 'STAND',
        explanation: `16 vs 10 com TC+${trueCount}: stand. Muitas cartas altas restantes.`,
        evImpact: 0.02,
      };
    }
    return {
      action: 'HIT',
      explanation: `${playerValue} vs ${dealerValue}: dealer tem vantagem. Hit reduz perda.`,
      evImpact: -0.02,
    };
  }

  return { action: 'STAND', explanation: `Stand é a jogada padrão nesta situação.`, evImpact: 0 };
}

// ===== COMPONENTES VISUAIS =====
function ProCard({ card, isFaceDown = false }: { card?: Card; isFaceDown?: boolean }) {
  if (isFaceDown || !card) {
    return (
      <div
        style={{
          width: 90,
          height: 130,
          background: 'linear-gradient(135deg, #1e3a8a, #1e40af)',
          borderRadius: 10,
          border: '2px solid #3b82f6',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}
      />
    );
  }

  const isRed = card.suit === '♥' || card.suit === '♦';

  return (
    <div
      style={{
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
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 6,
          left: 8,
          fontSize: 16,
          fontWeight: 800,
          color: isRed ? '#dc2626' : '#1e293b',
        }}
      >
        {card.rank}
      </div>
      <div style={{ fontSize: 42, fontWeight: 700, color: isRed ? '#dc2626' : '#1e293b' }}>
        {card.suit}
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 6,
          right: 8,
          fontSize: 16,
          fontWeight: 800,
          color: isRed ? '#dc2626' : '#1e293b',
          transform: 'rotate(180deg)',
        }}
      >
        {card.rank}
      </div>
    </div>
  );
}

function CountDisplay({
  runningCount,
  trueCount,
  decksRemaining,
  showAdvanced,
}: {
  runningCount: number;
  trueCount: number;
  decksRemaining: number;
  showAdvanced: boolean;
}) {
  const countColor = runningCount > 0 ? '#10b981' : runningCount < 0 ? '#ef4444' : '#64748b';

  return (
    <div
      style={{
        padding: '20px 24px',
        background: 'rgba(15, 23, 42, 0.6)',
        borderRadius: 12,
        border: '1px solid rgba(100, 116, 139, 0.3)',
        display: 'flex',
        gap: 20,
        alignItems: 'center',
      }}
    >
      <div style={{ flex: 1, textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4, fontWeight: 600 }}>Running Count</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: countColor, fontFamily: 'monospace' }}>
          {runningCount >= 0 ? '+' : ''}
          {runningCount}
        </div>
      </div>

      {showAdvanced && (
        <>
          <div style={{ width: 1, height: 40, background: 'rgba(100, 116, 139, 0.3)' }} />
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4, fontWeight: 600 }}>True Count</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#8b5cf6', fontFamily: 'monospace' }}>
              {trueCount >= 0 ? '+' : ''}
              {trueCount.toFixed(1)}
            </div>
          </div>
          <div style={{ width: 1, height: 40, background: 'rgba(100, 116, 139, 0.3)' }} />
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4, fontWeight: 600 }}>Decks Left</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#60a5fa', fontFamily: 'monospace' }}>
              {decksRemaining.toFixed(1)}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ===== PAYWALL PARA MODO AVANÇADO =====
function PaywallScreen({ onBack }: { onBack: () => void }) {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: 700, margin: '60px auto', padding: '20px' }}>
      <div
        className="card"
        style={{
          padding: 48,
          textAlign: 'center',
          background: 'linear-gradient(145deg, rgba(139, 92, 246, 0.05), rgba(15, 23, 42, 0.95))',
          border: '2px solid rgba(139, 92, 246, 0.4)',
        }}
      >
        <div
          style={{
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
          }}
        >
          🔒
        </div>

        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12, color: '#f8fafc' }}>
          Modo Avançado - Exclusivo PRO
        </h2>
        <p style={{ fontSize: 15, color: '#94a3b8', marginBottom: 32, lineHeight: 1.7 }}>
          Desbloqueie treinamento realista de cassino com configurações avançadas, True Count, feedback educacional
          detalhado e estatísticas profissionais.
        </p>

        {/* Features Premium */}
        <div
          style={{
            textAlign: 'left',
            marginBottom: 32,
            padding: 24,
            background: 'rgba(15, 23, 42, 0.6)',
            borderRadius: 12,
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#c084fc' }}>
            O que você desbloqueia:
          </h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {[
              'Configuração de 1 a 8 baralhos',
              'Cut Card e penetração do shoe',
              'True Count calculado automaticamente',
              'Feedback educacional com impacto no EV',
              'Estatísticas avançadas por tipo de decisão',
              'Histórico de sessões salvo',
              'Erros mais comuns identificados',
            ].map((feature, i) => (
              <li
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 12,
                  color: '#e2e8f0',
                  fontSize: 14,
                }}
              >
                <span style={{ color: '#10b981', fontSize: 18 }}>✓</span> {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Botões */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={onBack}
            style={{
              flex: 1,
              padding: '14px',
              background: '#334155',
              border: 'none',
              borderRadius: 10,
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            ← Voltar
          </button>
          <button
            onClick={() => navigate('/premium')}
            style={{
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
            }}
          >
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
      <div
        style={{
          marginBottom: 32,
          padding: 20,
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fca5a5', margin: 0 }}>
            Ferramenta Educacional - Não Incentiva Jogos de Azar
          </h3>
        </div>
        <p style={{ color: '#fca5a5', fontSize: 12, lineHeight: 1.6, margin: 0 }}>
          Este é um simulador educacional. Não garantimos ganhos financeiros. Contagem de cartas pode ser proibida em
          cassinos. Use apenas para fins de estudo.
        </p>
      </div>

      <h1
        style={{
          fontSize: 32,
          fontWeight: 700,
          marginBottom: 12,
          textAlign: 'center',
          background: 'linear-gradient(135deg, #f8fafc, #8b5cf6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        Blackjack Pro Trainer
      </h1>
      <p style={{ textAlign: 'center', color: '#94a3b8', marginBottom: 32, fontSize: 14 }}>
        Treinamento profissional com feedback matemático em tempo real
      </p>

      <div className="card" style={{ padding: 40 }}>
        {/* Nível de Dificuldade */}
        <label style={{ display: 'block', marginBottom: 28 }}>
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12, fontWeight: 600 }}>
            Nível de Treinamento
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <button
              onClick={() => setConfig({ ...config, difficulty: 'BEGINNER' })}
              style={{
                padding: '18px',
                background: config.difficulty === 'BEGINNER' ? 'linear-gradient(135deg, #10b981, #059669)' : '#334155',
                border: config.difficulty === 'BEGINNER' ? '2px solid #10b981' : '1px solid #475569',
                borderRadius: 10,
                color: '#fff',
                fontSize: 14,
                fontWeight: config.difficulty === 'BEGINNER' ? 700 : 500,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 6 }}>🟢</div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Modo Iniciante</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>Gratuito • Estratégia básica simples</div>
            </button>
            <button
              onClick={() => setConfig({ ...config, difficulty: 'ADVANCED' })}
              style={{
                padding: '18px',
                background:
                  config.difficulty === 'ADVANCED' ? 'linear-gradient(135deg, #8b5cf6, #a855f7)' : '#334155',
                border: config.difficulty === 'ADVANCED' ? '2px solid #a855f7' : '1px solid #475569',
                borderRadius: 10,
                color: '#fff',
                fontSize: 14,
                fontWeight: config.difficulty === 'ADVANCED' ? 700 : 500,
                cursor: 'pointer',
                textAlign: 'left',
                position: 'relative',
                opacity: !isPremium ? 0.6 : 1,
              }}
            >
              {!isPremium && (
                <div
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    background: '#f59e0b',
                    color: '#fff',
                    padding: '4px 8px',
                    borderRadius: 6,
                    fontSize: 9,
                    fontWeight: 700,
                  }}
                >
                  PRO
                </div>
              )}
              <div style={{ fontSize: 20, marginBottom: 6 }}>🔴</div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Modo Avançado</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>
                {isPremium ? 'True Count • EV • Stats' : '🔒 Desbloqueie com PRO'}
              </div>
            </button>
          </div>
        </label>

        {/* Configurações Avançadas (só se PRO) */}
        {config.difficulty === 'ADVANCED' && isPremium && (
          <>
            {/* Número de Baralhos */}
            <label style={{ display: 'block', marginBottom: 28 }}>
              <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12, fontWeight: 600 }}>
                Número de Baralhos no Shoe
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {[1, 2, 4, 6, 8].map(count => (
                  <button
                    key={count}
                    onClick={() => setConfig({ ...config, deckCount: count })}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: config.deckCount === count ? '#3b82f6' : '#334155',
                      border: 'none',
                      borderRadius: 8,
                      color: '#fff',
                      fontSize: 14,
                      fontWeight: config.deckCount === count ? 700 : 500,
                      cursor: 'pointer',
                    }}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </label>

            {/* Cut Card Penetration */}
            <label style={{ display: 'block', marginBottom: 28 }}>
              <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12, fontWeight: 600 }}>
                Penetração do Cut Card (quando embaralhar)
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { label: '50%', value: 0.5 },
                  { label: '60%', value: 0.6 },
                  { label: '70%', value: 0.7 },
                  { label: '75%', value: 0.75 },
                ].map(({ label, value }) => (
                  <button
                    key={value}
                    onClick={() => setConfig({ ...config, cutCardPenetration: value })}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: config.cutCardPenetration === value ? '#8b5cf6' : '#334155',
                      border: 'none',
                      borderRadius: 8,
                      color: '#fff',
                      fontSize: 13,
                      fontWeight: config.cutCardPenetration === value ? 700 : 500,
                      cursor: 'pointer',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </label>
          </>
        )}

        {/* Quantidade de Mãos */}
        <label style={{ display: 'block', marginBottom: 32 }}>
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12, fontWeight: 600 }}>Quantidade de Mãos</div>
          <div style={{ display: 'flex', gap: 10 }}>
            {[10, 20, 30, 50].map(count => (
              <button
                key={count}
                onClick={() => setConfig({ ...config, handsToPlay: count })}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: config.handsToPlay === count ? '#10b981' : '#334155',
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: config.handsToPlay === count ? 700 : 500,
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
          disabled={isAdvancedLocked}
          style={{
            width: '100%',
            padding: '18px',
            background: isAdvancedLocked
              ? '#334155'
              : config.difficulty === 'BEGINNER'
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
          }}
        >
          {isAdvancedLocked ? '🔒 Modo Avançado - Desbloqueie com PRO' : '🎮 Iniciar Treinamento'}
        </button>
      </div>

      {/* Info sobre True Count */}
      {config.difficulty === 'ADVANCED' && isPremium && (
        <div
          style={{
            marginTop: 24,
            padding: 20,
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: 10,
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: '#60a5fa' }}>ℹ️ Sobre True Count</h3>
          <p style={{ color: '#94a3b8', fontSize: 12, lineHeight: 1.7, margin: 0 }}>
            Em múltiplos baralhos, decisões devem ser baseadas no <strong>True Count</strong> (Running Count dividido
            por baralhos restantes). Cartas altas aumentam sua vantagem matemática.
          </p>
        </div>
      )}
    </div>
  );
}

// ===== COMPONENTE PRINCIPAL =====
export default function BlackjackPro() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<TrainingMode>('SETUP');
  const [config, setConfig] = useState<SessionConfig>({
    difficulty: 'BEGINNER',
    deckCount: 6,
    cutCardPenetration: 0.75,
    handsToPlay: 20,
  });

  const isPremium = auth.user?.premium || false;

  // Verificar se tenta acessar modo avançado sem ser premium
  useEffect(() => {
    if (config.difficulty === 'ADVANCED' && !isPremium && mode !== 'SETUP') {
      setMode('SETUP');
    }
  }, [config.difficulty, isPremium, mode]);

  const handleStart = () => {
    if (config.difficulty === 'ADVANCED' && !isPremium) {
      // Mostrar paywall
      return;
    }
    setMode('PLAYING');
    // Implementação completa virá aqui
  };

  const handleRestart = () => {
    setMode('SETUP');
  };

  // Paywall check
  if (config.difficulty === 'ADVANCED' && !isPremium && mode !== 'SETUP') {
    return <PaywallScreen onBack={() => setConfig({ ...config, difficulty: 'BEGINNER' })} />;
  }

  if (mode === 'SETUP') {
    return <SetupScreen config={config} setConfig={setConfig} onStart={handleStart} isPremium={isPremium} />;
  }

  // Placeholder para outras fases (implementar depois)
  return (
    <div style={{ maxWidth: 700, margin: '60px auto', padding: '20px', textAlign: 'center' }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16, color: '#f8fafc' }}>
        🚧 Em Desenvolvimento
      </h2>
      <p style={{ color: '#94a3b8', marginBottom: 32 }}>
        Modo de jogo será implementado em breve.
      </p>
      <button
        onClick={handleRestart}
        style={{
          padding: '14px 32px',
          background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
          border: 'none',
          borderRadius: 10,
          color: '#fff',
          fontSize: 14,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        ← Voltar
      </button>
    </div>
  );
}
