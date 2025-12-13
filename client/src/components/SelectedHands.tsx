import React from 'react';

export interface SelectedHandData {
  hand: string;
  actions: {
    action: string;
    percentage: number;
    color: string;
  }[];
}

interface SelectedHandsProps {
  selectedHands: SelectedHandData[];
  onRemoveHand?: (hand: string) => void;
}

const CARD_SUITS = ['♠', '♥', '♦', '♣'];
const SUIT_COLORS: Record<string, string> = {
  '♠': 'text-white',
  '♥': 'text-red-500',
  '♦': 'text-blue-400',
  '♣': 'text-green-400',
};

// Convert hand notation to display cards (ex: AKs -> A♠ K♠)
function handToCards(hand: string): { rank1: string; rank2: string; suited: boolean } {
  const suited = hand.includes('s');
  const ranks = hand.replace(/[so]/g, '');
  
  return {
    rank1: ranks[0] === 'T' ? '10' : ranks[0],
    rank2: ranks[1] === 'T' ? '10' : ranks[1],
    suited,
  };
}

function MiniCard({ rank, suit }: { rank: string; suit: string }) {
  return (
    <div className="bg-white rounded border border-gray-300 px-1.5 py-1 min-w-[28px] text-center shadow-sm">
      <div className="flex flex-col items-center leading-none">
        <span className="text-black font-bold text-xs">{rank}</span>
        <span className={`${SUIT_COLORS[suit]} text-sm -mt-0.5`}>{suit}</span>
      </div>
    </div>
  );
}

export default function SelectedHands({ selectedHands, onRemoveHand }: SelectedHandsProps) {
  if (selectedHands.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-sm">Nenhuma mão selecionada</p>
        <p className="text-xs mt-1">Clique em uma mão na matriz para selecionar</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-gray-300 mb-3">
        Mãos Selecionadas ({selectedHands.length})
      </h3>
      
      <div className="grid grid-cols-1 gap-3">
        {selectedHands.map((selectedHand, index) => {
          const { rank1, rank2, suited } = handToCards(selectedHand.hand);
          const suit1 = suited ? CARD_SUITS[0] : CARD_SUITS[0];
          const suit2 = suited ? CARD_SUITS[0] : CARD_SUITS[1];

          return (
            <div
              key={index}
              className="bg-gray-800 border border-gray-700 rounded-lg p-3 hover:bg-gray-750 transition-colors"
            >
              {/* Header with cards and remove button */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <MiniCard rank={rank1} suit={suit1} />
                    <MiniCard rank={rank2} suit={suit2} />
                  </div>
                  <span className="text-white font-bold text-sm">{selectedHand.hand}</span>
                </div>
                
                {onRemoveHand && (
                  <button
                    onClick={() => onRemoveHand(selectedHand.hand)}
                    className="text-gray-400 hover:text-red-400 transition-colors text-xl leading-none"
                    title="Remover"
                  >
                    ×
                  </button>
                )}
              </div>
              
              {/* Action percentages */}
              <div className="space-y-1.5">
                {selectedHand.actions.map((action, actionIndex) => (
                  <div key={actionIndex} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 ${action.color} rounded-full`}></div>
                      <span className="text-gray-300">{action.action}</span>
                    </div>
                    <span className="text-white font-semibold">{action.percentage}%</span>
                  </div>
                ))}
              </div>
              
              {/* Mini range bar */}
              <div className="mt-2 h-1.5 bg-gray-900 rounded-full overflow-hidden flex">
                {selectedHand.actions.map((action, actionIndex) => (
                  <div
                    key={actionIndex}
                    className={action.color}
                    style={{ width: `${action.percentage}%` }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
