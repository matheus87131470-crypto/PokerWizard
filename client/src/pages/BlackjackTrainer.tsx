/**
 * BLACKJACK TRAINER - Treinamento Educacional
 * 
 * FASE 1: SETUP (configuração do treino)
 * FASE 2: HAND (decisão de blackjack)
 * FASE 3: FEEDBACK (avaliação da decisão)
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// ===== TIPOS =====
type TrainingStage = 'SETUP' | 'HAND' | 'FEEDBACK';
type Action = 'HIT' | 'STAND' | 'DOUBLE' | 'SPLIT';
type Score = 'PERFECT' | 'GOOD' | 'MISTAKE' | 'BLUNDER';
type Difficulty = 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';

interface Card {
  rank: string;
  suit: string;
  value: number;
}

interface BlackjackHand {
  playerCards: Card[];
  dealerCard: Card;
  availableActions: Action[];
  correctAction: Action;
  userAction?: Action;
  explanation?: string;
}

interface TrainingConfig {
  difficulty: Difficulty;
  handsCount: number;
}

interface TrainingSession {
  config: TrainingConfig;
  hands: BlackjackHand[];
  currentHandIndex: number;
  mistakes: number;
  correctDecisions: number;
}

// ===== CONSTANTES =====
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUITS = ['♠', '♥', '♦', '♣'];

// ===== FUNÇÕES UTILITÁRIAS =====
function getCardValue(rank: string): number {
  if (rank === 'A') return 11;
  if (['J', 'Q', 'K'].includes(rank)) return 10;
  return parseInt(rank);
}

function generateCard(): Card {
  const rank = RANKS[Math.floor(Math.random() * RANKS.length)];
  const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
  return { rank, suit, value: getCardValue(rank) };
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

  // Ajustar ases se necessário
  while (value > 21 && aces > 0) {
    value -= 10;
    aces--;
  }

  return { value, isSoft: aces > 0 };
}

// Estratégia básica simplificada
function getOptimalAction(playerCards: Card[], dealerCard: Card): { action: Action; explanation: string } {
  const { value: playerValue, isSoft } = calculateHandValue(playerCards);
  const dealerValue = dealerCard.value;
  const isPair = playerCards.length === 2 && playerCards[0].rank === playerCards[1].rank;

  // Pares - Split logic
  if (isPair) {
    const pairRank = playerCards[0].rank;
    if (pairRank === 'A' || pairRank === '8') {
      return { 
        action: 'SPLIT', 
        explanation: `Sempre divida Ases ou 8s. São os splits mais lucrativos da estratégia básica.` 
      };
    }
    if (pairRank === '10' || pairRank === 'J' || pairRank === 'Q' || pairRank === 'K') {
      return { 
        action: 'STAND', 
        explanation: `Nunca divida figuras/10s. Você já tem 20, uma das melhores mãos possíveis.` 
      };
    }
  }

  // Soft hands (com Ás contando como 11)
  if (isSoft) {
    if (playerValue >= 19) {
      return { action: 'STAND', explanation: `Com soft ${playerValue}, você já tem uma mão forte. Stand.` };
    }
    if (playerValue === 18 && dealerValue >= 9) {
      return { action: 'HIT', explanation: `Soft 18 vs ${dealerValue} do dealer: hit para melhorar contra carta forte.` };
    }
    if (playerValue === 18) {
      return { action: 'STAND', explanation: `Soft 18 vs ${dealerValue} do dealer: stand, é uma mão decente.` };
    }
    if (playerCards.length === 2 && playerValue <= 17 && dealerValue >= 4 && dealerValue <= 6) {
      return { 
        action: 'DOUBLE', 
        explanation: `Soft ${playerValue} vs ${dealerValue}: dobrar aproveita a fraqueza do dealer.` 
      };
    }
    return { action: 'HIT', explanation: `Soft ${playerValue}: sempre seguro fazer hit com soft hand baixo.` };
  }

  // Hard hands
  if (playerValue >= 17) {
    return { action: 'STAND', explanation: `Com ${playerValue}, você deve stand. Risco alto de bust ao pedir.` };
  }

  if (playerValue <= 11) {
    if (playerCards.length === 2 && playerValue === 11) {
      return { 
        action: 'DOUBLE', 
        explanation: `11 é a melhor mão para dobrar. Alta chance de fazer 21.` 
      };
    }
    if (playerCards.length === 2 && playerValue === 10 && dealerValue <= 9) {
      return { 
        action: 'DOUBLE', 
        explanation: `10 vs ${dealerValue}: dobrar maximiza EV contra carta fraca do dealer.` 
      };
    }
    return { action: 'HIT', explanation: `Com ${playerValue}, impossível bust. Sempre peça carta.` };
  }

  if (playerValue === 12) {
    if (dealerValue >= 4 && dealerValue <= 6) {
      return { action: 'STAND', explanation: `12 vs ${dealerValue}: dealer tem alta chance de bust, stand.` };
    }
    return { action: 'HIT', explanation: `12 vs ${dealerValue}: sua mão é fraca, precisa melhorar.` };
  }

  if (playerValue >= 13 && playerValue <= 16) {
    if (dealerValue >= 2 && dealerValue <= 6) {
      return { 
        action: 'STAND', 
        explanation: `${playerValue} vs ${dealerValue}: dealer tem carta fraca, deixe ele bust.` 
      };
    }
    return { 
      action: 'HIT', 
      explanation: `${playerValue} vs ${dealerValue}: dealer tem carta forte, você precisa melhorar.` 
      };
  }

  return { action: 'STAND', explanation: `Stand é a jogada padrão nesta situação.` };
}

function generateHand(difficulty: Difficulty): BlackjackHand {
  // Gerar cartas do jogador
  const playerCards: Card[] = [generateCard(), generateCard()];
  const dealerCard = generateCard();

  // Determinar ações disponíveis
  const availableActions: Action[] = ['HIT', 'STAND'];
  
  // Adicionar DOUBLE se for a mão inicial
  if (playerCards.length === 2) {
    availableActions.push('DOUBLE');
  }

  // Adicionar SPLIT se for par
  if (playerCards.length === 2 && playerCards[0].rank === playerCards[1].rank) {
    availableActions.push('SPLIT');
  }

  // Obter ação correta
  const { action: correctAction, explanation } = getOptimalAction(playerCards, dealerCard);

  return {
    playerCards,
    dealerCard,
    availableActions,
    correctAction,
    explanation,
  };
}

function calculateScore(mistakes: number, total: number): Score {
  const accuracy = ((total - mistakes) / total) * 100;
  if (accuracy === 100) return 'PERFECT';
  if (accuracy >= 80) return 'GOOD';
  if (accuracy >= 60) return 'MISTAKE';
  return 'BLUNDER';
}

// ===== COMPONENTES VISUAIS =====
function BlackjackCard({ card }: { card: Card }) {
  const isRed = card.suit === '♥' || card.suit === '♦';
  
  return (
    <div style={{
      width: 80,
      height: 120,
      background: '#fff',
      borderRadius: 12,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 32,
      fontWeight: 700,
      color: isRed ? '#ef4444' : '#1e293b',
      boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
      position: 'relative',
    }}>
      <div style={{ fontSize: 24, marginBottom: 4 }}>{card.rank}</div>
      <div style={{ fontSize: 40 }}>{card.suit}</div>
    </div>
  );
}

function ActionButton({ 
  action, 
  onClick, 
  disabled 
}: { 
  action: Action; 
  onClick: () => void; 
  disabled?: boolean;
}) {
  const colors: Record<Action, string> = {
    HIT: '#3b82f6',
    STAND: '#10b981',
    DOUBLE: '#f59e0b',
    SPLIT: '#8b5cf6',
  };

  const labels: Record<Action, string> = {
    HIT: '🎯 Hit',
    STAND: '✋ Stand',
    DOUBLE: '💰 Double',
    SPLIT: '✂️ Split',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '20px 40px',
        background: disabled ? '#334155' : colors[action],
        border: 'none',
        borderRadius: 12,
        color: '#fff',
        fontSize: 16,
        fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s',
        boxShadow: disabled ? 'none' : '0 6px 20px rgba(0,0,0,0.3)',
        opacity: disabled ? 0.4 : 1,
        minWidth: 140,
      }}
      onMouseEnter={(e) => !disabled && (e.currentTarget.style.transform = 'scale(1.05)')}
      onMouseLeave={(e) => !disabled && (e.currentTarget.style.transform = 'scale(1)')}
    >
      {labels[action]}
    </button>
  );
}

// ===== FASE 1: SETUP =====
function TrainingSetup({ 
  config, 
  setConfig, 
  onStart 
}: { 
  config: TrainingConfig; 
  setConfig: (config: TrainingConfig) => void; 
  onStart: () => void;
}) {
  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: '20px' }}>
      <h1 style={{ 
        fontSize: 36, 
        fontWeight: 700, 
        marginBottom: 16, 
        textAlign: 'center',
        background: 'linear-gradient(135deg, #f8fafc, #c084fc)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}>
        ♠️ Blackjack Trainer
      </h1>
      <p style={{ textAlign: 'center', color: '#94a3b8', marginBottom: 40, fontSize: 14 }}>
        Treine estratégia básica de blackjack. Sem apostas, apenas aprendizado.
      </p>

      <div className="card" style={{ padding: 40 }}>
        {/* Dificuldade */}
        <label style={{ display: 'block', marginBottom: 32 }}>
          <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 12, fontWeight: 600 }}>
            Nível de Dificuldade
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {(['BASIC', 'INTERMEDIATE', 'ADVANCED'] as Difficulty[]).map(level => (
              <button
                key={level}
                onClick={() => setConfig({ ...config, difficulty: level })}
                style={{
                  padding: '16px',
                  background: config.difficulty === level ? '#8b5cf6' : '#334155',
                  border: config.difficulty === level ? '2px solid #a855f7' : '1px solid #475569',
                  borderRadius: 10,
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: config.difficulty === level ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {level === 'BASIC' ? '🟢 Básico' : level === 'INTERMEDIATE' ? '🟡 Intermediário' : '🔴 Avançado'}
              </button>
            ))}
          </div>
        </label>

        {/* Quantidade de Mãos */}
        <label style={{ display: 'block', marginBottom: 40 }}>
          <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 12, fontWeight: 600 }}>
            Quantidade de Mãos
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[5, 10, 20].map(count => (
              <button
                key={count}
                onClick={() => setConfig({ ...config, handsCount: count })}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: config.handsCount === count ? '#10b981' : '#334155',
                  border: 'none',
                  borderRadius: 10,
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: config.handsCount === count ? 700 : 500,
                  cursor: 'pointer',
                }}
              >
                {count} mãos
              </button>
            ))}
          </div>
        </label>

        {/* Botão Iniciar */}
        <button
          onClick={onStart}
          style={{
            width: '100%',
            padding: '18px',
            background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
            border: 'none',
            borderRadius: 12,
            color: '#fff',
            fontSize: 17,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(139, 92, 246, 0.4)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          🎮 Iniciar Treinamento
        </button>
      </div>

      {/* Informações */}
      <div style={{ 
        marginTop: 32, 
        padding: 24, 
        background: 'rgba(59, 130, 246, 0.1)', 
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: 12 
      }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: '#60a5fa' }}>
          ℹ️ Como Funciona
        </h3>
        <ul style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.8, marginLeft: 20 }}>
          <li>Você receberá mãos de blackjack para decidir</li>
          <li>Escolha entre Hit, Stand, Double ou Split</li>
          <li>Receba feedback sobre a estratégia básica correta</li>
          <li>Aprenda a matemática por trás de cada decisão</li>
        </ul>
      </div>
    </div>
  );
}

// ===== FASE 2: HAND (DECISÃO) =====
function HandDecision({ 
  hand, 
  handNumber,
  totalHands,
  onAction 
}: { 
  hand: BlackjackHand; 
  handNumber: number;
  totalHands: number;
  onAction: (action: Action) => void;
}) {
  const { value: playerValue } = calculateHandValue(hand.playerCards);

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: '20px' }}>
      {/* Header com progresso */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 40 
      }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#f8fafc' }}>
          ♠️ Blackjack Trainer
        </h2>
        <div style={{ 
          padding: '10px 20px', 
          background: 'rgba(139, 92, 246, 0.2)', 
          border: '1px solid rgba(139, 92, 246, 0.4)',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 600,
          color: '#c084fc',
        }}>
          Mão {handNumber} / {totalHands}
        </div>
      </div>

      {/* Mesa de Blackjack */}
      <div className="card" style={{ 
        padding: 48, 
        background: 'linear-gradient(145deg, rgba(16, 185, 129, 0.05), rgba(10, 15, 36, 0.95))',
        border: '1px solid rgba(16, 185, 129, 0.2)',
      }}>
        {/* Dealer */}
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 16, fontWeight: 600 }}>
            🎰 Dealer
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
            <BlackjackCard card={hand.dealerCard} />
            <div style={{
              width: 80,
              height: 120,
              background: 'linear-gradient(135deg, #1e293b, #334155)',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 48,
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            }}>
              🂠
            </div>
          </div>
        </div>

        {/* Player */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 16, fontWeight: 600 }}>
            👤 Você — Total: {playerValue}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 40 }}>
            {hand.playerCards.map((card, i) => (
              <BlackjackCard key={i} card={card} />
            ))}
          </div>

          {/* Ações */}
          <div style={{ 
            display: 'flex', 
            gap: 16, 
            justifyContent: 'center', 
            flexWrap: 'wrap',
            marginTop: 40,
          }}>
            {hand.availableActions.map(action => (
              <ActionButton
                key={action}
                action={action}
                onClick={() => onAction(action)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Dica */}
      <div style={{ 
        marginTop: 24, 
        padding: 20, 
        background: 'rgba(59, 130, 246, 0.1)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: 10,
        textAlign: 'center',
        color: '#94a3b8',
        fontSize: 13,
      }}>
        💡 Pense na estratégia básica. O que maximiza o valor esperado?
      </div>
    </div>
  );
}

// ===== FASE 3: FEEDBACK =====
function HandFeedback({ 
  hand, 
  session,
  onNext,
  onFinish
}: { 
  hand: BlackjackHand; 
  session: TrainingSession;
  onNext: () => void;
  onFinish: () => void;
}) {
  const isCorrect = hand.userAction === hand.correctAction;
  const isLastHand = session.currentHandIndex === session.hands.length - 1;

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', padding: '20px' }}>
      {/* Resultado */}
      <div style={{
        padding: 40,
        background: isCorrect 
          ? 'linear-gradient(145deg, rgba(16, 185, 129, 0.15), rgba(10, 15, 36, 0.95))'
          : 'linear-gradient(145deg, rgba(239, 68, 68, 0.15), rgba(10, 15, 36, 0.95))',
        border: `2px solid ${isCorrect ? '#10b981' : '#ef4444'}`,
        borderRadius: 16,
        textAlign: 'center',
        marginBottom: 32,
      }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>
          {isCorrect ? '✅' : '❌'}
        </div>
        <h2 style={{ 
          fontSize: 32, 
          fontWeight: 700, 
          marginBottom: 12,
          color: isCorrect ? '#10b981' : '#ef4444',
        }}>
          {isCorrect ? 'Correto!' : 'Incorreto'}
        </h2>
        <p style={{ fontSize: 16, color: '#94a3b8', marginBottom: 24 }}>
          Você escolheu: <strong style={{ color: '#fff' }}>{hand.userAction}</strong>
        </p>
        {!isCorrect && (
          <p style={{ fontSize: 16, color: '#94a3b8' }}>
            Ação correta: <strong style={{ color: '#10b981' }}>{hand.correctAction}</strong>
          </p>
        )}
      </div>

      {/* Explicação */}
      <div className="card" style={{ padding: 32, marginBottom: 32 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#f8fafc' }}>
          📚 Explicação
        </h3>
        <p style={{ color: '#94a3b8', lineHeight: 1.8, fontSize: 15 }}>
          {hand.explanation}
        </p>
      </div>

      {/* Estatísticas da Sessão */}
      <div className="card" style={{ padding: 32, marginBottom: 32 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: '#f8fafc' }}>
          📊 Progresso
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#10b981', marginBottom: 4 }}>
              {session.correctDecisions}
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>Acertos</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#ef4444', marginBottom: 4 }}>
              {session.mistakes}
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>Erros</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#8b5cf6', marginBottom: 4 }}>
              {Math.round((session.correctDecisions / (session.currentHandIndex + 1)) * 100)}%
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>Precisão</div>
          </div>
        </div>
      </div>

      {/* Botões de Navegação */}
      <div style={{ display: 'flex', gap: 16 }}>
        {!isLastHand ? (
          <button
            onClick={onNext}
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
            Próxima Mão →
          </button>
        ) : (
          <button
            onClick={onFinish}
            style={{
              flex: 1,
              padding: '18px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none',
              borderRadius: 12,
              color: '#fff',
              fontSize: 16,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)',
            }}
          >
            Ver Resultado Final 🏆
          </button>
        )}
      </div>
    </div>
  );
}

// ===== RESULTADO FINAL =====
function FinalResults({ 
  session, 
  onRestart 
}: { 
  session: TrainingSession; 
  onRestart: () => void;
}) {
  const score = calculateScore(session.mistakes, session.hands.length);
  const accuracy = Math.round((session.correctDecisions / session.hands.length) * 100);

  const scoreColors: Record<Score, string> = {
    PERFECT: '#10b981',
    GOOD: '#3b82f6',
    MISTAKE: '#f59e0b',
    BLUNDER: '#ef4444',
  };

  const scoreLabels: Record<Score, string> = {
    PERFECT: 'Perfeito! 🏆',
    GOOD: 'Muito Bom! 🌟',
    MISTAKE: 'Pode Melhorar 📚',
    BLUNDER: 'Precisa Praticar Mais 💪',
  };

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: '20px' }}>
      <div className="card" style={{ padding: 48, textAlign: 'center' }}>
        {/* Score Badge */}
        <div style={{
          width: 120,
          height: 120,
          margin: '0 auto 24px',
          background: `linear-gradient(135deg, ${scoreColors[score]}, ${scoreColors[score]}dd)`,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 56,
          boxShadow: `0 12px 32px ${scoreColors[score]}50`,
        }}>
          {score === 'PERFECT' ? '🏆' : score === 'GOOD' ? '🌟' : score === 'MISTAKE' ? '📚' : '💪'}
        </div>

        <h2 style={{ 
          fontSize: 32, 
          fontWeight: 700, 
          marginBottom: 12,
          color: scoreColors[score],
        }}>
          {scoreLabels[score]}
        </h2>

        <p style={{ fontSize: 16, color: '#94a3b8', marginBottom: 40 }}>
          Você completou o treinamento!
        </p>

        {/* Estatísticas */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: 24,
          marginBottom: 40,
          padding: '32px 0',
          borderTop: '1px solid rgba(139, 92, 246, 0.2)',
          borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
        }}>
          <div>
            <div style={{ fontSize: 36, fontWeight: 700, color: '#8b5cf6', marginBottom: 8 }}>
              {session.hands.length}
            </div>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>Mãos Jogadas</div>
          </div>
          <div>
            <div style={{ fontSize: 36, fontWeight: 700, color: '#10b981', marginBottom: 8 }}>
              {session.correctDecisions}
            </div>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>Acertos</div>
          </div>
          <div>
            <div style={{ fontSize: 36, fontWeight: 700, color: scoreColors[score], marginBottom: 8 }}>
              {accuracy}%
            </div>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>Precisão</div>
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
            {accuracy === 100 
              ? '🎯 Excelente! Você dominou a estratégia básica. Continue praticando para manter a consistência.'
              : accuracy >= 80
              ? '👍 Ótimo trabalho! Você entende bem os fundamentos. Continue praticando situações mais complexas.'
              : accuracy >= 60
              ? '📖 Bom início! Revise a estratégia básica e pratique mais. Foque nos erros mais comuns.'
              : '💪 Continue praticando! Estude a tabela de estratégia básica e tente novamente.'
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
export default function BlackjackTrainer() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [stage, setStage] = useState<TrainingStage>('SETUP');
  const [config, setConfig] = useState<TrainingConfig>({
    difficulty: 'BASIC',
    handsCount: 10,
  });
  const [session, setSession] = useState<TrainingSession | null>(null);

  const startTraining = () => {
    // Gerar mãos
    const hands: BlackjackHand[] = [];
    for (let i = 0; i < config.handsCount; i++) {
      hands.push(generateHand(config.difficulty));
    }

    setSession({
      config,
      hands,
      currentHandIndex: 0,
      mistakes: 0,
      correctDecisions: 0,
    });
    setStage('HAND');
  };

  const handleAction = (action: Action) => {
    if (!session) return;

    const currentHand = session.hands[session.currentHandIndex];
    currentHand.userAction = action;

    const isCorrect = action === currentHand.correctAction;
    
    setSession({
      ...session,
      mistakes: session.mistakes + (isCorrect ? 0 : 1),
      correctDecisions: session.correctDecisions + (isCorrect ? 1 : 0),
    });

    setStage('FEEDBACK');
  };

  const handleNext = () => {
    if (!session) return;
    
    setSession({
      ...session,
      currentHandIndex: session.currentHandIndex + 1,
    });
    setStage('HAND');
  };

  const handleFinish = () => {
    setStage('SETUP');
    // Aqui você pode adicionar lógica para salvar estatísticas no backend
  };

  const handleRestart = () => {
    setSession(null);
    setStage('SETUP');
  };

  // Renderização condicional baseada no estágio
  if (!session && stage === 'SETUP') {
    return (
      <TrainingSetup
        config={config}
        setConfig={setConfig}
        onStart={startTraining}
      />
    );
  }

  if (session && stage === 'HAND') {
    return (
      <HandDecision
        hand={session.hands[session.currentHandIndex]}
        handNumber={session.currentHandIndex + 1}
        totalHands={session.hands.length}
        onAction={handleAction}
      />
    );
  }

  if (session && stage === 'FEEDBACK') {
    return (
      <HandFeedback
        hand={session.hands[session.currentHandIndex]}
        session={session}
        onNext={handleNext}
        onFinish={handleFinish}
      />
    );
  }

  if (session && stage === 'SETUP' && session.currentHandIndex === session.hands.length) {
    return (
      <FinalResults
        session={session}
        onRestart={handleRestart}
      />
    );
  }

  return <FinalResults session={session!} onRestart={handleRestart} />;
}
