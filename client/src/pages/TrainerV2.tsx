/**
 * PRACTICE V2 - ARQUITETURA CORRETA
 * 
 * FASE 1: SETUP (formulário limpo, sem mesa)
 * FASE 2: HAND (mesa GTO-style com jogo interativo)
 * FASE 3: FEEDBACK (score + repeat/next)
 */

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import PaywallOverlay from '../components/PaywallOverlay';
import CreditWarningBanner from '../components/CreditWarningBanner';

const API_URL = import.meta.env.VITE_API_URL || 'https://pokerwizard-api.onrender.com';

// ===== TIPOS =====
type Position = 'UTG' | 'HJ' | 'CO' | 'BTN' | 'SB' | 'BB';
type GameType = 'CASH' | 'MTT';
type Spot = 'SRP' | '3BET' | '4BET' | 'SQUEEZE';
type PracticeStage = 'SETUP' | 'HAND' | 'FEEDBACK';
type Action = 'FOLD' | 'CALL' | 'RAISE' | 'CHECK' | 'BET';
type Street = 'PREFLOP' | 'FLOP' | 'TURN' | 'RIVER';
type Score = 'PERFECT' | 'GOOD' | 'MISTAKE' | 'BLUNDER';

interface PracticeConfig {
  gameType: GameType;
  stakes: string;
  spot: Spot;
  heroPosition: Position;
}

interface Hand {
  street: Street;
  holeCards: string[];
  board: string[];
  stack: number;
  pot: number;
  availableActions: Action[];
  correctAction: Action;
  userAction?: Action;
}

interface PracticeSession {
  config: PracticeConfig;
  hands: Hand[];
  currentHandIndex: number;
  mistakes: number;
}

const POSITIONS_6MAX: Position[] = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
const STAKES = ['NL10', 'NL25', 'NL50', 'NL100', 'NL200', 'NL500'];

// ===== GERADOR DE CARTAS =====
const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
const SUITS = ['♠', '♥', '♦', '♣'];

function generateCard(): string {
  const rank = RANKS[Math.floor(Math.random() * RANKS.length)];
  const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
  return rank + suit;
}

function generateHoleCards(): string[] {
  const card1 = generateCard();
  let card2 = generateCard();
  while (card2 === card1) card2 = generateCard();
  return [card1, card2];
}

function generateBoard(count: number, exclude: string[] = []): string[] {
  const cards: string[] = [];
  while (cards.length < count) {
    const card = generateCard();
    if (!cards.includes(card) && !exclude.includes(card)) {
      cards.push(card);
    }
  }
  return cards;
}

// Mock: ação correta (substituir por GTO backend depois)
function getCorrectAction(street: Street, position: Position): Action {
  if (street === 'PREFLOP') {
    return Math.random() > 0.5 ? 'RAISE' : 'FOLD';
  }
  return Math.random() > 0.4 ? 'BET' : 'CHECK';
}

function getAvailableActions(street: Street): Action[] {
  if (street === 'PREFLOP') return ['FOLD', 'CALL', 'RAISE'];
  return ['CHECK', 'BET', 'FOLD'];
}

function calculateScore(mistakes: number): Score {
  if (mistakes === 0) return 'PERFECT';
  if (mistakes === 1) return 'GOOD';
  if (mistakes === 2) return 'MISTAKE';
  return 'BLUNDER';
}

// ===== COMPONENTES VISUAIS =====
function Card({ card }: { card: string }) {
  const rank = card[0];
  const suit = card[1];
  const isRed = suit === '♥' || suit === '♦';
  
  return (
    <div style={{
      width: 70,
      height: 100,
      background: '#fff',
      borderRadius: 10,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 28,
      fontWeight: 700,
      color: isRed ? '#ef4444' : '#1e293b',
      boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
    }}>
      <div>{rank}</div>
      <div style={{ fontSize: 36 }}>{suit}</div>
    </div>
  );
}

function ActionButton({ action, onClick, disabled }: { action: Action; onClick: () => void; disabled?: boolean }) {
  const colors: Record<Action, string> = {
    FOLD: '#ef4444',
    CALL: '#3b82f6',
    RAISE: '#10b981',
    CHECK: '#64748b',
    BET: '#f59e0b',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '20px 48px',
        background: disabled ? '#334155' : colors[action],
        border: 'none',
        borderRadius: 12,
        color: '#fff',
        fontSize: 18,
        fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s',
        boxShadow: disabled ? 'none' : '0 6px 20px rgba(0,0,0,0.3)',
        opacity: disabled ? 0.4 : 1,
      }}
      onMouseEnter={(e) => !disabled && (e.currentTarget.style.transform = 'scale(1.05)')}
      onMouseLeave={(e) => !disabled && (e.currentTarget.style.transform = 'scale(1)')}
    >
      {action}
    </button>
  );
}

// ===== FASE 1: SETUP (FORMULÁRIO LIMPO) =====
function PracticeSetup({ 
  config, 
  setConfig, 
  onStart, 
  loading,
  canStart 
}: { 
  config: Partial<PracticeConfig>; 
  setConfig: (config: Partial<PracticeConfig>) => void; 
  onStart: () => void;
  loading: boolean;
  canStart: boolean;
}) {
  return (
    <div style={{ maxWidth: 500, margin: '40px auto', padding: '20px' }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 32, textAlign: 'center' }}>
        🎯 Practice — Setup
      </h1>

      <div className="card" style={{ padding: 32 }}>
        <h3 style={{ marginBottom: 20, fontSize: 16, color: '#94a3b8' }}>Configuração</h3>

        {/* Posição */}
        <label style={{ display: 'block', marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 10, fontWeight: 600 }}>
            Sua Posição <span style={{ color: '#ef4444' }}>*</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {POSITIONS_6MAX.map(pos => (
              <button
                key={pos}
                onClick={() => setConfig({ ...config, heroPosition: pos })}
                style={{
                  padding: '12px',
                  background: config.heroPosition === pos ? '#10b981' : '#334155',
                  border: config.heroPosition === pos ? '2px solid #10b981' : '1px solid #475569',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: config.heroPosition === pos ? 700 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {pos}
              </button>
            ))}
          </div>
        </label>

        {/* Tipo de Jogo */}
        <label style={{ display: 'block', marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 10, fontWeight: 600 }}>
            Tipo de Jogo
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {(['CASH', 'MTT'] as GameType[]).map(type => (
              <button
                key={type}
                onClick={() => setConfig({ ...config, gameType: type })}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: config.gameType === type ? '#8b5cf6' : '#334155',
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: config.gameType === type ? 700 : 400,
                  cursor: 'pointer',
                }}
              >
                {type}
              </button>
            ))}
          </div>
        </label>

        {/* Stakes */}
        <label style={{ display: 'block', marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 10, fontWeight: 600 }}>
            Stakes
          </div>
          <select
            value={config.stakes || 'NL50'}
            onChange={(e) => setConfig({ ...config, stakes: e.target.value })}
            style={{
              width: '100%',
              padding: '12px',
              background: '#334155',
              border: '1px solid #475569',
              borderRadius: 8,
              color: '#fff',
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            {STAKES.map(stake => (
              <option key={stake} value={stake}>{stake}</option>
            ))}
          </select>
        </label>

        {/* Situação */}
        <label style={{ display: 'block', marginBottom: 32 }}>
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 10, fontWeight: 600 }}>
            Situação
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {(['SRP', '3BET', '4BET', 'SQUEEZE'] as Spot[]).map(spot => (
              <button
                key={spot}
                onClick={() => setConfig({ ...config, spot })}
                style={{
                  padding: '12px',
                  background: config.spot === spot ? '#8b5cf6' : '#334155',
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: config.spot === spot ? 700 : 400,
                  cursor: 'pointer',
                }}
              >
                {spot}
              </button>
            ))}
          </div>
        </label>

        {/* Botão Iniciar */}
        <button
          onClick={onStart}
          disabled={!canStart || loading}
          style={{
            width: '100%',
            padding: '16px',
            background: (!canStart || loading) 
              ? '#64748b' 
              : 'linear-gradient(135deg, #10b981, #06b6d4)',
            border: 'none',
            borderRadius: 10,
            color: '#fff',
            fontSize: 16,
            fontWeight: 700,
            cursor: (!canStart || loading) ? 'not-allowed' : 'pointer',
            opacity: (!canStart || loading) ? 0.5 : 1,
            boxShadow: (!canStart || loading) ? 'none' : '0 6px 20px rgba(16, 185, 129, 0.4)',
          }}
        >
          {loading ? '⏳ Gerando mão...' : '▶️ INICIAR TREINO'}
        </button>

        {!config.heroPosition && (
          <p style={{ marginTop: 12, fontSize: 12, color: '#f59e0b', textAlign: 'center' }}>
            ⚠️ Selecione sua posição para continuar
          </p>
        )}
      </div>
    </div>
  );
}

// ===== FASE 2: HAND (MESA GTO-STYLE) =====
function PracticeTable({ 
  session, 
  onAction 
}: { 
  session: PracticeSession; 
  onAction: (action: Action) => void;
}) {
  const currentHand = session.hands[session.currentHandIndex];
  const { config } = session;

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: '20px' }}>
      {/* Info Contexto */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: 32,
        padding: 20,
        background: 'rgba(100, 116, 139, 0.1)',
        borderRadius: 12,
      }}>
        <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 8 }}>
          Você está no <strong style={{ color: '#10b981' }}>{config.heroPosition}</strong> · 
          Stack: <strong>{currentHand.stack}bb</strong> · 
          Situação: <strong>{config.spot}</strong>
        </div>
        <div style={{ fontSize: 12, color: '#64748b' }}>
          {currentHand.street}
        </div>
      </div>

      {/* Hole Cards */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: 16, 
        marginBottom: 32 
      }}>
        {currentHand.holeCards.map((card, i) => (
          <Card key={i} card={card} />
        ))}
      </div>

      {/* Board */}
      {currentHand.board.length > 0 && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: 12, 
          marginBottom: 40,
          padding: 24,
          background: 'linear-gradient(135deg, #1e293b, #334155)',
          borderRadius: 16,
        }}>
          {currentHand.board.map((card, i) => (
            <Card key={i} card={card} />
          ))}
        </div>
      )}

      {/* Actions */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: 20,
        marginTop: 48,
      }}>
        {currentHand.availableActions.map(action => (
          <ActionButton
            key={action}
            action={action}
            onClick={() => onAction(action)}
            disabled={!!currentHand.userAction}
          />
        ))}
      </div>
    </div>
  );
}

// ===== FASE 3: FEEDBACK =====
function PracticeFeedback({ 
  session, 
  onRepeat, 
  onNext 
}: { 
  session: PracticeSession; 
  onRepeat: () => void; 
  onNext: () => void;
}) {
  const score = calculateScore(session.mistakes);
  const scoreEmoji = {
    PERFECT: '🟢',
    GOOD: '🟡',
    MISTAKE: '🟠',
    BLUNDER: '🔴',
  };
  const scoreColor = {
    PERFECT: '#10b981',
    GOOD: '#f59e0b',
    MISTAKE: '#fb923c',
    BLUNDER: '#ef4444',
  };

  return (
    <div style={{ maxWidth: 600, margin: '60px auto', padding: '20px', textAlign: 'center' }}>
      <div style={{ fontSize: 80, marginBottom: 16 }}>
        {scoreEmoji[score]}
      </div>

      <h2 style={{ 
        fontSize: 48, 
        fontWeight: 700, 
        marginBottom: 12,
        color: scoreColor[score],
      }}>
        {score}
      </h2>

      <p style={{ fontSize: 16, color: '#94a3b8', marginBottom: 40 }}>
        Erros: <strong>{session.mistakes}</strong>
      </p>

      {/* Review das mãos */}
      <div style={{ 
        background: 'rgba(100, 116, 139, 0.1)', 
        padding: 24, 
        borderRadius: 12, 
        marginBottom: 40,
        textAlign: 'left',
      }}>
        <h4 style={{ fontSize: 14, color: '#94a3b8', marginBottom: 16 }}>
          Revisão das Ações:
        </h4>
        {session.hands.map((hand, i) => (
          <div key={i} style={{ 
            marginBottom: 12, 
            fontSize: 13, 
            color: hand.userAction === hand.correctAction ? '#10b981' : '#ef4444',
          }}>
            {hand.street}: Você <strong>{hand.userAction || '—'}</strong> · 
            Correto: <strong>{hand.correctAction}</strong>
            {hand.userAction !== hand.correctAction && ' ❌'}
            {hand.userAction === hand.correctAction && ' ✅'}
          </div>
        ))}
      </div>

      {/* Botões */}
      <div style={{ display: 'flex', gap: 16 }}>
        <button
          onClick={onRepeat}
          style={{
            flex: 1,
            padding: '16px',
            background: '#334155',
            border: 'none',
            borderRadius: 10,
            color: '#fff',
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          🔁 Repeat Hand
        </button>
        <button
          onClick={onNext}
          style={{
            flex: 1,
            padding: '16px',
            background: 'linear-gradient(135deg, #10b981, #06b6d4)',
            border: 'none',
            borderRadius: 10,
            color: '#fff',
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)',
          }}
        >
          ▶️ Next Hand
        </button>
      </div>
    </div>
  );
}

// ===== COMPONENTE PRINCIPAL =====
export default function TrainerV2() {
  const auth = useAuth();
  const navigate = useNavigate();

  const [stage, setStage] = useState<PracticeStage>('SETUP');
  const [config, setConfig] = useState<Partial<PracticeConfig>>({
    gameType: 'CASH',
    stakes: 'NL50',
    spot: 'SRP',
  });
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [loading, setLoading] = useState(false);

  // Verificar créditos (usosTrainer específico para essa página)
  const isPremium = auth.user?.premium || (auth.user as any)?.statusPlano === 'premium';
  const usosTrainer = (auth.user as any)?.usosTrainer ?? 5;
  const canUse = isPremium || usosTrainer > 0;

  // Validação para iniciar
  const canStart = !!(
    config.heroPosition &&
    config.gameType &&
    config.stakes &&
    config.spot &&
    canUse
  );

  // ===== INICIAR TREINO =====
  const handleStartPractice = async () => {
    if (!canStart) return;

    // PaywallOverlay já bloqueia se não tiver créditos
    if (!canUse) {
      return;
    }

    if (!auth.token) {
      navigate('/login');
      return;
    }

    setLoading(true);
    
    try {
      // Consumir crédito no backend
      const response = await fetch(`${API_URL}/api/trainer/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`,
        },
        body: JSON.stringify({
          table: '6MAX',
          position: config.heroPosition,
          gameType: config.gameType,
          street: 'Pré-flop',
          action: 'Raise',
        }),
      });

      const data = await response.json();

      if (data.error === 'no_credits') {
        // PaywallOverlay detecta automaticamente após refresh
        if (auth.refreshUser) await auth.refreshUser();
        return;
      }

      // Atualizar créditos
      if (auth.refreshUser) await auth.refreshUser();

      // Gerar 4 mãos (preflop, flop, turn, river)
      const holeCards = generateHoleCards();
      const streets: Street[] = ['PREFLOP', 'FLOP', 'TURN', 'RIVER'];
      
      const hands: Hand[] = streets.map((street, i) => {
        let board: string[] = [];
        if (street === 'FLOP') board = generateBoard(3, holeCards);
        if (street === 'TURN') board = generateBoard(4, holeCards);
        if (street === 'RIVER') board = generateBoard(5, holeCards);

        return {
          street,
          holeCards,
          board,
          stack: 32,
          pot: street === 'PREFLOP' ? 1.5 : 5.0,
          availableActions: getAvailableActions(street),
          correctAction: getCorrectAction(street, config.heroPosition as Position),
        };
      });

      setSession({
        config: config as PracticeConfig,
        hands,
        currentHandIndex: 0,
        mistakes: 0,
      });

      setStage('HAND');
    } catch (error) {
      console.error('Erro ao iniciar treino:', error);
      alert('Erro ao iniciar treino. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // ===== AÇÃO DO USUÁRIO =====
  const handleAction = (action: Action) => {
    if (!session) return;

    const currentHand = session.hands[session.currentHandIndex];
    const isCorrect = action === currentHand.correctAction;
    
    // Registrar ação
    currentHand.userAction = action;
    
    // Incrementar erros
    if (!isCorrect) {
      session.mistakes += 1;
    }

    // Avançar ou finalizar
    if (session.currentHandIndex < session.hands.length - 1) {
      setSession({
        ...session,
        currentHandIndex: session.currentHandIndex + 1,
      });
    } else {
      setStage('FEEDBACK');
    }
  };

  // ===== REPEAT / NEXT =====
  const handleRepeat = () => {
    if (!session) return;
    
    // Resetar ações
    session.hands.forEach(hand => {
      hand.userAction = undefined;
    });
    
    setSession({
      ...session,
      currentHandIndex: 0,
      mistakes: 0,
    });
    
    setStage('HAND');
  };

  const handleNext = async () => {
    await handleStartPractice();
  };

  // ===== RENDERIZAÇÃO =====
  if (!auth.token) {
    return (
      <div style={{ maxWidth: 600, margin: '40px auto', textAlign: 'center' }}>
        <h1>🎯 Practice</h1>
        <p style={{ color: '#94a3b8', marginBottom: 24 }}>
          Faça login para treinar decisões GTO
        </p>
        <button
          onClick={() => navigate('/login')}
          style={{
            padding: '12px 32px',
            background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
            border: 'none',
            borderRadius: 10,
            color: '#fff',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Entrar / Criar Conta
        </button>
      </div>
    );
  }

  return (
    <PaywallOverlay requiredCredits={1} creditType="trainer">
      <div style={{ minHeight: '100vh' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px' }}>
          {/* Banner de Créditos Baixos */}
          <CreditWarningBanner 
            credits={usosTrainer}
            isPremium={isPremium}
            onUpgrade={() => navigate('/premium')}
          />

          {/* RENDERIZAÇÃO POR STAGE */}
          {stage === 'SETUP' && (
          <PracticeSetup
            config={config}
            setConfig={setConfig}
            onStart={handleStartPractice}
            loading={loading}
            canStart={canStart}
          />
        )}

        {stage === 'HAND' && session && (
          <PracticeTable
            session={session}
            onAction={handleAction}
          />
        )}

        {stage === 'FEEDBACK' && session && (
          <PracticeFeedback
            session={session}
            onRepeat={handleRepeat}
            onNext={handleNext}
          />
        )}
        </div>
      </div>
    </PaywallOverlay>
  );
}
