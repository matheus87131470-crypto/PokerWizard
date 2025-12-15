import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// ===== TIPOS =====
type Position = 'UTG' | 'HJ' | 'CO' | 'BTN' | 'SB' | 'BB';
type GameType = 'cash' | 'mtt';
type TableSize = '6max' | '9max';
type Stakes = 'NL50' | 'NL100' | 'NL200' | 'NL500';
type Street = 'preflop' | 'flop' | 'turn' | 'river';
type PreflopAction = 'any' | 'srp' | '3bet' | '4bet' | '5bet' | 'squeeze' | 'limp' | 'iso';
type Action = 'fold' | 'call' | 'raise' | 'check' | 'bet' | 'allin';

interface TrainingConfig {
  gameType: GameType;
  tableSize: TableSize;
  stakes: Stakes;
  startingSpot: Street;
  preflopAction: PreflopAction;
  heroPosition: Position;
  villainPosition: Position | null;
}

interface Hand {
  card1: string;
  card2: string;
}

interface TrainingStats {
  total: number;
  correct: number;
  streak: number;
  bestStreak: number;
}

// ===== DADOS GTO =====
const POSITIONS_6MAX: Position[] = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];

const CARD_RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

// Ranges GTO simplificados por posição
const GTO_RANGES: Record<Position, Record<PreflopAction, string[]>> = {
  UTG: {
    any: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', 'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'KQs'],
    srp: ['AA', 'KK', 'QQ', 'JJ', 'TT', 'AKs', 'AKo', 'AQs'],
    '3bet': ['AA', 'KK', 'QQ', 'AKs'],
    '4bet': ['AA', 'KK'],
    '5bet': ['AA'],
    squeeze: ['AA', 'KK', 'QQ', 'AKs'],
    limp: [],
    iso: ['AA', 'KK', 'QQ', 'JJ', 'TT', 'AKs', 'AKo'],
  },
  HJ: {
    any: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', 'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'ATs', 'KQs', 'KQo', 'KJs', 'QJs'],
    srp: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', 'AKs', 'AKo', 'AQs', 'AQo', 'AJs'],
    '3bet': ['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo'],
    '4bet': ['AA', 'KK', 'QQ'],
    '5bet': ['AA', 'KK'],
    squeeze: ['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo'],
    limp: [],
    iso: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', 'AKs', 'AKo', 'AQs'],
  },
  CO: {
    any: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', 'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'ATs', 'A9s', 'KQs', 'KQo', 'KJs', 'KTs', 'QJs', 'QTs', 'JTs'],
    srp: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', 'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'ATs', 'KQs'],
    '3bet': ['AA', 'KK', 'QQ', 'JJ', 'TT', 'AKs', 'AKo', 'AQs'],
    '4bet': ['AA', 'KK', 'QQ', 'JJ'],
    '5bet': ['AA', 'KK'],
    squeeze: ['AA', 'KK', 'QQ', 'JJ', 'TT', 'AKs', 'AKo', 'AQs'],
    limp: [],
    iso: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', 'AKs', 'AKo', 'AQs', 'AQo', 'AJs'],
  },
  BTN: {
    any: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', 'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'AJo', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s', 'KQs', 'KQo', 'KJs', 'KJo', 'KTs', 'K9s', 'QJs', 'QJo', 'QTs', 'Q9s', 'JTs', 'J9s', 'T9s', '98s', '87s', '76s', '65s', '54s'],
    srp: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', 'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'ATs', 'A9s', 'KQs', 'KQo', 'KJs', 'QJs'],
    '3bet': ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', 'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'KQs'],
    '4bet': ['AA', 'KK', 'QQ', 'JJ', 'TT'],
    '5bet': ['AA', 'KK', 'QQ'],
    squeeze: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', 'AKs', 'AKo', 'AQs', 'AQo'],
    limp: [],
    iso: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', 'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'ATs', 'KQs', 'KJs'],
  },
  SB: {
    any: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', 'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'AJo', 'ATs', 'A9s', 'A8s', 'KQs', 'KQo', 'KJs', 'KTs', 'QJs', 'QTs', 'JTs'],
    srp: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', 'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'ATs', 'KQs'],
    '3bet': ['AA', 'KK', 'QQ', 'JJ', 'TT', 'AKs', 'AKo', 'AQs'],
    '4bet': ['AA', 'KK', 'QQ', 'JJ'],
    '5bet': ['AA', 'KK'],
    squeeze: ['AA', 'KK', 'QQ', 'JJ', 'TT', 'AKs', 'AKo'],
    limp: ['22', '33', '44', '55', '66', 'A2s', 'A3s', 'A4s', 'A5s', '76s', '87s', '98s'],
    iso: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', 'AKs', 'AKo', 'AQs', 'AQo', 'AJs'],
  },
  BB: {
    any: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22', 'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'AJo', 'ATs', 'ATo', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s', 'KQs', 'KQo', 'KJs', 'KJo', 'KTs', 'K9s', 'QJs', 'QJo', 'QTs', 'Q9s', 'JTs', 'J9s', 'T9s', 'T8s', '98s', '97s', '87s', '86s', '76s', '75s', '65s', '64s', '54s', '53s', '43s'],
    srp: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', 'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'ATs', 'KQs', 'KJs', 'QJs'],
    '3bet': ['AA', 'KK', 'QQ', 'JJ', 'TT', 'AKs', 'AKo', 'AQs', 'AQo'],
    '4bet': ['AA', 'KK', 'QQ'],
    '5bet': ['AA', 'KK'],
    squeeze: ['AA', 'KK', 'QQ', 'JJ', 'TT', 'AKs', 'AKo', 'AQs'],
    limp: [],
    iso: [],
  },
};

// ===== FUNÇÕES AUXILIARES =====
function generateRandomHand(): Hand {
  const suits = ['s', 'h', 'd', 'c'];
  const getRandomCard = () => {
    const rank = CARD_RANKS[Math.floor(Math.random() * CARD_RANKS.length)];
    const suit = suits[Math.floor(Math.random() * suits.length)];
    return rank + suit;
  };
  
  let card1 = getRandomCard();
  let card2 = getRandomCard();
  
  while (card1 === card2) {
    card2 = getRandomCard();
  }
  
  return { card1, card2 };
}

function handToNotation(hand: Hand): string {
  const rank1 = hand.card1[0];
  const rank2 = hand.card2[0];
  const suit1 = hand.card1[1];
  const suit2 = hand.card2[1];
  
  const ranks = CARD_RANKS;
  const idx1 = ranks.indexOf(rank1);
  const idx2 = ranks.indexOf(rank2);
  
  if (rank1 === rank2) {
    return rank1 + rank2;
  }
  
  const highRank = idx1 < idx2 ? rank1 : rank2;
  const lowRank = idx1 < idx2 ? rank2 : rank1;
  const suited = suit1 === suit2 ? 's' : 'o';
  
  return highRank + lowRank + suited;
}

function isHandInRange(hand: Hand, range: string[]): boolean {
  const notation = handToNotation(hand);
  
  if (range.includes(notation)) return true;
  
  const pairNotation = notation.substring(0, 2);
  if (notation[0] === notation[1] && range.includes(pairNotation)) return true;
  
  const baseHand = notation.substring(0, 2);
  if (range.includes(baseHand + 's') || range.includes(baseHand + 'o')) return true;
  if (range.includes(baseHand)) return true;
  
  return false;
}

function getCorrectAction(hand: Hand, position: Position, preflopAction: PreflopAction): { action: Action; explanation: string } {
  const range = GTO_RANGES[position]?.[preflopAction] || [];
  const inRange = isHandInRange(hand, range);
  const handStr = handToNotation(hand);
  
  if (preflopAction === 'any' || preflopAction === 'srp') {
    if (inRange) {
      return {
        action: 'raise',
        explanation: `✅ ${handStr} está no range de abertura de ${position}. Esta mão tem valor suficiente para abrir raise. Você maximiza valor com mãos fortes e ganha fold equity.`
      };
    } else {
      return {
        action: 'fold',
        explanation: `📊 ${handStr} não está no range de abertura de ${position}. Abrir com esta mão seria -EV a longo prazo. Mantenha sua disciplina e espere por spots melhores.`
      };
    }
  }
  
  if (preflopAction === '3bet') {
    if (inRange) {
      return {
        action: 'raise',
        explanation: `🎯 ${handStr} é forte o suficiente para 3-bet de ${position}. Você tem equidade contra o range de abertura do vilão e boa fold equity. 3-bet por valor!`
      };
    } else {
      return {
        action: Math.random() > 0.5 ? 'fold' : 'call',
        explanation: `⚖️ ${handStr} não está no range de 3-bet de ${position}. Com mãos especulativas, considere call para set mining ou fold se as odds não justificam.`
      };
    }
  }
  
  if (preflopAction === '4bet' || preflopAction === '5bet') {
    if (inRange) {
      return {
        action: 'raise',
        explanation: `💎 ${handStr} tem valor para ${preflopAction} de ${position}. Mãos premium como esta justificam máxima agressividade pré-flop. All-in também é válido!`
      };
    } else {
      return {
        action: 'fold',
        explanation: `🛑 ${handStr} não suporta ${preflopAction} de ${position}. Escalar potes com mãos marginais contra ranges fortes é um leak comum. Fold e aguarde.`
      };
    }
  }
  
  if (preflopAction === 'squeeze') {
    if (inRange) {
      return {
        action: 'raise',
        explanation: `🔥 ${handStr} é ideal para squeeze de ${position}. Você pressiona o raiser original e o caller com dead money no pote. Excelente spot!`
      };
    } else {
      return {
        action: 'fold',
        explanation: `⚠️ ${handStr} não tem equidade suficiente para squeeze. Contra múltiplos ranges, você precisa de mãos mais fortes. Fold é correto.`
      };
    }
  }
  
  return {
    action: 'fold',
    explanation: `Ação padrão para ${handStr} em situação complexa. Quando em dúvida, fold preserva seu stack.`
  };
}

// ===== COMPONENTE DA MESA =====
function PokerTableVisual({ 
  positions, 
  heroPosition, 
  onSelectPosition,
  activePositions 
}: { 
  positions: Position[];
  heroPosition: Position;
  onSelectPosition: (pos: Position) => void;
  activePositions: Position[];
}) {
  const positionCoords: Record<Position, { x: number; y: number }> = {
    UTG: { x: 20, y: 65 },
    HJ: { x: 15, y: 35 },
    CO: { x: 35, y: 12 },
    BTN: { x: 65, y: 12 },
    SB: { x: 85, y: 35 },
    BB: { x: 80, y: 65 },
  };
  
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      maxWidth: 600,
      height: 300,
      margin: '0 auto',
      background: 'radial-gradient(ellipse at center, #1a472a 0%, #0d2818 70%, #061510 100%)',
      borderRadius: '50%/40%',
      border: '8px solid #2d1810',
      boxShadow: 'inset 0 0 60px rgba(0,0,0,0.5), 0 10px 40px rgba(0,0,0,0.5)',
    }}>
      {/* Linha da mesa */}
      <div style={{
        position: 'absolute',
        top: '15%',
        left: '10%',
        right: '10%',
        bottom: '15%',
        border: '2px solid rgba(255,215,0,0.3)',
        borderRadius: '50%/40%',
      }} />
      
      {/* Posições */}
      {positions.map((pos) => {
        const coords = positionCoords[pos];
        if (!coords) return null;
        
        const isHero = pos === heroPosition;
        const isActive = activePositions.includes(pos);
        
        return (
          <button
            key={pos}
            onClick={() => onSelectPosition(pos)}
            style={{
              position: 'absolute',
              left: `${coords.x}%`,
              top: `${coords.y}%`,
              transform: 'translate(-50%, -50%)',
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: isHero 
                ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)'
                : isActive 
                  ? 'linear-gradient(135deg, #059669, #047857)'
                  : 'linear-gradient(135deg, #374151, #1f2937)',
              border: isHero 
                ? '3px solid #a78bfa'
                : isActive
                  ? '3px solid #34d399'
                  : '2px solid #4b5563',
              color: 'white',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: isHero 
                ? '0 0 20px rgba(139, 92, 246, 0.5)'
                : '0 4px 12px rgba(0,0,0,0.3)',
            }}
          >
            {pos}
            {isHero && (
              <div style={{
                position: 'absolute',
                bottom: -20,
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: 10,
                color: '#a78bfa',
                whiteSpace: 'nowrap',
              }}>
                HERO
              </div>
            )}
          </button>
        );
      })}
      
      {/* Centro - Dealer Button */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
      }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
          border: '2px solid #fcd34d',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 800,
          fontSize: 11,
          color: '#1f2937',
          boxShadow: '0 4px 12px rgba(251, 191, 36, 0.4)',
        }}>
          D
        </div>
      </div>
    </div>
  );
}

// ===== COMPONENTE DE CARTAS =====
function CardDisplay({ card }: { card: string }) {
  const rank = card[0];
  const suit = card[1];
  
  const suitSymbol: Record<string, string> = {
    s: '♠', h: '♥', d: '♦', c: '♣'
  };
  
  const suitColor: Record<string, string> = {
    s: '#1f2937', h: '#dc2626', d: '#2563eb', c: '#059669'
  };
  
  return (
    <div style={{
      width: 70,
      height: 100,
      background: 'linear-gradient(135deg, #ffffff, #f3f4f6)',
      borderRadius: 8,
      border: '2px solid #e5e7eb',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      fontFamily: 'Georgia, serif',
    }}>
      <div style={{ 
        fontSize: 28, 
        fontWeight: 700, 
        color: suitColor[suit],
        lineHeight: 1,
      }}>
        {rank}
      </div>
      <div style={{ 
        fontSize: 32, 
        color: suitColor[suit],
        lineHeight: 1,
      }}>
        {suitSymbol[suit]}
      </div>
    </div>
  );
}

// ===== GRÁFICO DE EVOLUÇÃO =====
function EvolutionChart({ data }: { data: { hand: number; accuracy: number; correct: boolean }[] }) {
  if (data.length < 2) return null;
  
  const width = 600;
  const height = 200;
  const padding = { top: 20, right: 30, bottom: 30, left: 45 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  const maxHand = Math.max(...data.map(d => d.hand));
  const minAcc = Math.max(0, Math.min(...data.map(d => d.accuracy)) - 10);
  const maxAcc = Math.min(100, Math.max(...data.map(d => d.accuracy)) + 10);
  
  const xScale = (hand: number) => padding.left + (hand / maxHand) * chartWidth;
  const yScale = (acc: number) => padding.top + chartHeight - ((acc - minAcc) / (maxAcc - minAcc)) * chartHeight;
  
  const linePath = data.map((d, i) => {
    const x = xScale(d.hand);
    const y = yScale(d.accuracy);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');
  
  // Gradient para área sob a linha
  const areaPath = linePath + ` L ${xScale(data[data.length - 1].hand)} ${padding.top + chartHeight} L ${xScale(data[0].hand)} ${padding.top + chartHeight} Z`;
  
  return (
    <div className="card" style={{ marginTop: 20, padding: 20 }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        📈 Evolução da Sessão
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>
          ({data.length} mãos jogadas)
        </span>
      </h3>
      
      <div style={{ overflowX: 'auto' }}>
        <svg width={width} height={height} style={{ display: 'block', margin: '0 auto' }}>
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#6d28d9" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          
          {/* Grid horizontal */}
          {[0, 25, 50, 75, 100].filter(v => v >= minAcc && v <= maxAcc).map(v => (
            <g key={v}>
              <line
                x1={padding.left}
                y1={yScale(v)}
                x2={width - padding.right}
                y2={yScale(v)}
                stroke="var(--border)"
                strokeDasharray="4,4"
                opacity={0.5}
              />
              <text
                x={padding.left - 8}
                y={yScale(v)}
                textAnchor="end"
                alignmentBaseline="middle"
                fontSize={11}
                fill="var(--text-muted)"
              >
                {v}%
              </text>
            </g>
          ))}
          
          {/* Área sob a linha */}
          <path d={areaPath} fill="url(#areaGradient)" />
          
          {/* Linha principal */}
          <path
            d={linePath}
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Pontos */}
          {data.map((d, i) => (
            <g key={i}>
              <circle
                cx={xScale(d.hand)}
                cy={yScale(d.accuracy)}
                r={6}
                fill={d.correct ? '#10b981' : '#ef4444'}
                stroke="#fff"
                strokeWidth={2}
              />
              {/* Tooltip ao passar mouse (usando title) */}
              <title>Mão {d.hand}: {d.accuracy}% ({d.correct ? 'Acertou' : 'Errou'})</title>
            </g>
          ))}
          
          {/* Eixo X */}
          <line
            x1={padding.left}
            y1={height - padding.bottom}
            x2={width - padding.right}
            y2={height - padding.bottom}
            stroke="var(--border)"
          />
          <text
            x={width / 2}
            y={height - 5}
            textAnchor="middle"
            fontSize={11}
            fill="var(--text-muted)"
          >
            Mãos
          </text>
          
          {/* Eixo Y */}
          <text
            x={15}
            y={height / 2}
            textAnchor="middle"
            transform={`rotate(-90, 15, ${height / 2})`}
            fontSize={11}
            fill="var(--text-muted)"
          >
            Precisão
          </text>
        </svg>
      </div>
      
      {/* Legenda */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: 24, 
        marginTop: 12,
        fontSize: 12,
        color: 'var(--text-secondary)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }}></div>
          Acerto
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }}></div>
          Erro
        </div>
      </div>
    </div>
  );
}

// ===== COMPONENTE PRINCIPAL =====
export default function Trainer() {
  const auth = useAuth();
  const navigate = useNavigate();
  
  const [config, setConfig] = useState<TrainingConfig>({
    gameType: 'cash',
    tableSize: '6max',
    stakes: 'NL100',
    startingSpot: 'preflop',
    preflopAction: 'any',
    heroPosition: 'BTN',
    villainPosition: null,
  });
  
  const [isTraining, setIsTraining] = useState(false);
  const [currentHand, setCurrentHand] = useState<Hand | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<{ correct: boolean; explanation: string } | null>(null);
  const [stats, setStats] = useState<TrainingStats>({ total: 0, correct: 0, streak: 0, bestStreak: 0 });
  const [evolutionHistory, setEvolutionHistory] = useState<{ hand: number; accuracy: number; correct: boolean }[]>([]);
  
  const usosRestantes = (auth.user as any)?.usosRestantes ?? 5;
  const isPremium = auth.user?.premium || usosRestantes === -1;
  const canUse = isPremium || usosRestantes > 0;
  
  const startTraining = () => {
    if (!canUse && !isPremium) {
      navigate('/premium');
      return;
    }
    setIsTraining(true);
    setEvolutionHistory([]);
    setStats({ total: 0, correct: 0, streak: 0, bestStreak: 0 });
    generateNewHand();
  };
  
  const generateNewHand = () => {
    const hand = generateRandomHand();
    setCurrentHand(hand);
    setShowResult(false);
    setLastResult(null);
  };
  
  const handleAction = (action: Action) => {
    if (!currentHand) return;
    
    const correct = getCorrectAction(currentHand, config.heroPosition, config.preflopAction);
    const isCorrect = action === correct.action;
    
    setLastResult({
      correct: isCorrect,
      explanation: correct.explanation,
    });
    setShowResult(true);
    
    const newTotal = stats.total + 1;
    const newCorrect = stats.correct + (isCorrect ? 1 : 0);
    const newAccuracy = Math.round((newCorrect / newTotal) * 100);
    
    setStats(prev => ({
      total: prev.total + 1,
      correct: prev.correct + (isCorrect ? 1 : 0),
      streak: isCorrect ? prev.streak + 1 : 0,
      bestStreak: isCorrect ? Math.max(prev.bestStreak, prev.streak + 1) : prev.bestStreak,
    }));
    
    setEvolutionHistory(prev => [...prev, {
      hand: newTotal,
      accuracy: newAccuracy,
      correct: isCorrect,
    }]);
  };
  
  const nextHand = () => {
    generateNewHand();
  };
  
  // Se não está logado
  if (!auth.token) {
    return (
      <div>
        <h1>🎯 Trainer GTO Premium</h1>
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <h2>Acesso Exclusivo</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
            O Trainer GTO é exclusivo para membros. Crie sua conta gratuitamente e ganhe 5 treinos para testar.
          </p>
          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/login')}
            style={{ padding: '12px 32px', fontSize: 16 }}
          >
            Entrar / Criar Conta
          </button>
        </div>
      </div>
    );
  }
  
  // Se acabaram os usos
  if (!canUse) {
    return (
      <div>
        <h1>🎯 Trainer GTO Premium</h1>
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>💎</div>
          <h2>Seus Créditos Acabaram</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>
            Você utilizou seus 5 treinos gratuitos.
          </p>
          <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: 14 }}>
            Assine o Premium para treinos ilimitados e evolua seu jogo exponencialmente.
          </p>
          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/premium')}
            style={{ 
              padding: '14px 40px', 
              fontSize: 16,
              background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
            }}
          >
            ⚡ Assinar Premium
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 24,
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <h1 style={{ margin: 0 }}>🎯 Trainer GTO</h1>
        
        {!isPremium && (
          <div style={{
            padding: '8px 16px',
            background: 'rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: 8,
            fontSize: 13,
          }}>
            <span style={{ color: 'var(--text-secondary)' }}>Treinos restantes: </span>
            <span style={{ color: '#a78bfa', fontWeight: 700 }}>{usosRestantes}</span>
          </div>
        )}
        
        {isPremium && (
          <div style={{
            padding: '8px 16px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.2))',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: 8,
            fontSize: 13,
          }}>
            <span style={{ color: '#34d399', fontWeight: 700 }}>💎 Premium • Ilimitado</span>
          </div>
        )}
      </div>
      
      {/* Layout Principal */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
        
        {/* Sidebar - Configurações */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 14 }}>⚙️ Configurações</h3>
          
          {/* Game Type */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              Tipo de Jogo
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['cash', 'mtt'] as GameType[]).map(type => (
                <button
                  key={type}
                  onClick={() => setConfig(c => ({ ...c, gameType: type }))}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: config.gameType === type ? '2px solid #8b5cf6' : '1px solid var(--border-color)',
                    background: config.gameType === type ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                    color: config.gameType === type ? '#a78bfa' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {type === 'cash' ? 'Cash' : 'MTT'}
                </button>
              ))}
            </div>
          </div>
          
          {/* Table Size */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              Mesa
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['6max', '9max'] as TableSize[]).map(size => (
                <button
                  key={size}
                  onClick={() => setConfig(c => ({ ...c, tableSize: size }))}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: config.tableSize === size ? '2px solid #8b5cf6' : '1px solid var(--border-color)',
                    background: config.tableSize === size ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                    color: config.tableSize === size ? '#a78bfa' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
          
          {/* Stakes */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              Stakes
            </label>
            <select
              value={config.stakes}
              onChange={(e) => setConfig(c => ({ ...c, stakes: e.target.value as Stakes }))}
              className="search-input"
              style={{ width: '100%', padding: '8px 12px' }}
            >
              <option value="NL50">NL50</option>
              <option value="NL100">NL100</option>
              <option value="NL200">NL200</option>
              <option value="NL500">NL500</option>
            </select>
          </div>
          
          {/* Starting Spot */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              Situação Inicial
            </label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(['preflop', 'flop'] as Street[]).map(street => (
                <button
                  key={street}
                  onClick={() => setConfig(c => ({ ...c, startingSpot: street }))}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: config.startingSpot === street ? '2px solid #06b6d4' : '1px solid var(--border-color)',
                    background: config.startingSpot === street ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
                    color: config.startingSpot === street ? '#22d3ee' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'capitalize',
                  }}
                >
                  {street === 'preflop' ? 'Pré-flop' : 'Flop'}
                </button>
              ))}
            </div>
          </div>
          
          {/* Preflop Action */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              Ação Pré-flop
            </label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(['any', 'srp', '3bet', '4bet', 'squeeze'] as PreflopAction[]).map(action => (
                <button
                  key={action}
                  onClick={() => setConfig(c => ({ ...c, preflopAction: action }))}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 6,
                    border: config.preflopAction === action ? '2px solid #10b981' : '1px solid var(--border-color)',
                    background: config.preflopAction === action ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                    color: config.preflopAction === action ? '#34d399' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                  }}
                >
                  {action === 'any' ? 'Qualquer' : action === 'srp' ? 'SRP' : action}
                </button>
              ))}
            </div>
          </div>
          
          {/* Botão Iniciar */}
          {!isTraining ? (
            <button
              onClick={startTraining}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: 14,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none',
              }}
            >
              ▶️ INICIAR TREINO
            </button>
          ) : (
            <button
              onClick={() => setIsTraining(false)}
              className="btn btn-ghost"
              style={{ width: '100%', padding: '12px' }}
            >
              ⏹️ Parar Treino
            </button>
          )}
        </div>
        
        {/* Área Principal */}
        <div className="card" style={{ padding: 24 }}>
          {!isTraining ? (
            // Tela inicial
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <PokerTableVisual
                positions={POSITIONS_6MAX}
                heroPosition={config.heroPosition}
                onSelectPosition={(pos) => setConfig(c => ({ ...c, heroPosition: pos }))}
                activePositions={[config.heroPosition]}
              />
              
              <div style={{ marginTop: 30 }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>
                  Clique em uma posição para selecionar como HERO
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  Configure as opções e clique em "Iniciar Treino"
                </p>
              </div>
            </div>
          ) : (
            // Tela de treino
            <div>
              {/* Stats */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: 20,
                padding: '12px 16px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 8,
              }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Acertos</span>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#10b981' }}>
                    {stats.correct}/{stats.total}
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Precisão</span>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>
                    {stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0}%
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Sequência</span>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#f59e0b' }}>
                    🔥 {stats.streak}
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Recorde</span>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#a78bfa' }}>
                    ⭐ {stats.bestStreak}
                  </div>
                </div>
              </div>
              
              {/* Mesa */}
              <PokerTableVisual
                positions={POSITIONS_6MAX}
                heroPosition={config.heroPosition}
                onSelectPosition={() => {}}
                activePositions={[config.heroPosition]}
              />
              
              {/* Cartas */}
              {currentHand && (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  gap: 12, 
                  marginTop: 24,
                  marginBottom: 24,
                }}>
                  <CardDisplay card={currentHand.card1} />
                  <CardDisplay card={currentHand.card2} />
                </div>
              )}
              
              {/* Info da situação */}
              <div style={{ 
                textAlign: 'center', 
                marginBottom: 20,
                padding: '12px',
                background: 'rgba(139, 92, 246, 0.1)',
                borderRadius: 8,
              }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                  Você está em <strong style={{ color: '#a78bfa' }}>{config.heroPosition}</strong>
                  {config.preflopAction !== 'any' && (
                    <> • Situação: <strong style={{ color: '#22d3ee' }}>{config.preflopAction.toUpperCase()}</strong></>
                  )}
                </span>
              </div>
              
              {/* Resultado */}
              {showResult && lastResult && (
                <div style={{
                  padding: 16,
                  marginBottom: 20,
                  borderRadius: 10,
                  background: lastResult.correct 
                    ? 'rgba(16, 185, 129, 0.15)'
                    : 'rgba(239, 68, 68, 0.15)',
                  border: `2px solid ${lastResult.correct ? '#10b981' : '#ef4444'}`,
                }}>
                  <div style={{ 
                    fontSize: 18, 
                    fontWeight: 700, 
                    marginBottom: 8,
                    color: lastResult.correct ? '#34d399' : '#f87171',
                  }}>
                    {lastResult.correct ? '✅ Correto!' : '❌ Incorreto'}
                  </div>
                  <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: 13, lineHeight: 1.6 }}>
                    {lastResult.explanation}
                  </p>
                </div>
              )}
              
              {/* Botões de ação */}
              {!showResult ? (
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleAction('fold')}
                    style={{
                      padding: '14px 28px',
                      borderRadius: 8,
                      border: '2px solid #ef4444',
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#f87171',
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    FOLD
                  </button>
                  <button
                    onClick={() => handleAction('call')}
                    style={{
                      padding: '14px 28px',
                      borderRadius: 8,
                      border: '2px solid #06b6d4',
                      background: 'rgba(6, 182, 212, 0.1)',
                      color: '#22d3ee',
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    CALL
                  </button>
                  <button
                    onClick={() => handleAction('raise')}
                    style={{
                      padding: '14px 28px',
                      borderRadius: 8,
                      border: '2px solid #10b981',
                      background: 'rgba(16, 185, 129, 0.1)',
                      color: '#34d399',
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    RAISE
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <button
                    onClick={nextHand}
                    className="btn btn-primary"
                    style={{
                      padding: '14px 40px',
                      fontSize: 14,
                      fontWeight: 700,
                      background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                    }}
                  >
                    Próxima Mão →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Gráfico de Evolução */}
      {evolutionHistory.length >= 2 && (
        <EvolutionChart data={evolutionHistory} />
      )}
      
      {/* Info Premium */}
      <div className="card" style={{ marginTop: 20, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: 16 }}>🎓 Treine como os Profissionais</h3>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: 13 }}>
              Ranges baseados em GTO solver. Pratique situações específicas e melhore sua tomada de decisão pré-flop.
            </p>
          </div>
          {!isPremium && (
            <button
              onClick={() => navigate('/premium')}
              className="btn btn-primary"
              style={{
                padding: '10px 24px',
                background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                border: 'none',
                fontSize: 13,
              }}
            >
              💎 Upgrade Premium
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
