import React from 'react';

export interface ActionData {
  name: string;
  percentage: number;
  combos: number;
  color: string;
  bgColor: string;
}

interface ActionPanelProps {
  actions: ActionData[];
  onActionClick?: (actionName: string) => void;
}

export default function ActionPanel({ actions, onActionClick }: ActionPanelProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-white mb-4">Actions</h3>
      
      {actions.map((action, index) => (
        <div
          key={index}
          onClick={() => onActionClick?.(action.name)}
          className={`
            ${action.bgColor} 
            border-2 ${action.color}
            rounded-lg p-4 cursor-pointer
            transition-all duration-200
            hover:scale-105 hover:shadow-lg
          `}
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-white font-bold text-base">{action.name}</span>
            <span className="text-white text-2xl font-bold">{action.percentage}%</span>
          </div>
          
          <div className="text-gray-200 text-sm">
            {action.combos} combos
          </div>
          
          {/* Mini bar indicator */}
          <div className="mt-3 h-2 bg-black bg-opacity-30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white bg-opacity-50 rounded-full transition-all duration-500"
              style={{ width: `${action.percentage}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
