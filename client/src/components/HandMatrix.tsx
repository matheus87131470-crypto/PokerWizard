import React, { useState } from 'react';

export type HandAction = 'allin' | 'raise' | 'call' | 'fold' | 'none';

export interface HandData {
  hand: string;
  action: HandAction;
  // Frequência principal (0-100) usada para intensidade da cor
  percentage?: number;
  // Mix avançado por ação (0-100 cada, somando <= 100)
  mix?: {
    allin?: number;
    raise?: number;
    call?: number;
    fold?: number;
  };
}

interface HandMatrixProps {
  hands: HandData[];
  onHandClick?: (hand: string) => void;
  selectedHands?: string[];
  // 'simple' mostra apenas cores, 'advanced' mostra % sobre as mãos
  mode?: 'simple' | 'advanced';
}

const HAND_MATRIX_LAYOUT = [
  ['AA', 'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s'],
  ['AKo', 'KK', 'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'K6s', 'K5s', 'K4s', 'K3s', 'K2s'],
  ['AQo', 'KQo', 'QQ', 'QJs', 'QTs', 'Q9s', 'Q8s', 'Q7s', 'Q6s', 'Q5s', 'Q4s', 'Q3s', 'Q2s'],
  ['AJo', 'KJo', 'QJo', 'JJ', 'JTs', 'J9s', 'J8s', 'J7s', 'J6s', 'J5s', 'J4s', 'J3s', 'J2s'],
  ['ATo', 'KTo', 'QTo', 'JTo', 'TT', 'T9s', 'T8s', 'T7s', 'T6s', 'T5s', 'T4s', 'T3s', 'T2s'],
  ['A9o', 'K9o', 'Q9o', 'J9o', 'T9o', '99', '98s', '97s', '96s', '95s', '94s', '93s', '92s'],
  ['A8o', 'K8o', 'Q8o', 'J8o', 'T8o', '98o', '88', '87s', '86s', '85s', '84s', '83s', '82s'],
  ['A7o', 'K7o', 'Q7o', 'J7o', 'T7o', '97o', '87o', '77', '76s', '75s', '74s', '73s', '72s'],
  ['A6o', 'K6o', 'Q6o', 'J6o', 'T6o', '96o', '86o', '76o', '66', '65s', '64s', '63s', '62s'],
  ['A5o', 'K5o', 'Q5o', 'J5o', 'T5o', '95o', '85o', '75o', '65o', '55', '54s', '53s', '52s'],
  ['A4o', 'K4o', 'Q4o', 'J4o', 'T4o', '94o', '84o', '74o', '64o', '54o', '44', '43s', '42s'],
  ['A3o', 'K3o', 'Q3o', 'J3o', 'T3o', '93o', '83o', '73o', '63o', '53o', '43o', '33', '32s'],
  ['A2o', 'K2o', 'Q2o', 'J2o', 'T2o', '92o', '82o', '72o', '62o', '52o', '42o', '32o', '22'],
];

const ACTION_STYLES: Record<HandAction, { background: string; border: string; boxShadow: string }> = {
  allin: {
    background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
    border: '2px solid #f87171',
    boxShadow: '0 4px 14px 0 rgba(239, 68, 68, 0.5)',
  },
  raise: {
    background: 'linear-gradient(135deg, #f97316 0%, #c2410c 100%)',
    border: '2px solid #fb923c',
    boxShadow: '0 4px 14px 0 rgba(249, 115, 22, 0.5)',
  },
  call: {
    background: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)',
    border: '2px solid #4ade80',
    boxShadow: '0 4px 14px 0 rgba(34, 197, 94, 0.5)',
  },
  fold: {
    background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
    border: '2px solid #60a5fa',
    boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.5)',
  },
  none: {
    background: '#1f2937',
    border: '2px solid #374151',
    boxShadow: 'none',
  },
};

// Gradiente de cor baseado na frequência (0-100)
function frequencyColor(freq: number): string {
  // Azul (baixa) → Verde → Amarelo → Vermelho (alta)
  const f = Math.max(0, Math.min(100, freq)) / 100;
  if (f < 0.25) return 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)';
  if (f < 0.5) return 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)';
  if (f < 0.75) return 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)';
  return 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)';
}

export default function HandMatrix({ hands, onHandClick, selectedHands = [], mode = 'simple' }: HandMatrixProps) {
  const [tooltip, setTooltip] = useState<{ hand: string; x: number; y: number; content: string } | null>(null);
  const getHandData = (hand: string): HandData => {
    const found = hands.find(h => h.hand === hand);
    return found || { hand, action: 'none' };
  };

  const getHandStyles = (hand: string) => {
    const handData = getHandData(hand);
    // Em modo avançado, usa intensidade baseada em percentage
    if (mode === 'advanced' && typeof handData.percentage === 'number') {
      const bg = frequencyColor(handData.percentage || 0);
      return {
        background: bg,
        border: isSelected(hand) ? '3px solid #facc15' : '2px solid rgba(255,255,255,0.15)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
      };
    }
    return ACTION_STYLES[handData.action] || ACTION_STYLES.none;
  };

  const isSelected = (hand: string): boolean => {
    return selectedHands.includes(hand);
  };

  return (
    <div style={{ width: '100%', padding: '16px' }}>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(13, 1fr)', 
        gap: '4px', 
        maxWidth: '896px', 
        margin: '0 auto' 
      }}>
        {HAND_MATRIX_LAYOUT.map((row, rowIndex) => (
          <React.Fragment key={rowIndex}>
            {row.map((hand, colIndex) => {
              const styles = getHandStyles(hand);
              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => onHandClick?.(hand)}
                  style={{
                    aspectRatio: '1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: styles.background,
                    border: isSelected(hand) ? '3px solid #facc15' : styles.border,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    fontWeight: '700',
                    transform: isSelected(hand) ? 'scale(1.08)' : 'scale(1)',
                    boxShadow: isSelected(hand) ? '0 0 0 4px rgba(250, 204, 21, 0.3), ' + styles.boxShadow : styles.boxShadow,
                  }}
                  title={hand}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = isSelected(hand) ? 'scale(1.12)' : 'scale(1.05)';
                    if (mode === 'advanced') {
                      const hd = getHandData(hand);
                      const mix = hd.mix || {};
                      const content = `${hand}\n` +
                        `All-in: ${mix.allin ?? 0}%\n` +
                        `Raise: ${mix.raise ?? 0}%\n` +
                        `Call: ${mix.call ?? 0}%\n` +
                        `Fold: ${mix.fold ?? 0}%`;
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTooltip({ hand, x: rect.left + rect.width / 2, y: rect.top, content });
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = isSelected(hand) ? 'scale(1.08)' : 'scale(1)';
                    setTooltip(null);
                  }}
                >
                  <span style={{ color: 'white', userSelect: 'none', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{hand}</span>
                  {mode === 'advanced' && (
                    <span style={{
                      position: 'absolute',
                      bottom: 6,
                      right: 8,
                      fontSize: 10,
                      color: 'rgba(255,255,255,0.9)',
                      textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                    }}>
                      {(getHandData(hand).percentage ?? 0).toFixed(0)}%
                    </span>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {/* Tooltip avançado */}
      {tooltip && (
        <div style={{
          position: 'fixed',
          left: tooltip.x,
          top: tooltip.y - 12,
          transform: 'translate(-50%, -100%)',
          background: 'rgba(2,6,23,0.9)',
          color: '#fff',
          padding: '10px 12px',
          border: '1px solid rgba(148,163,184,0.4)',
          borderRadius: 8,
          fontSize: 11,
          whiteSpace: 'pre-line',
          pointerEvents: 'none',
          boxShadow: '0 6px 16px rgba(0,0,0,0.5)'
        }}>
          {tooltip.content}
        </div>
      )}
      
      {/* Legend */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '20px', 
        marginTop: '28px', 
        flexWrap: 'wrap' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ 
            width: '20px', 
            height: '20px', 
            background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
            borderRadius: '6px',
            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)'
          }}></div>
          <span style={{ fontSize: '13px', color: '#f3f4f6', fontWeight: '600' }}>All-in</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ 
            width: '20px', 
            height: '20px', 
            background: 'linear-gradient(135deg, #f97316 0%, #c2410c 100%)',
            borderRadius: '6px',
            boxShadow: '0 2px 8px rgba(249, 115, 22, 0.4)'
          }}></div>
          <span style={{ fontSize: '13px', color: '#f3f4f6', fontWeight: '600' }}>Raise</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ 
            width: '20px', 
            height: '20px', 
            background: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)',
            borderRadius: '6px',
            boxShadow: '0 2px 8px rgba(34, 197, 94, 0.4)'
          }}></div>
          <span style={{ fontSize: '13px', color: '#f3f4f6', fontWeight: '600' }}>Call</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ 
            width: '20px', 
            height: '20px', 
            background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
            borderRadius: '6px',
            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.4)'
          }}></div>
          <span style={{ fontSize: '13px', color: '#f3f4f6', fontWeight: '600' }}>Fold</span>
        </div>
      </div>
    </div>
  );
}
