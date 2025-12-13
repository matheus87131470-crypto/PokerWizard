import React from 'react';

export interface RangeSegment {
  action: string;
  percentage: number;
  color: string;
}

interface RangeBarProps {
  segments: RangeSegment[];
}

export default function RangeBar({ segments }: RangeBarProps) {
  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-sm text-gray-400 font-semibold">Range Distribution</span>
        <span className="text-xs text-gray-500">
          (Total: {segments.reduce((sum, s) => sum + s.percentage, 0).toFixed(1)}%)
        </span>
      </div>
      
      <div className="relative w-full h-8 bg-gray-900 rounded-lg overflow-hidden border border-gray-700 shadow-inner">
        <div className="flex h-full">
          {segments.map((segment, index) => (
            <div
              key={index}
              className={`${segment.color} relative group transition-all duration-300 hover:opacity-90`}
              style={{ width: `${segment.percentage}%` }}
            >
              {/* Tooltip on hover */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 
                            opacity-0 group-hover:opacity-100 transition-opacity duration-200
                            bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap
                            pointer-events-none z-10 border border-gray-700">
                {segment.action}: {segment.percentage.toFixed(1)}%
              </div>
              
              {/* Percentage text (only show if segment is wide enough) */}
              {segment.percentage > 10 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white text-xs font-bold drop-shadow-lg">
                    {segment.percentage.toFixed(0)}%
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Legend below bar */}
      <div className="flex gap-4 mt-3 flex-wrap">
        {segments.map((segment, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className={`w-3 h-3 ${segment.color} rounded`}></div>
            <span className="text-xs text-gray-300">
              {segment.action} ({segment.percentage.toFixed(1)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
