import React from 'react';

export type Position = 'UTG' | 'HJ' | 'CO' | 'BTN' | 'SB' | 'BB';

interface PositionTabsProps {
  positions: Position[];
  activePosition: Position;
  onPositionChange: (position: Position) => void;
  aiMode?: boolean;
}

const POSITION_COLORS: Record<Position, string> = {
  UTG: 'from-red-600 to-red-700',
  HJ: 'from-orange-600 to-orange-700',
  CO: 'from-yellow-600 to-yellow-700',
  BTN: 'from-green-600 to-green-700',
  SB: 'from-blue-600 to-blue-700',
  BB: 'from-purple-600 to-purple-700',
};

const POSITION_DESCRIPTIONS: Record<Position, string> = {
  UTG: 'Under The Gun',
  HJ: 'Hijack',
  CO: 'Cutoff',
  BTN: 'Button',
  SB: 'Small Blind',
  BB: 'Big Blind',
};

// Gradientes premium para cada posição
function getPositionGradient(position: Position): string {
  const gradients: Record<Position, string> = {
    UTG: '#dc2626, #991b1b',
    HJ: '#ea580c, #c2410c',
    CO: '#ca8a04, #a16207',
    BTN: '#16a34a, #15803d',
    SB: '#2563eb, #1d4ed8',
    BB: '#9333ea, #7e22ce',
  };
  return gradients[position];
}

export default function PositionTabs({ 
  positions, 
  activePosition, 
  onPositionChange,
  aiMode = false 
}: PositionTabsProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">
          Position Ranges
        </h2>
        {aiMode && (
          <div className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 px-3 py-1 rounded-full">
            <span className="text-white text-sm font-semibold">🤖 AI Mode</span>
          </div>
        )}
      </div>
      
      <div className="flex gap-2 flex-wrap">
        {positions.map((position) => {
          const isActive = position === activePosition;
          
          return (
            <button
              key={position}
              onClick={() => onPositionChange(position)}
              style={{
                position: 'relative',
                padding: '14px 24px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '14px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
                border: isActive ? '2px solid rgba(255, 255, 255, 0.3)' : '2px solid rgba(75, 85, 99, 0.5)',
                background: isActive 
                  ? `linear-gradient(135deg, ${getPositionGradient(position)})`
                  : 'rgba(31, 41, 55, 0.8)',
                color: isActive ? 'white' : '#9ca3af',
                backdropFilter: 'blur(10px)',
                boxShadow: isActive 
                  ? '0 6px 20px rgba(0, 0, 0, 0.3), 0 0 30px rgba(168, 85, 247, 0.2)'
                  : '0 2px 8px rgba(0, 0, 0, 0.2)',
                transform: isActive ? 'scale(1.05) translateY(-2px)' : 'scale(1)',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(55, 65, 81, 0.9)';
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.borderColor = 'rgba(107, 114, 128, 0.7)';
                  e.currentTarget.style.transform = 'scale(1.02) translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(31, 41, 55, 0.8)';
                  e.currentTarget.style.color = '#9ca3af';
                  e.currentTarget.style.borderColor = 'rgba(75, 85, 99, 0.5)';
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                <span style={{ fontSize: '16px', fontWeight: 700 }}>{position}</span>
                <span style={{ fontSize: '10px', opacity: 0.8, fontWeight: 400 }}>
                  {POSITION_DESCRIPTIONS[position]}
                </span>
              </div>
              
              {isActive && (
                <div style={{
                  position: 'absolute',
                  bottom: '-8px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 0,
                  height: 0,
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderTop: '6px solid white',
                }}></div>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Current position info */}
      <div className="mt-4 p-3 bg-gray-800 border border-gray-700 rounded-lg">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${POSITION_COLORS[activePosition]}`}></div>
          <span className="text-gray-300 text-sm">
            Visualizando ranges para <strong className="text-white">{activePosition}</strong> 
            {' - '}
            <span className="text-gray-400">{POSITION_DESCRIPTIONS[activePosition]}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
