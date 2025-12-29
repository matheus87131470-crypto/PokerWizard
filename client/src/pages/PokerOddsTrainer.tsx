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
import { usePaywall } from '../hooks/usePaywall';

// ===== VERIFICAÇÃO ROBUSTA DE STATUS PRO =====
function checkIsReallyPremium(): boolean {
  try {
    // 1. Verificar localStorage user
    const userStr = localStorage.getItem('pokerwizard_user') || localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      console.log('🔍 [checkIsReallyPremium] User do localStorage:', user);
      
      // Verificar múltiplos campos possíveis
      if (user.premium === true) return true;
      if (user.isPremium === true) return true;
      if (user.plan === 'PRO') return true;
      if (user.plan === 'premium') return true;
      if (user.statusPlano === 'premium') return true;
      if (user.subscription?.status === 'active') return true;
    }

    // 2. Verificar token decodificado
    const token = localStorage.getItem('pokerwizard_token') || localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('🔍 [checkIsReallyPremium] Token payload:', payload);
        if (payload.premium === true) return true;
        if (payload.isPremium === true) return true;
        if (payload.plan === 'PRO') return true;
      } catch (e) {
        console.warn('[checkIsReallyPremium] Erro ao decodificar token:', e);
      }
    }
  } catch (err) {
    console.error('[checkIsReallyPremium] Erro:', err);
  }
  
  return false;
}

// ===== SISTEMA DE CONTAGEM DE ANÁLISES FREE =====
const FREE_ANALYSES_LIMIT = 10;
const STORAGE_KEY = 'pokerwizard_odds_analyses_count';

function getAnalysesCount(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? parseInt(stored, 10) : 0;
  } catch {
    return 0;
  }
}

function incrementAnalysesCount(): number {
  const current = getAnalysesCount();
  const newCount = current + 1;
  try {
    localStorage.setItem(STORAGE_KEY, newCount.toString());
  } catch (e) {
    console.error('Erro ao salvar contador:', e);
  }
  return newCount;
}

function resetAnalysesCount(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Erro ao resetar contador:', e);
  }
}

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

interface AIInsight {
  recommendation: string; // 'AGGRESSIVE' | 'CAUTIOUS' | 'NEUTRAL' | 'FOLD'
  reasoning: string;
  positionAdvice: string;
  equityAnalysis: string;
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
  usedCards: Card[],
  isPremium: boolean = false
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

  // FREE: 500 simulações | PRO: 2000 simulações
  const simulations = isPremium ? 2000 : 500;
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

// ===== MÓDULO DE IA ESTRATÉGICA (PRO) =====
function generateAIInsight(
  heroCards: Card[],
  boardCards: Card[],
  odds: HandOdds,
  numPlayers: number
): AIInsight {
  const { winChance, outs } = odds;
  const equity = winChance;
  
  // Análise de Board Texture
  const hasPair = boardCards.length >= 2 && 
    boardCards.some((c, i) => boardCards.slice(i + 1).some(c2 => c.rank === c2.rank));
  
  const suits = boardCards.map(c => c.suit);
  const suitCounts: Record<string, number> = {};
  suits.forEach(s => suitCounts[s] = (suitCounts[s] || 0) + 1);
  const maxSuitCount = Math.max(...Object.values(suitCounts), 0);
  const flushDraw = maxSuitCount >= 3;
  
  const ranks = boardCards.map(c => RANK_VALUES[c.rank]).sort((a, b) => b - a);
  let straightDraw = false;
  if (ranks.length >= 3) {
    for (let i = 0; i < ranks.length - 2; i++) {
      if (ranks[i] - ranks[i + 2] <= 4) {
        straightDraw = true;
        break;
      }
    }
  }

  const isDangerous = flushDraw || straightDraw || hasPair;
  
  // Hero hand strength
  const heroRanks = heroCards.map(c => RANK_VALUES[c.rank]);
  const isPocketPair = heroCards[0].rank === heroCards[1].rank;
  const isSuited = heroCards[0].suit === heroCards[1].suit;
  const hasHighCard = Math.max(...heroRanks) >= 12; // Q+
  
  // Análise de Equidade
  let equityAnalysis = '';
  if (equity >= 65) {
    equityAnalysis = `Equidade forte (${equity.toFixed(1)}%). Você está favorito contra ${numPlayers - 1} oponente(s).`;
  } else if (equity >= 45) {
    equityAnalysis = `Equidade moderada (${equity.toFixed(1)}%). Situação de flip ou slightly ahead.`;
  } else if (equity >= 25) {
    equityAnalysis = `Equidade baixa (${equity.toFixed(1)}%). Você precisa de draw ou fold equity.`;
  } else {
    equityAnalysis = `Equidade muito baixa (${equity.toFixed(1)}%). Situação desfavorável.`;
  }

  // Recomendação estratégica
  let recommendation: string;
  let reasoning: string;
  let positionAdvice: string;

  if (boardCards.length === 0) {
    // Pré-flop
    if (isPocketPair && heroRanks[0] >= 10) {
      recommendation = 'AGGRESSIVE';
      reasoning = 'Premium pocket pair. Alta equidade pré-flop, recomendado raise/3bet.';
      positionAdvice = 'Em posição tardia, maximize value. Em early, varie entre raise e limp trap.';
    } else if (hasHighCard && (isSuited || Math.abs(heroRanks[0] - heroRanks[1]) <= 2)) {
      recommendation = 'AGGRESSIVE';
      reasoning = 'Mão premium/strong. Boa equidade contra ranges amplos.';
      positionAdvice = 'Open raise em qualquer posição. Considere 3bet contra opens tardios.';
    } else if (equity >= 40) {
      recommendation = 'NEUTRAL';
      reasoning = 'Mão jogável, mas não premium. Equidade razoável multiway.';
      positionAdvice = 'Open raise em late position. Fold/call em early vs raises.';
    } else {
      recommendation = 'CAUTIOUS';
      reasoning = 'Mão fraca. Baixa equidade contra ranges tight.';
      positionAdvice = 'Fold em early/middle. Considere steal em BTN/CO vs folds.';
    }
  } else {
    // Post-flop
    if (equity >= 65 && !isDangerous) {
      recommendation = 'AGGRESSIVE';
      reasoning = `Alta equidade (${equity.toFixed(1)}%) em board relativamente seco. Value bet/raise recomendado.`;
      positionAdvice = 'Construa pot. Bet for value e protection. Não slow play contra múltiplos oponentes.';
    } else if (equity >= 65 && isDangerous) {
      recommendation = 'AGGRESSIVE';
      reasoning = `Alta equidade (${equity.toFixed(1)}%) mas board perigoso (${flushDraw ? 'flush draw' : ''}${straightDraw ? ' straight draw' : ''}). Proteja sua mão.`;
      positionAdvice = 'Bet forte para negar odds a draws. Não dê cartas grátis.';
    } else if (equity >= 45 && outs >= 8) {
      recommendation = 'NEUTRAL';
      reasoning = `Equidade moderada (${equity.toFixed(1)}%) com ~${outs} outs. Situação de semi-bluff ou call.`;
      positionAdvice = 'Considere semi-bluff em posição. Call se pot odds favorecerem. Fold OOP vs aggression.';
    } else if (equity >= 30 && outs >= 12) {
      recommendation = 'AGGRESSIVE';
      reasoning = `Draw forte com ${outs}+ outs. Semi-bluff tem fold equity + equity realizável.`;
      positionAdvice = 'Semi-bluff agressivo, especialmente in position. Capitalize fold equity.';
    } else if (equity < 30 && outs < 6) {
      recommendation = 'FOLD';
      reasoning = `Baixa equidade (${equity.toFixed(1)}%) e poucos outs. Investimento não justificado.`;
      positionAdvice = 'Fold vs bet. Não invista mais chips sem implied odds claros.';
    } else {
      recommendation = 'CAUTIOUS';
      reasoning = `Equidade marginal (${equity.toFixed(1)}%). Situação depende de pot odds e ranges oponentes.`;
      positionAdvice = 'Call se pot odds favorecerem. Fold vs raises. Considere check behind OOP.';
    }
  }

  return {
    recommendation,
    reasoning,
    positionAdvice,
    equityAnalysis,
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

// ===== PAYWALL FREE LIMIT =====
function PaywallFreeLimitReached({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div style={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(8px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20
    }}>
      <div style={{
        maxWidth: 500,
        width: '100%',
        background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.98))',
        border: '2px solid rgba(239, 68, 68, 0.5)',
        borderRadius: 16,
        padding: 40,
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#f87171', marginBottom: 12 }}>
            Limite gratuito atingido
          </h2>
          <p style={{ fontSize: 15, color: '#cbd5e1', lineHeight: 1.6 }}>
            Você já utilizou todas as análises gratuitas disponíveis.
          </p>
        </div>

        {/* Upgrade Benefits */}
        <div style={{ 
          padding: 24, 
          background: 'rgba(234, 179, 8, 0.1)', 
          borderRadius: 12,
          border: '1px solid rgba(234, 179, 8, 0.3)',
          marginBottom: 24
        }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fbbf24', marginBottom: 16, textAlign: 'center' }}>
            🎯 Desbloqueie acesso completo por apenas R$ 3,50
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              '✔ Análises ilimitadas',
              '✔ Probabilidades em tempo real',
              '✔ IA estratégica avançada',
              '✔ Precisão máxima (simulações completas)'
            ].map((benefit, i) => (
              <div key={i} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 12,
                fontSize: 14,
                color: '#fcd34d',
                fontWeight: 600
              }}>
                <div style={{ 
                  width: 20, 
                  height: 20, 
                  borderRadius: '50%', 
                  background: 'rgba(234, 179, 8, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12
                }}>
                  ✓
                </div>
                {benefit}
              </div>
            ))}
          </div>
        </div>

        {/* PIX Info */}
        <div style={{ 
          padding: 16, 
          background: 'rgba(59, 130, 246, 0.1)', 
          borderRadius: 8,
          marginBottom: 24,
          textAlign: 'center'
        }}>
          <p style={{ fontSize: 13, color: '#93c5fd', margin: 0 }}>
            💳 <strong>Pagamento via PIX</strong> — acesso imediato
          </p>
        </div>

        {/* CTA Button */}
        <button
          onClick={onUpgrade}
          className="btn"
          style={{
            width: '100%',
            padding: '16px',
            background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
            color: '#1f2937',
            fontSize: 16,
            fontWeight: 700,
            borderRadius: 10,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 0 30px rgba(234, 179, 8, 0.5)',
            transition: 'all 0.3s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 0 40px rgba(234, 179, 8, 0.7)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 0 30px rgba(234, 179, 8, 0.5)';
          }}
        >
          🚀 Liberar agora
        </button>
      </div>
    </div>
  );
}

// ===== TELA DE SETUP =====
function SetupScreen({
  config,
  setConfig,
  onStart,
  isPremium,
}: {
  config: GameConfig;
  setConfig: (config: GameConfig) => void;
  onStart: () => void;
  isPremium: boolean;
}) {
  const navigate = useNavigate();
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
          📚 Recursos Disponíveis
        </h3>
        
        {isPremium ? (
          <>
            <div style={{ padding: 12, background: 'rgba(16, 185, 129, 0.1)', borderRadius: 8, marginBottom: 12, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#6ee7b7', marginBottom: 6 }}>
                ✅ PLANO PRO ATIVO
              </div>
              <ul style={{ fontSize: 12, color: '#93c5fd', lineHeight: 1.8, margin: 0, paddingLeft: 20 }}>
                <li><strong>🤖 AI Strategic Insights</strong> - Análise estratégica em tempo real</li>
                <li><strong>⚡ 2000 Simulações Monte Carlo</strong> - Máxima precisão</li>
                <li><strong>🎯 Análise Posicional Avançada</strong> - Board texture e ranges</li>
                <li><strong>📊 Equidade Profunda</strong> - Recomendações contextuais</li>
              </ul>
            </div>
          </>
        ) : (
          <>
            <div style={{ padding: 12, background: 'rgba(234, 179, 8, 0.1)', borderRadius: 8, marginBottom: 12, border: '1px solid rgba(234, 179, 8, 0.3)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24', marginBottom: 6 }}>
                📦 PLANO FREE
              </div>
              <ul style={{ fontSize: 12, color: '#fcd34d', lineHeight: 1.8, margin: 0, paddingLeft: 20 }}>
                <li>✅ Odds básicas (Win/Tie/Lose)</li>
                <li>✅ 500 simulações Monte Carlo</li>
                <li>✅ Cálculo de outs aproximado</li>
                <li>🔒 AI Insights (somente PRO)</li>
                <li>🔒 Análise estratégica avançada (somente PRO)</li>
              </ul>
            </div>

            <button
              onClick={() => navigate('/premium')}
              className="btn"
              style={{
                width: '100%',
                padding: '12px',
                background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                color: '#1f2937',
                fontWeight: 700,
                fontSize: 14,
                marginBottom: 16,
              }}
            >
              ⚡ Upgrade para PRO
            </button>
          </>
        )}

        <div style={{ padding: 12, background: 'rgba(59, 130, 246, 0.05)', borderRadius: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#60a5fa', marginBottom: 6 }}>
            📚 Como Usar
          </div>
          <ul style={{ fontSize: 12, color: '#93c5fd', lineHeight: 1.8, margin: 0, paddingLeft: 20 }}>
            <li>Selecione suas 2 cartas (HERO)</li>
            <li>Adicione cartas do board (Flop/Turn/River)</li>
            <li>Veja as probabilidades atualizarem em tempo real</li>
            {isPremium && <li>Analise os insights de IA para decisões estratégicas</li>}
          </ul>
        </div>
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
  isPremium,
}: {
  config: GameConfig;
  onExit: () => void;
  isPremium: boolean;
}) {
  const navigate = useNavigate();
  const [heroCards, setHeroCards] = useState<Card[]>([]);
  const [boardCards, setBoardCards] = useState<Card[]>([]);
  const [showHeroSelector, setShowHeroSelector] = useState(true);
  const [showBoardSelector, setShowBoardSelector] = useState(false);
  const [analysesCount, setAnalysesCount] = useState(getAnalysesCount());
  const [showPaywall, setShowPaywall] = useState(false);
  const [hasCountedThisSession, setHasCountedThisSession] = useState(false);

  const allUsedCards = [...heroCards, ...boardCards];

  // Verificar limite FREE
  const isBlocked = !isPremium && analysesCount >= FREE_ANALYSES_LIMIT;

  const odds = calculateOdds(heroCards, boardCards, config.numPlayers, [], isPremium);
  const aiInsight = isPremium && heroCards.length === 2 
    ? generateAIInsight(heroCards, boardCards, odds, config.numPlayers)
    : null;

  // Incrementar contador quando usuário FREE faz uma análise completa
  useEffect(() => {
    if (!isPremium && heroCards.length === 2 && boardCards.length >= 3 && !hasCountedThisSession && !isBlocked) {
      const newCount = incrementAnalysesCount();
      setAnalysesCount(newCount);
      setHasCountedThisSession(true);
      console.log(`📊 Análise #${newCount} de ${FREE_ANALYSES_LIMIT} realizada`);
      
      // Mostrar paywall se atingir limite
      if (newCount >= FREE_ANALYSES_LIMIT) {
        setShowPaywall(true);
      }
    }
  }, [heroCards, boardCards, isPremium, hasCountedThisSession, isBlocked]);

  const handleAddHeroCard = (card: Card) => {
    if (isBlocked) {
      setShowPaywall(true);
      return;
    }
    
    if (heroCards.length < 2) {
      setHeroCards([...heroCards, card]);
      if (heroCards.length === 1) {
        setShowHeroSelector(false);
      }
    }
  };

  const handleAddBoardCard = (card: Card) => {
    if (isBlocked) {
      setShowPaywall(true);
      return;
    }
    
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
    setHasCountedThisSession(false);
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#f8fafc', margin: 0 }}>
              🧠 Poker Odds Trainer
            </h1>
            {isPremium ? (
              <span style={{
                background: 'linear-gradient(135deg, #10b981, #6ee7b7)',
                color: '#064e3b',
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)',
              }}>
                ⭐ PRO
              </span>
            ) : (
              <span style={{
                background: 'rgba(100, 100, 100, 0.3)',
                color: '#94a3b8',
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
              }}>
                FREE
              </span>
            )}
          </div>
          <p style={{ fontSize: 14, color: '#94a3b8', margin: 0 }}>
            {config.numPlayers} jogadores | Monte Carlo {isPremium ? '2000' : '500'} simulações
            {!isPremium && analysesCount > 0 && (
              <span style={{ marginLeft: 12, color: analysesCount >= FREE_ANALYSES_LIMIT ? '#ef4444' : '#fbbf24' }}>
                • {analysesCount}/{FREE_ANALYSES_LIMIT} análises
              </span>
            )}
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

          {/* AI Insights (PRO) */}
          {aiInsight && (
            <div className="card" style={{ padding: 24, background: 'linear-gradient(145deg, rgba(139, 92, 246, 0.15), rgba(10, 15, 36, 0.95))', border: '2px solid rgba(139, 92, 246, 0.5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ fontSize: 24 }}>🤖</div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#c084fc', margin: 0 }}>
                    AI Strategic Insight
                  </h3>
                  <p style={{ fontSize: 12, color: '#a78bfa', margin: 0 }}>⭐ Powered by PRO</p>
                </div>
              </div>

              {/* Recomendação Principal */}
              <div style={{ 
                padding: 16, 
                background: aiInsight.recommendation === 'AGGRESSIVE' ? 'rgba(16, 185, 129, 0.15)' :
                           aiInsight.recommendation === 'FOLD' ? 'rgba(239, 68, 68, 0.15)' :
                           aiInsight.recommendation === 'CAUTIOUS' ? 'rgba(234, 179, 8, 0.15)' :
                           'rgba(59, 130, 246, 0.15)',
                borderRadius: 8,
                marginBottom: 16,
                border: `2px solid ${
                  aiInsight.recommendation === 'AGGRESSIVE' ? 'rgba(16, 185, 129, 0.5)' :
                  aiInsight.recommendation === 'FOLD' ? 'rgba(239, 68, 68, 0.5)' :
                  aiInsight.recommendation === 'CAUTIOUS' ? 'rgba(234, 179, 8, 0.5)' :
                  'rgba(59, 130, 246, 0.5)'
                }`
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, 
                  color: aiInsight.recommendation === 'AGGRESSIVE' ? '#6ee7b7' :
                         aiInsight.recommendation === 'FOLD' ? '#f87171' :
                         aiInsight.recommendation === 'CAUTIOUS' ? '#fbbf24' :
                         '#60a5fa'
                }}>
                  RECOMENDAÇÃO
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, 
                  color: aiInsight.recommendation === 'AGGRESSIVE' ? '#10b981' :
                         aiInsight.recommendation === 'FOLD' ? '#ef4444' :
                         aiInsight.recommendation === 'CAUTIOUS' ? '#f59e0b' :
                         '#3b82f6'
                }}>
                  {aiInsight.recommendation === 'AGGRESSIVE' && '🔥 AGRESSIVO'}
                  {aiInsight.recommendation === 'FOLD' && '🚫 FOLD'}
                  {aiInsight.recommendation === 'CAUTIOUS' && '⚠️ CAUTELOSO'}
                  {aiInsight.recommendation === 'NEUTRAL' && '⚖️ NEUTRO'}
                </div>
              </div>

              {/* Análise de Equidade */}
              <div style={{ padding: 16, background: 'rgba(139, 92, 246, 0.1)', borderRadius: 8, marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#a78bfa', marginBottom: 6 }}>
                  📊 ANÁLISE DE EQUIDADE
                </div>
                <div style={{ fontSize: 13, color: '#c4b5fd', lineHeight: 1.6 }}>
                  {aiInsight.equityAnalysis}
                </div>
              </div>

              {/* Raciocínio */}
              <div style={{ padding: 16, background: 'rgba(59, 130, 246, 0.1)', borderRadius: 8, marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#60a5fa', marginBottom: 6 }}>
                  💭 RACIOCÍNIO ESTRATÉGICO
                </div>
                <div style={{ fontSize: 13, color: '#93c5fd', lineHeight: 1.6 }}>
                  {aiInsight.reasoning}
                </div>
              </div>

              {/* Conselho Posicional */}
              <div style={{ padding: 16, background: 'rgba(234, 179, 8, 0.1)', borderRadius: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#fbbf24', marginBottom: 6 }}>
                  🎯 CONSELHO POSICIONAL
                </div>
                <div style={{ fontSize: 13, color: '#fcd34d', lineHeight: 1.6 }}>
                  {aiInsight.positionAdvice}
                </div>
              </div>
            </div>
          )}

          {/* Welcome PRO (quando não há cartas ainda) */}
          {isPremium && heroCards.length === 0 && (
            <div className="card" style={{ 
              padding: 24, 
              background: 'linear-gradient(145deg, rgba(16, 185, 129, 0.15), rgba(10, 15, 36, 0.95))',
              border: '2px solid rgba(16, 185, 129, 0.5)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ fontSize: 32 }}>⭐</div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#6ee7b7', margin: 0 }}>
                    Plano PRO Ativo
                  </h3>
                  <p style={{ fontSize: 13, color: '#a7f3d0', margin: 0 }}>Experiência completa desbloqueada</p>
                </div>
              </div>
              
              <p style={{ fontSize: 14, color: '#a7f3d0', lineHeight: 1.6, marginBottom: 16 }}>
                Você tem acesso total ao <strong>Odds Trainer</strong>, simulações avançadas e insights estratégicos com IA.
              </p>

              <div style={{ padding: 16, background: 'rgba(16, 185, 129, 0.1)', borderRadius: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#6ee7b7', marginBottom: 8 }}>
                  ✨ RECURSOS DESBLOQUEADOS
                </div>
                <ul style={{ fontSize: 13, color: '#a7f3d0', lineHeight: 1.8, margin: 0, paddingLeft: 20 }}>
                  <li><strong>🤖 AI Strategic Insights</strong> - Análise em tempo real</li>
                  <li><strong>⚡ 2000 Simulações</strong> - Precisão máxima</li>
                  <li><strong>📊 Análise Avançada</strong> - Board texture e posição</li>
                  <li><strong>🎯 Recomendações Contextuais</strong> - Por cada street</li>
                </ul>
              </div>
            </div>
          )}

          {/* Upgrade to PRO (FREE users ONLY) */}
          {!isPremium && heroCards.length === 2 && (
            <div className="card" style={{ 
              padding: 24, 
              background: 'linear-gradient(145deg, rgba(234, 179, 8, 0.15), rgba(10, 15, 36, 0.95))',
              border: '2px solid rgba(234, 179, 8, 0.5)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ fontSize: 32 }}>🔒</div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fbbf24', margin: 0 }}>
                    Desbloqueie AI Insights
                  </h3>
                  <p style={{ fontSize: 13, color: '#fcd34d', margin: 0 }}>Análise estratégica em tempo real</p>
                </div>
              </div>
              
              <p style={{ fontSize: 14, color: '#fcd34d', lineHeight: 1.6, marginBottom: 16 }}>
                Com <strong>PokerWizard PRO</strong>, você tem acesso a:
              </p>

              <ul style={{ fontSize: 13, color: '#fcd34d', lineHeight: 1.8, marginBottom: 20, paddingLeft: 20 }}>
                <li><strong>🤖 AI Strategic Insights</strong> - Recomendações em tempo real</li>
                <li><strong>🎯 Análise Posicional</strong> - Conselho por posição na mesa</li>
                <li><strong>📊 Equidade Avançada</strong> - Board texture e range analysis</li>
                <li><strong>⚡ 2000 Simulações</strong> - Precisão 4x maior (vs 500 FREE)</li>
                <li><strong>📈 Histórico de Mãos</strong> - Revise suas decisões</li>
                <li><strong>🎲 Modo Mesa Real</strong> - Simule cenários complexos</li>
              </ul>

              <button
                onClick={() => navigate('/premium')}
                className="btn"
                style={{
                  width: '100%',
                  padding: '14px',
                  background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                  color: '#1f2937',
                  fontWeight: 700,
                  fontSize: 15,
                  boxShadow: '0 0 30px rgba(234, 179, 8, 0.4)',
                }}
              >
                ⚡ Upgrade para PRO
              </button>
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

      {/* Paywall Free Limit */}
      {showPaywall && !isPremium && (
        <PaywallFreeLimitReached 
          onUpgrade={() => navigate('/premium')} 
        />
      )}
    </div>
  );
}

// ===== COMPONENTE PRINCIPAL =====
export default function PokerOddsTrainer() {
  const auth = useAuth();
  const navigate = useNavigate();
  const { isPremium: isPremiumFromHook, usageStatus } = usePaywall(auth.token);
  const [gameState, setGameState] = useState<GameState>('SETUP');
  const [config, setConfig] = useState<GameConfig>({
    numPlayers: 6,
  });

  // VERIFICAÇÃO DEFINITIVA: Combinar hook + localStorage
  const isPremium = isPremiumFromHook || checkIsReallyPremium();

  // Resetar contador quando virar PRO
  useEffect(() => {
    if (isPremium) {
      resetAnalysesCount();
      console.log('✅ Contador resetado - Usuário PRO');
    }
  }, [isPremium]);

  // Debug: verificar status PRO
  useEffect(() => {
    const realCheck = checkIsReallyPremium();
    console.log('🔍 Odds Trainer - Status PRO FINAL:', {
      isPremiumFromHook,
      checkIsReallyPremium: realCheck,
      FINAL_isPremium: isPremium,
      statusPlano: usageStatus?.statusPlano,
      token: !!auth.token
    });
    
    if (!isPremium && realCheck) {
      console.warn('⚠️ CONFLITO: Hook diz FREE mas localStorage diz PRO. Usando PRO.');
    }
  }, [isPremium, isPremiumFromHook, usageStatus, auth.token]);

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
          isPremium={isPremium}
        />
      )}

      {gameState === 'PLAYING' && (
        <PlayingScreen
          config={config}
          onExit={() => setGameState('SETUP')}
          isPremium={isPremium}
        />
      )}
    </div>
  );
}
