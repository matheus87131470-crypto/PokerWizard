/**
 * TRAINER V2 - DESIGN OFICIAL
 * 
 * Máquina de Estados: SETUP → PREFLOP → FLOP → TURN → RIVER → FEEDBACK
 * Board progressivo: Cartas aparecem stage por stage
 * Feedback seco: Perfect / Blunder (GTO Wizard style)
 * Loop viciante: Repeat Hand / Next Hand
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
type TableSize = '6MAX' | '9MAX';
type PracticeStage = 'SETUP' | 'PREFLOP' | 'FLOP' | 'TURN' | 'RIVER' | 'FEEDBACK';
type Action = 'FOLD' | 'CALL' | 'RAISE' | 'CHECK' | 'BET' | 'ALLIN';
type Score = 'PERFECT' | 'GOOD' | 'MISTAKE' | 'BLUNDER';
type Spot = 'SRP' | '3BET' | '4BET' | 'SQUEEZE';

interface PracticeConfig {
  gameType: GameType;
  tableSize: TableSize;
  stakes: string;
  spot: Spot;
}

interface PracticeSession {
  stage: PracticeStage;
  config: PracticeConfig;
  heroPosition: Position;
  villainPosition: Position | null;
  holeCards: string[]; // ['As', 'Kh']
  board: string[]; // Progressivo: [] → [Qh,Jd,Ts] → [Qh,Jd,Ts,9c] → [Qh,Jd,Ts,9c,2h]
  availableActions: Action[];
  correctActions: Partial<Record<PracticeStage, Action>>;
  userActions: Partial<Record<PracticeStage, Action>>;
  mistakes: number;
  score?: Score;
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

function generateBoard(count: number): string[] {
  const cards: string[] = [];
  while (cards.length < count) {
    const card = generateCard();
    if (!cards.includes(card)) cards.push(card);
  }
  return cards;
}

// ===== GTO MOCK (simplificado) =====
function getCorrectAction(stage: PracticeStage, position: Position): Action {
  // Mock simples - idealmente viria do backend
  const preflopRanges: Record<Position, string[]> = {
    UTG: ['AA', 'KK', 'QQ', 'JJ', 'AKs'],
    HJ: ['AA', 'KK', 'QQ', 'JJ', 'TT', 'AKs', 'AKo'],
    CO: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', 'AKs', 'AKo', 'AQs'],
    BTN: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', 'AKs', 'AKo', 'AQs', 'AQo'],
    SB: ['AA', 'KK', 'QQ', 'JJ', 'TT', 'AKs', 'AKo'],
    BB: ['AA', 'KK', 'QQ', 'JJ', 'AKs'],
  };

  if (stage === 'PREFLOP') {
    return Math.random() > 0.5 ? 'RAISE' : 'FOLD';
  }
  
  return Math.random() > 0.3 ? 'BET' : 'CHECK';
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
      width: 60,
      height: 85,
      background: '#fff',
      borderRadius: 8,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 24,
      fontWeight: 700,
      color: isRed ? '#ef4444' : '#1e293b',
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    }}>
      <div>{rank}</div>
      <div style={{ fontSize: 28 }}>{suit}</div>
    </div>
  );
}

function PokerTable({ heroPosition }: { heroPosition: Position }) {
  const positions: { pos: Position; x: number; y: number }[] = [
    { pos: 'BTN', x: 70, y: 60 },
    { pos: 'SB', x: 50, y: 30 },
    { pos: 'BB', x: 30, y: 60 },
    { pos: 'UTG', x: 30, y: 90 },
    { pos: 'HJ', x: 50, y: 120 },
    { pos: 'CO', x: 70, y: 120 },
  ];

  return (
    <div style={{ 
      position: 'relative', 
      width: '100%',
      maxWidth: 500, 
      height: 300, 
      margin: '0 auto',
      background: 'linear-gradient(135deg, #1e293b, #334155)',
      borderRadius: 150,
      border: '8px solid #475569',
    }}>
      {positions.map(({ pos, x, y }) => (
        <div
          key={pos}
          style={{
            position: 'absolute',
            left: `${x}%`,
            top: `${y}%`,
            transform: 'translate(-50%, -50%)',
            padding: '8px 16px',
            background: pos === heroPosition ? '#10b981' : '#64748b',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 700,
            color: '#fff',
          }}
        >
          {pos}
        </div>
      ))}
    </div>
  );
}

function ActionButton({ action, onClick }: { action: Action; onClick: () => void }) {
  const colors: Record<Action, string> = {
    FOLD: '#ef4444',
    CALL: '#3b82f6',
    RAISE: '#10b981',
    CHECK: '#6b7280',
    BET: '#f59e0b',
    ALLIN: '#8b5cf6',
  };

  return (
    <button
      onClick={onClick}
      style={{
        padding: '16px 32px',
        background: colors[action],
        border: 'none',
        borderRadius: 12,
        color: '#fff',
        fontSize: 16,
        fontWeight: 700,
        cursor: 'pointer',
        transition: 'all 0.2s',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      }}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
    >
      {action}
    </button>
  );
}

// ===== COMPONENTE PRINCIPAL =====
export default function TrainerV2() {
  const auth = useAuth();
  const navigate = useNavigate();

  const usosTrainer = (auth.user as any)?.usosTrainer ?? 5;
  const isPremium = auth.user?.premium || (auth.user as any)?.statusPlano === 'premium';

  const [config, setConfig] = useState<PracticeConfig>({
    gameType: 'CASH',
    tableSize: '6MAX',
    stakes: 'NL100',
    spot: 'SRP',
  });

  const [heroPosition, setHeroPosition] = useState<Position | null>(null);
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [loading, setLoading] = useState(false);

  // ===== CONSUMIR CRÉDITO =====
  const consumeCredit = async (): Promise<boolean> => {
    if (isPremium) return true;

    try {
      const res = await fetch(`${API_URL}/api/trainer/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`,
        },
        body: JSON.stringify({
          table: config.tableSize,
          position: 'BTN',
          gameType: config.gameType,
          street: 'Pré-flop',
          action: 'Raise',
        }),
      });

      if (res.status === 403) {
        if (auth.refreshUser) await auth.refreshUser();
        return false;
      }

      if (auth.refreshUser) await auth.refreshUser();
      return true;
    } catch {
      return false;
    }
  };

  // ===== INICIAR TREINO =====
  const handleStartPractice = async () => {
    // Validação 1: Hero Position obrigatória
    if (!heroPosition) {
      alert('⚠️ Selecione uma posição para jogar');
      return;
    }

    const isFree = !isPremium;

    // Validação 2: Créditos FREE
    if (isFree && usosTrainer <= 0) {
      // Paywall será exibido automaticamente pelo PaywallOverlay
      return;
    }

    setLoading(true);
    
    try {
      const allowed = await consumeCredit();
      
      if (!allowed) {
        setLoading(false);
        return;
      }

      // Gerar mão inicial
      const holeCards = generateHoleCards();

      setSession({
        stage: 'PREFLOP',
        config,
        heroPosition: heroPosition,
        villainPosition: 'BB',
        holeCards,
        board: [],
        availableActions: ['FOLD', 'CALL', 'RAISE'],
        correctActions: {
          PREFLOP: getCorrectAction('PREFLOP', heroPosition),
          FLOP: getCorrectAction('FLOP', heroPosition),
          TURN: getCorrectAction('TURN', heroPosition),
          RIVER: getCorrectAction('RIVER', heroPosition),
        },
        userActions: {},
        mistakes: 0,
      });
    } catch (error) {
      console.error('Erro ao iniciar treino:', error);
      alert('Erro ao iniciar treino. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // ===== AVANÇAR STAGE =====
  const handleAction = (action: Action) => {
    if (!session) return;

    const newUserActions = { ...session.userActions, [session.stage]: action };
    const correct = session.correctActions[session.stage] === action;
    const newMistakes = correct ? session.mistakes : session.mistakes + 1;

    // Determinar próximo stage
    const stageOrder: PracticeStage[] = ['PREFLOP', 'FLOP', 'TURN', 'RIVER', 'FEEDBACK'];
    const currentIndex = stageOrder.indexOf(session.stage);
    const nextStage = stageOrder[currentIndex + 1];

    // Atualizar board progressivamente
    let newBoard = session.board;
    if (nextStage === 'FLOP') newBoard = generateBoard(3);
    if (nextStage === 'TURN') newBoard = [...session.board, generateCard()];
    if (nextStage === 'RIVER') newBoard = [...session.board, generateCard()];

    // Atualizar ações disponíveis
    let newActions: Action[] = ['CHECK', 'BET', 'FOLD'];
    if (nextStage === 'FEEDBACK') {
      setSession({
        ...session,
        stage: nextStage,
        userActions: newUserActions,
        mistakes: newMistakes,
        score: calculateScore(newMistakes),
      });
      return;
    }

    setSession({
      ...session,
      stage: nextStage,
      board: newBoard,
      availableActions: newActions,
      userActions: newUserActions,
      mistakes: newMistakes,
    });
  };

  // ===== REPEAT / NEXT =====
  const repeatHand = () => {
    if (!session) return;
    setSession({
      ...session,
      stage: 'PREFLOP',
      board: [],
      userActions: {},
      mistakes: 0,
      score: undefined,
    });
  };

  const nextHand = async () => {
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
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px' }}>
        <CreditWarningBanner
          credits={usosTrainer}
          isPremium={isPremium}
          onUpgrade={() => navigate('/premium')}
        />

        {/* SETUP */}
        {!session && (
          <div>
            <h1 style={{ marginBottom: 24 }}>🎯 Practice — Setup</h1>

            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24 }}>
              {/* Config */}
              <div className="card" style={{ padding: 20 }}>
                <h3 style={{ marginBottom: 16 }}>Configuração</h3>

                <label style={{ display: 'block', marginBottom: 12, fontSize: 12, color: '#94a3b8' }}>
                  Sua Posição (obrigatório)
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 6 }}>
                    {POSITIONS_6MAX.map(pos => (
                      <button
                        key={pos}
                        onClick={() => setHeroPosition(pos)}
                        style={{
                          padding: '8px',
                          background: heroPosition === pos ? '#10b981' : '#334155',
                          border: heroPosition === pos ? '2px solid #10b981' : '1px solid #475569',
                          borderRadius: 6,
                          color: '#fff',
                          fontSize: 11,
                          fontWeight: heroPosition === pos ? 700 : 400,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                </label>

                <label style={{ display: 'block', marginBottom: 12, fontSize: 12, color: '#94a3b8' }}>
                  Tipo de Jogo
                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    {(['CASH', 'MTT'] as GameType[]).map(type => (
                      <button
                        key={type}
                        onClick={() => setConfig({ ...config, gameType: type })}
                        style={{
                          flex: 1,
                          padding: '8px',
                          background: config.gameType === type ? '#8b5cf6' : '#334155',
                          border: 'none',
                          borderRadius: 6,
                          color: '#fff',
                          fontSize: 12,
                          cursor: 'pointer',
                        }}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </label>

                <label style={{ display: 'block', marginBottom: 12, fontSize: 12, color: '#94a3b8' }}>
                  Stakes
                  <select
                    value={config.stakes}
                    onChange={(e) => setConfig({ ...config, stakes: e.target.value })}
                    style={{
                      width: '100%',
                      marginTop: 6,
                      padding: '8px',
                      background: '#334155',
                      border: '1px solid #475569',
                      borderRadius: 6,
                      color: '#fff',
                      fontSize: 12,
                    }}
                  >
                    {STAKES.map(stake => (
                      <option key={stake} value={stake}>{stake}</option>
                    ))}
                  </select>
                </label>

                <label style={{ display: 'block', marginBottom: 20, fontSize: 12, color: '#94a3b8' }}>
                  Situação
                  <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                    {(['SRP', '3BET', '4BET', 'SQUEEZE'] as Spot[]).map(spot => (
                      <button
                        key={spot}
                        onClick={() => setConfig({ ...config, spot })}
                        style={{
                          padding: '6px 12px',
                          background: config.spot === spot ? '#8b5cf6' : '#334155',
                          border: 'none',
                          borderRadius: 6,
                          color: '#fff',
                          fontSize: 11,
                          cursor: 'pointer',
                        }}
                      >
                        {spot}
                      </button>
                    ))}
                  </div>
                </label>

                <button
                  onClick={handleStartPractice}
                  disabled={!heroPosition || loading || (!isPremium && usosTrainer <= 0)}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: (!heroPosition || loading || (!isPremium && usosTrainer <= 0)) 
                      ? '#64748b' 
                      : 'linear-gradient(135deg, #10b981, #06b6d4)',
                    border: 'none',
                    borderRadius: 10,
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: (!heroPosition || loading || (!isPremium && usosTrainer <= 0)) 
                      ? 'not-allowed' 
                      : 'pointer',
                    opacity: (!heroPosition || (!isPremium && usosTrainer <= 0)) ? 0.5 : 1,
                  }}
                >
                  {loading ? 'Gerando...' : '▶️ INICIAR TREINO'}
                </button>
                
                {/* DEBUG VISUAL (temporário) */}
                <div style={{ marginTop: 12, padding: 8, background: 'rgba(0,0,0,0.2)', borderRadius: 6, fontSize: 11, opacity: 0.6 }}>
                  <div>Stage: {session?.stage || 'SETUP'}</div>
                  <div>Credits: {usosTrainer}</div>
                  <div>Position: {heroPosition || 'não selecionada'}</div>
                  <div>Premium: {isPremium ? 'Sim' : 'Não'}</div>
                </div>
              </div>

              {/* Mesa Preview */}
              <div className="card" style={{ padding: 40, textAlign: 'center' }}>
                <PokerTable heroPosition={heroPosition || 'BTN'} />
                <p style={{ marginTop: 20, color: '#94a3b8', fontSize: 13 }}>
                  {!heroPosition && '⚠️ Selecione sua posição acima'}
                  {heroPosition && !isPremium && usosTrainer <= 0 && '⚠️ Sem créditos disponíveis'}
                  {heroPosition && (isPremium || usosTrainer > 0) && 'Tudo pronto! Clique em "Iniciar Treino"'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* PREFLOP / FLOP / TURN / RIVER */}
        {session && session.stage !== 'FEEDBACK' && (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ marginBottom: 24 }}>
              {session.stage === 'PREFLOP' && '🎴 Preflop'}
              {session.stage === 'FLOP' && '🎲 Flop'}
              {session.stage === 'TURN' && '🎯 Turn'}
              {session.stage === 'RIVER' && '🏁 River'}
            </h2>

            {/* Mesa */}
            <div style={{ marginBottom: 24 }}>
              <PokerTable heroPosition={session.heroPosition} />
            </div>

            {/* Hole Cards */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
              {session.holeCards.map((card, i) => (
                <Card key={i} card={card} />
              ))}
            </div>

            {/* Board */}
            {session.board.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
                {session.board.map((card, i) => (
                  <Card key={i} card={card} />
                ))}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 32 }}>
              {session.availableActions.map(action => (
                <ActionButton
                  key={action}
                  action={action}
                  onClick={() => handleAction(action)}
                />
              ))}
            </div>
          </div>
        )}

        {/* FEEDBACK */}
        {session && session.stage === 'FEEDBACK' && (
          <div style={{ textAlign: 'center', maxWidth: 500, margin: '40px auto' }}>
            {/* Badge de Score */}
            <div style={{
              fontSize: 72,
              marginBottom: 16,
            }}>
              {session.score === 'PERFECT' && '🟢'}
              {session.score === 'GOOD' && '🟡'}
              {session.score === 'MISTAKE' && '🟠'}
              {session.score === 'BLUNDER' && '🔴'}
            </div>

            <h2 style={{
              fontSize: 32,
              fontWeight: 700,
              marginBottom: 8,
              color: session.score === 'PERFECT' ? '#10b981' : session.score === 'BLUNDER' ? '#ef4444' : '#f59e0b'
            }}>
              {session.score}
            </h2>

            <p style={{ color: '#94a3b8', marginBottom: 24, fontSize: 14 }}>
              Erros: {session.mistakes}
            </p>

            {/* Ações corretas */}
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              padding: 20,
              borderRadius: 12,
              marginBottom: 24,
              textAlign: 'left',
            }}>
              <h4 style={{ marginBottom: 12, fontSize: 14, color: '#94a3b8' }}>Ações Corretas:</h4>
              <div style={{ fontSize: 13, color: '#e2e8f0' }}>
                Preflop: <strong>{session.correctActions.PREFLOP}</strong><br />
                Flop: <strong>{session.correctActions.FLOP}</strong><br />
                Turn: <strong>{session.correctActions.TURN}</strong><br />
                River: <strong>{session.correctActions.RIVER}</strong>
              </div>
            </div>

            {/* Botões */}
            <div style={{ display: 'flex', gap: 16 }}>
              <button
                onClick={repeatHand}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: '#334155',
                  border: 'none',
                  borderRadius: 10,
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                🔁 Repeat Hand
              </button>
              <button
                onClick={nextHand}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                  border: 'none',
                  borderRadius: 10,
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                ▶️ Next Hand
              </button>
            </div>
          </div>
        )}
      </div>
    </PaywallOverlay>
  );
}
