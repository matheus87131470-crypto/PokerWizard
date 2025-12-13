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
              className={`
                relative px-6 py-3 rounded-lg font-bold text-sm
                transition-all duration-200
                ${isActive 
                  ? `bg-gradient-to-br ${POSITION_COLORS[position]} text-white scale-105 shadow-lg` 
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                }
                border-2 ${isActive ? 'border-white border-opacity-30' : 'border-gray-700'}
              `}
            >
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-lg">{position}</span>
                <span className="text-[10px] opacity-75 font-normal">
                  {POSITION_DESCRIPTIONS[position]}
                </span>
              </div>
              
              {isActive && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                  <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
                </div>
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
