import React from 'react';

export type HandAction = 'allin' | 'raise' | 'call' | 'fold' | 'none';

export interface HandData {
  hand: string;
  action: HandAction;
  percentage?: number;
}

interface HandMatrixProps {
  hands: HandData[];
  onHandClick?: (hand: string) => void;
  selectedHands?: string[];
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

const ACTION_COLORS: Record<HandAction, string> = {
  allin: 'bg-red-600 border-red-500 hover:bg-red-500',
  raise: 'bg-orange-600 border-orange-500 hover:bg-orange-500',
  call: 'bg-green-600 border-green-500 hover:bg-green-500',
  fold: 'bg-blue-600 border-blue-500 hover:bg-blue-500',
  none: 'bg-gray-800 border-gray-700 hover:bg-gray-700',
};

export default function HandMatrix({ hands, onHandClick, selectedHands = [] }: HandMatrixProps) {
  const getHandData = (hand: string): HandData => {
    const found = hands.find(h => h.hand === hand);
    return found || { hand, action: 'none' };
  };

  const getHandColor = (hand: string): string => {
    const handData = getHandData(hand);
    return ACTION_COLORS[handData.action] || ACTION_COLORS.none;
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
            {row.map((hand, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                onClick={() => onHandClick?.(hand)}
                style={{
                  aspectRatio: '1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `2px solid ${isSelected(hand) ? '#facc15' : 'currentColor'}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  fontWeight: hand.includes('s') && !hand.includes('o') && hand.length > 2 ? '600' : '400',
                  transform: isSelected(hand) ? 'scale(1.05)' : 'scale(1)',
                  boxShadow: isSelected(hand) ? '0 0 0 4px rgba(250, 204, 21, 0.4)' : 'none',
                }}
                className={getHandColor(hand)}
                title={hand}
              >
                <span style={{ color: 'white', userSelect: 'none' }}>{hand}</span>
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
      
      {/* Legend */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '16px', 
        marginTop: '24px', 
        flexWrap: 'wrap' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '16px', backgroundColor: '#dc2626', borderRadius: '4px' }}></div>
          <span style={{ fontSize: '12px', color: '#d1d5db' }}>All-in</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '16px', backgroundColor: '#ea580c', borderRadius: '4px' }}></div>
          <span style={{ fontSize: '12px', color: '#d1d5db' }}>Raise</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '16px', backgroundColor: '#059669', borderRadius: '4px' }}></div>
          <span style={{ fontSize: '12px', color: '#d1d5db' }}>Call</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '16px', backgroundColor: '#2563eb', borderRadius: '4px' }}></div>
          <span style={{ fontSize: '12px', color: '#d1d5db' }}>Fold</span>
        </div>
      </div>
    </div>
  );
}
