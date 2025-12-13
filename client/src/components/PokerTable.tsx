import React, { useState } from 'react';

interface PokerTableProps {
  selectedPosition: string | null;
  onPositionSelect: (position: string) => void;
}

interface Position {
  id: string;
  label: string;
  x: number;
  y: number;
  angle: number;
}

export default function PokerTable({ selectedPosition, onPositionSelect }: PokerTableProps) {
  const [hoveredPosition, setHoveredPosition] = useState<string | null>(null);

  // Posições ao redor da mesa (círculo)
  const positions: Position[] = [
    { id: 'UTG', label: 'UTG', x: 50, y: 70, angle: 180 },
    { id: 'HJ', label: 'HJ', x: 20, y: 50, angle: 135 },
    { id: 'CO', label: 'CO', x: 20, y: 20, angle: 90 },
    { id: 'BTN', label: 'BTN', x: 50, y: 5, angle: 45 },
    { id: 'SB', label: 'SB', x: 80, y: 20, angle: 0 },
    { id: 'BB', label: 'BB', x: 80, y: 50, angle: -45 }
  ];

  const renderPosition = (pos: Position) => {
    const isSelected = selectedPosition === pos.id;
    const isHovered = hoveredPosition === pos.id;

    return (
      <div
        key={pos.id}
        onClick={() => onPositionSelect(pos.id)}
        onMouseEnter={() => setHoveredPosition(pos.id)}
        onMouseLeave={() => setHoveredPosition(null)}
        style={{
          position: 'absolute',
          left: `${pos.x}%`,
          top: `${pos.y}%`,
          transform: 'translate(-50%, -50%)',
          cursor: 'pointer',
          zIndex: 10
        }}
      >
        {/* Círculo da posição */}
        <div style={{
          width: isSelected || isHovered ? '80px' : '70px',
          height: isSelected || isHovered ? '80px' : '70px',
          borderRadius: '50%',
          background: isSelected 
            ? 'linear-gradient(135deg, #00d4ff, #7b2cbf)'
            : isHovered
            ? 'rgba(0, 212, 255, 0.3)'
            : 'rgba(255, 255, 255, 0.1)',
          border: isSelected 
            ? '3px solid #00d4ff'
            : '2px solid rgba(255, 255, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease',
          boxShadow: isSelected 
            ? '0 0 30px rgba(0, 212, 255, 0.6)'
            : isHovered
            ? '0 0 20px rgba(0, 212, 255, 0.3)'
            : 'none'
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: 700,
            color: isSelected ? '#fff' : '#e0e0e0',
            textShadow: isSelected ? '0 0 10px rgba(0, 212, 255, 0.8)' : 'none'
          }}>
            {pos.label}
          </div>
        </div>

        {/* Indicador de seleção */}
        {isSelected && (
          <div style={{
            position: 'absolute',
            top: '-10px',
            right: '-10px',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: '#00d4ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            boxShadow: '0 0 15px rgba(0, 212, 255, 0.8)',
            animation: 'pulse 2s infinite'
          }}>
            ✓
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Mesa de poker (elipse central) */}
      <div style={{
        position: 'relative',
        width: '100%',
        paddingBottom: '70%',
        margin: '0 auto'
      }}>
        {/* Feltro da mesa */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '70%',
          height: '85%',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #1a4d2e, #0f3d26)',
          border: '8px solid #8b6914',
          boxShadow: 'inset 0 0 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(0, 0, 0, 0.3)'
        }}>
          {/* Linha decorativa da mesa */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90%',
            height: '90%',
            borderRadius: '50%',
            border: '2px solid rgba(255, 215, 0, 0.2)'
          }} />
        </div>

        {/* Área central - Cartas/Ações */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '200px',
          height: '120px',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '12px',
          border: '2px solid rgba(255, 215, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '10px',
          zIndex: 5
        }}>
          {/* Cartas comunitárias placeholder */}
          <div style={{
            display: 'flex',
            gap: '6px'
          }}>
            {[1, 2, 3, 4, 5].map(i => (
              <div
                key={i}
                style={{
                  width: '32px',
                  height: '44px',
                  background: 'linear-gradient(135deg, #fff, #f0f0f0)',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  opacity: i <= 3 ? 1 : 0.3
                }}
              >
                {i <= 3 ? '🂠' : ''}
              </div>
            ))}
          </div>

          {/* Pot */}
          <div style={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#ffd700',
            textShadow: '0 0 10px rgba(255, 215, 0, 0.5)'
          }}>
            Pot: $0
          </div>
        </div>

        {/* Linhas conectando posições */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 1
          }}
        >
          {positions.map((pos, i) => {
            const nextPos = positions[(i + 1) % positions.length];
            return (
              <line
                key={`line-${i}`}
                x1={`${pos.x}%`}
                y1={`${pos.y}%`}
                x2={`${nextPos.x}%`}
                y2={`${nextPos.y}%`}
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="1"
                strokeDasharray="5,5"
              />
            );
          })}
        </svg>

        {/* Renderizar posições */}
        {positions.map(renderPosition)}
      </div>

      {/* Legenda */}
      <div style={{
        marginTop: '30px',
        textAlign: 'center',
        fontSize: '13px',
        color: '#888'
      }}>
        <p>Clique em uma posição para selecioná-la</p>
        {selectedPosition && (
          <p style={{ color: '#00d4ff', fontWeight: 600, marginTop: '8px' }}>
            Posição selecionada: <strong>{selectedPosition}</strong>
          </p>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
