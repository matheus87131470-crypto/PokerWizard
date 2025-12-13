import React from 'react';

interface TrainingConfigProps {
  selectedSolution: string;
  setSelectedSolution: (solution: string) => void;
  startingSpot: string;
  setStartingSpot: (spot: string) => void;
  preflopAction: string;
  setPreflopAction: (action: string) => void;
  onStartTraining: () => void;
  useAI?: boolean;
  setUseAI?: (use: boolean) => void;
}

export default function TrainingConfig({
  selectedSolution,
  setSelectedSolution,
  startingSpot,
  setStartingSpot,
  preflopAction,
  setPreflopAction,
  onStartTraining,
  useAI = false,
  setUseAI
}: TrainingConfigProps) {
  const solutions = [
    'Cash / 6max / NL500',
    'Cash / 6max / NL200',
    'Cash / 6max / NL100',
    'Cash / 9max / NL500',
    'Tournament / Early',
    'Tournament / Middle',
    'Tournament / Bubble'
  ];

  const startingSpots = ['Preflop', 'Flop', 'Turn', 'River', 'Custom'];
  
  const preflopActions = [
    'Any',
    'SRP (Single Raised Pot)',
    '3-bet',
    '4-bet',
    '5-bet+',
    'Limp',
    'vs Limp'
  ];

  const renderSection = (title: string, children: React.ReactNode) => (
    <div style={{
      marginBottom: '24px'
    }}>
      <h3 style={{
        fontSize: '14px',
        fontWeight: 600,
        marginBottom: '12px',
        color: '#00d4ff',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        {title}
      </h3>
      {children}
    </div>
  );

  const renderButton = (
    label: string,
    isSelected: boolean,
    onClick: () => void,
    fullWidth = false
  ) => (
    <button
      onClick={onClick}
      style={{
        width: fullWidth ? '100%' : 'auto',
        padding: '10px 16px',
        fontSize: '13px',
        fontWeight: 500,
        borderRadius: '8px',
        border: isSelected 
          ? '2px solid #00d4ff'
          : '2px solid rgba(255, 255, 255, 0.2)',
        background: isSelected
          ? 'linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(123, 44, 191, 0.2))'
          : 'rgba(255, 255, 255, 0.05)',
        color: isSelected ? '#00d4ff' : '#e0e0e0',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        backdropFilter: 'blur(10px)',
        boxShadow: isSelected 
          ? '0 0 20px rgba(0, 212, 255, 0.3)'
          : 'none'
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        }
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{
      background: 'rgba(26, 26, 46, 0.8)',
      backdropFilter: 'blur(10px)',
      borderRadius: '20px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      padding: '30px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      position: 'sticky',
      top: '20px'
    }}>
      <h2 style={{
        fontSize: '20px',
        fontWeight: 700,
        marginBottom: '24px',
        color: '#fff',
        borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
        paddingBottom: '12px'
      }}>
        Training Configuration
      </h2>

      {/* AI Toggle */}
      {setUseAI && (
        <div style={{
          marginBottom: '24px',
          padding: '16px',
          background: 'rgba(0, 212, 255, 0.1)',
          border: '1px solid rgba(0, 212, 255, 0.3)',
          borderRadius: '12px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#00d4ff', marginBottom: '4px' }}>
                🤖 Modo IA Avançada
              </div>
              <div style={{ fontSize: '11px', color: '#888' }}>
                {useAI ? 'IA com ranges reais e EV calculado' : 'Ranges GTO simplificados'}
              </div>
            </div>
            <label style={{
              position: 'relative',
              display: 'inline-block',
              width: '50px',
              height: '24px',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={useAI}
                onChange={(e) => setUseAI(e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: useAI ? '#00d4ff' : 'rgba(255, 255, 255, 0.2)',
                borderRadius: '24px',
                transition: '0.3s'
              }}>
                <span style={{
                  position: 'absolute',
                  height: '18px',
                  width: '18px',
                  left: useAI ? '28px' : '3px',
                  bottom: '3px',
                  backgroundColor: '#fff',
                  borderRadius: '50%',
                  transition: '0.3s'
                }} />
              </span>
            </label>
          </div>
          {useAI && (
            <div style={{
              marginTop: '12px',
              padding: '10px',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '8px',
              fontSize: '11px',
              color: '#ffd700'
            }}>
              ⚠️ Consome 1 uso por mão gerada. Premium = ilimitado
            </div>
          )}
        </div>
      )}

      {/* Solution Selection */}
      {renderSection('Solution', (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {solutions.map(solution => (
            <div key={solution}>
              {renderButton(
                solution,
                selectedSolution === solution,
                () => setSelectedSolution(solution),
                true
              )}
            </div>
          ))}
        </div>
      ))}

      {/* Starting Spot */}
      {renderSection('Starting Spot', (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '8px'
        }}>
          {startingSpots.map(spot => (
            <div key={spot}>
              {renderButton(
                spot,
                startingSpot === spot,
                () => setStartingSpot(spot)
              )}
            </div>
          ))}
        </div>
      ))}

      {/* Preflop Actions (só aparece se Starting Spot = Preflop) */}
      {startingSpot === 'Preflop' && renderSection('Preflop Action', (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {preflopActions.map(action => (
            <div key={action}>
              {renderButton(
                action,
                preflopAction === action,
                () => setPreflopAction(action),
                true
              )}
            </div>
          ))}
        </div>
      ))}

      {/* Summary Box */}
      <div style={{
        marginTop: '24px',
        padding: '16px',
        background: 'rgba(0, 212, 255, 0.1)',
        border: '1px solid rgba(0, 212, 255, 0.3)',
        borderRadius: '12px',
        fontSize: '12px',
        lineHeight: '1.6'
      }}>
        <div style={{ color: '#888', marginBottom: '8px' }}>Selected Configuration:</div>
        <div style={{ color: '#00d4ff' }}>
          <strong>Solution:</strong> {selectedSolution}
        </div>
        <div style={{ color: '#00d4ff' }}>
          <strong>Spot:</strong> {startingSpot}
        </div>
        {startingSpot === 'Preflop' && (
          <div style={{ color: '#00d4ff' }}>
            <strong>Action:</strong> {preflopAction}
          </div>
        )}
      </div>

      {/* Start Training Button */}
      <button
        onClick={onStartTraining}
        style={{
          width: '100%',
          marginTop: '24px',
          padding: '16px',
          fontSize: '16px',
          fontWeight: 700,
          borderRadius: '12px',
          border: 'none',
          background: 'linear-gradient(135deg, #00d4ff, #7b2cbf)',
          color: '#fff',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 20px rgba(0, 212, 255, 0.4)',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 30px rgba(0, 212, 255, 0.6)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 212, 255, 0.4)';
        }}
      >
        🎯 Start Training
      </button>

      {/* Quick Tips */}
      <div style={{
        marginTop: '20px',
        padding: '12px',
        background: 'rgba(123, 44, 191, 0.1)',
        border: '1px solid rgba(123, 44, 191, 0.3)',
        borderRadius: '8px',
        fontSize: '11px',
        color: '#b19cd9'
      }}>
        <strong>💡 Quick Tips:</strong>
        <ul style={{ marginTop: '8px', paddingLeft: '20px', lineHeight: '1.6' }}>
          <li>Select a position on the table first</li>
          <li>Choose your preferred game format</li>
          <li>Pick a starting spot to begin training</li>
          <li>Click "Start Training" when ready</li>
        </ul>
      </div>
    </div>
  );
}
