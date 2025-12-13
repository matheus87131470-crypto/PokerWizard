import React, { useState } from 'react';
import PokerTable from './PokerTable';
import TrainingConfig from './TrainingConfig';
import { generateTrainingSituation, handToNotation, Card } from '../services/pokerEngine';
import { evaluateUserAction } from '../services/gtoRanges';
import { useTrainingStats } from '../hooks/useTrainingStats';
import { generateAIScenario, evaluateAIAction, convertAICards, recordAIResult, AIScenario } from '../services/aiTrainer';

type GameState = 'config' | 'training' | 'feedback' | 'stats';
type UserAction = 'raise' | 'call' | 'fold' | null;

export default function TrainingInterface() {
  const [selectedSolution, setSelectedSolution] = useState('Cash / 6max / NL500');
  const [startingSpot, setStartingSpot] = useState('Preflop');
  const [preflopAction, setPreflopAction] = useState('Any');
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState>('config');
  const [currentHand, setCurrentHand] = useState<Card[]>([]);
  const [communityCards, setCommunityCards] = useState<Card[]>([]);
  const [handNotation, setHandNotation] = useState('');
  const [userAction, setUserAction] = useState<UserAction>(null);
  const [feedback, setFeedback] = useState<any>(null);
  const [useAI, setUseAI] = useState(false);
  const [currentAIScenario, setCurrentAIScenario] = useState<AIScenario | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  
  const { stats, recordDecision, resetStats, getSessionDuration } = useTrainingStats();

  const handleStartTraining = () => {
    if (!selectedPosition) {
      alert('Por favor, selecione uma posição na mesa primeiro!');
      return;
    }
    
    setGameState('training');
    generateNewHand();
  };

  const generateNewHand = async () => {
    if (!selectedPosition) return;
    
    setIsLoading(true);
    setAiError('');
    
    try {
      if (useAI) {
        // Usar IA do backend
        const gameType = selectedSolution.includes('Cash') ? 'Cash' : 'MTT';
        const street = startingSpot === 'Preflop' ? 'Pré-flop' : startingSpot;
        
        const scenario = await generateAIScenario(
          selectedPosition,
          gameType,
          street,
          preflopAction,
          'PokerStars'
        );
        
        if (!scenario) {
          throw new Error('Erro ao gerar cenário com IA');
        }
        
        setCurrentAIScenario(scenario);
        const aiCards = convertAICards(scenario.heroCards);
        setCurrentHand(aiCards as Card[]);
        
        if (scenario.board && scenario.board.length > 0) {
          const boardCards = convertAICards(scenario.board);
          setCommunityCards(boardCards as Card[]);
        } else {
          setCommunityCards([]);
        }
        
        setHandNotation(scenario.heroCards.join(''));
      } else {
        // Usar GTO local
        const street = startingSpot.toLowerCase() as any;
        const situation = generateTrainingSituation(selectedPosition, street === 'custom' ? 'preflop' : street);
        
        setCurrentHand(situation.hand);
        setCommunityCards(situation.communityCards);
        setHandNotation(handToNotation(situation.hand));
        setCurrentAIScenario(null);
      }
      
      setUserAction(null);
      setFeedback(null);
      setGameState('training');
    } catch (error: any) {
      setAiError(error.message || 'Erro ao gerar mão');
      console.error('Erro ao gerar mão:', error);
      
      // Fallback para GTO local em caso de erro
      if (useAI) {
        setUseAI(false);
        alert('Erro ao usar IA. Voltando para modo GTO local.\n\n' + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserAction = async (action: 'raise' | 'call' | 'fold') => {
    if (!selectedPosition) return;
    
    setUserAction(action);
    
    let result;
    
    if (useAI && currentAIScenario) {
      // Avaliar com IA
      result = evaluateAIAction(currentAIScenario, action);
      
      // Registrar resultado no backend
      await recordAIResult(currentAIScenario.id, action, 0);
    } else {
      // Avaliar com GTO local
      const scenario = preflopAction === 'Any' ? 'open' : 
                      preflopAction.includes('3-bet') ? '3bet' : 
                      preflopAction.includes('4-bet') ? '4bet' : 'open';
      
      result = evaluateUserAction(action, handNotation, selectedPosition, scenario);
    }
    
    setFeedback(result);
    const score = 'score' in result ? result.score : (result.correct ? 100 : 0);
    recordDecision(result.correct, selectedPosition, score);
    setGameState('feedback');
  };

  const handleNextHand = () => {
    generateNewHand();
  };

  const handleBackToConfig = () => {
    setGameState('config');
    setCurrentHand([]);
    setCommunityCards([]);
  };

  const handleShowStats = () => {
    setGameState('stats');
  };

  if (gameState === 'config') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)',
        padding: '20px',
        color: '#e0e0e0'
      }}>
        <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
          <div style={{ marginBottom: '30px', textAlign: 'center' }}>
            <h1 style={{
              fontSize: '32px',
              fontWeight: 700,
              marginBottom: '8px',
              background: 'linear-gradient(90deg, #00d4ff, #7b2cbf)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Poker Training Lab
            </h1>
            <p style={{ fontSize: '14px', color: '#888', fontWeight: 500 }}>
              Master GTO Strategy with Interactive Training
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 400px',
            gap: '30px',
            alignItems: 'start'
          }}>
            <div style={{
              background: 'rgba(26, 26, 46, 0.6)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '40px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}>
              <PokerTable
                selectedPosition={selectedPosition}
                onPositionSelect={setSelectedPosition}
              />
            </div>

            <TrainingConfig
              selectedSolution={selectedSolution}
              setSelectedSolution={setSelectedSolution}
              startingSpot={startingSpot}
              setStartingSpot={setStartingSpot}
              preflopAction={preflopAction}
              setPreflopAction={setPreflopAction}
              onStartTraining={handleStartTraining}
              useAI={useAI}
              setUseAI={setUseAI}
            />
          </div>

          <div style={{
            marginTop: '30px',
            padding: '20px',
            background: 'rgba(0, 212, 255, 0.1)',
            border: '1px solid rgba(0, 212, 255, 0.3)',
            borderRadius: '12px',
            textAlign: 'center',
            fontSize: '13px',
            color: '#00d4ff'
          }}>
            <strong>💡 Dica:</strong> Selecione uma posição na mesa e configure as opções de treino para começar
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'stats') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)',
        padding: '20px',
        color: '#e0e0e0'
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{
            background: 'rgba(26, 26, 46, 0.8)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '40px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#fff' }}>
                📊 Estatísticas de Treino
              </h2>
              <button
                onClick={() => setGameState('training')}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#e0e0e0',
                  cursor: 'pointer'
                }}
              >
                ← Voltar ao Treino
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '20px',
              marginBottom: '30px'
            }}>
              <div style={{
                background: 'rgba(0, 212, 255, 0.1)',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '14px', color: '#888', marginBottom: '8px' }}>Total de Mãos</div>
                <div style={{ fontSize: '32px', fontWeight: 700, color: '#00d4ff' }}>{stats.totalHands}</div>
              </div>

              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '14px', color: '#888', marginBottom: '8px' }}>Precisão</div>
                <div style={{ fontSize: '32px', fontWeight: 700, color: '#10b981' }}>
                  {stats.accuracy.toFixed(1)}%
                </div>
              </div>

              <div style={{
                background: 'rgba(255, 215, 0, 0.1)',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '14px', color: '#888', marginBottom: '8px' }}>Sequência Atual</div>
                <div style={{ fontSize: '32px', fontWeight: 700, color: '#ffd700' }}>{stats.currentStreak}</div>
              </div>

              <div style={{
                background: 'rgba(123, 44, 191, 0.1)',
                border: '1px solid rgba(123, 44, 191, 0.3)',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '14px', color: '#888', marginBottom: '8px' }}>Melhor Sequência</div>
                <div style={{ fontSize: '32px', fontWeight: 700, color: '#7b2cbf' }}>{stats.bestStreak}</div>
              </div>
            </div>

            {Object.keys(stats.handsPerPosition).length > 0 && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '15px', color: '#fff' }}>
                  Estatísticas por Posição
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                  {Object.entries(stats.handsPerPosition).map(([position, hands]) => (
                    <div
                      key={position}
                      style={{
                        background: 'rgba(0, 0, 0, 0.2)',
                        borderRadius: '8px',
                        padding: '15px',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#00d4ff', marginBottom: '5px' }}>
                        {position}
                      </div>
                      <div style={{ fontSize: '13px', color: '#888' }}>
                        Mãos: {hands}
                      </div>
                      <div style={{ fontSize: '13px', color: '#888' }}>
                        Precisão: {(stats.accuracyPerPosition[position] || 0).toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              padding: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '14px', color: '#888' }}>Duração da Sessão</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#00d4ff' }}>{getSessionDuration()}</div>
              </div>
              <button
                onClick={resetStats}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  borderRadius: '8px',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  cursor: 'pointer'
                }}
              >
                🔄 Resetar Estatísticas
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Training/Feedback mode
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)',
      padding: '20px',
      color: '#e0e0e0'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        padding: '20px',
        background: 'rgba(26, 26, 46, 0.8)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#888' }}>Mãos</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#00d4ff' }}>{stats.totalHands}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#888' }}>Precisão</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: stats.accuracy >= 70 ? '#10b981' : '#ef4444' }}>
              {stats.accuracy.toFixed(1)}%
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#888' }}>Sequência</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#ffd700' }}>{stats.currentStreak}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#888' }}>Melhor</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#7b2cbf' }}>{stats.bestStreak}</div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleShowStats} style={{
            padding: '8px 16px',
            fontSize: '13px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            background: 'rgba(255, 255, 255, 0.05)',
            color: '#e0e0e0',
            cursor: 'pointer'
          }}>
            📊 Estatísticas
          </button>
          <button onClick={handleBackToConfig} style={{
            padding: '8px 16px',
            fontSize: '13px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            background: 'rgba(255, 255, 255, 0.05)',
            color: '#e0e0e0',
            cursor: 'pointer'
          }}>
            ⚙️ Configurações
          </button>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 400px',
        gap: '20px'
      }}>
        <div style={{
          background: 'rgba(26, 26, 46, 0.6)',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '30px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '14px', color: '#888', marginBottom: '10px' }}>
              Posição: <strong style={{ color: '#00d4ff' }}>{selectedPosition}</strong>
              {useAI && (
                <span style={{
                  marginLeft: '12px',
                  padding: '4px 8px',
                  background: 'linear-gradient(135deg, #00d4ff, #7b2cbf)',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#fff'
                }}>
                  🤖 IA
                </span>
              )}
            </div>
            <div style={{ fontSize: '14px', color: '#888', marginBottom: '20px' }}>
              {selectedSolution} | {startingSpot}
            </div>
            {isLoading && (
              <div style={{
                padding: '12px',
                background: 'rgba(0, 212, 255, 0.1)',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#00d4ff'
              }}>
                🎲 Gerando mão com IA...
              </div>
            )}
            {aiError && (
              <div style={{
                padding: '12px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#ef4444'
              }}>
                ⚠️ {aiError}
              </div>
            )}
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '15px', color: '#00d4ff' }}>
              Sua Mão
            </div>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              {currentHand.map((card, i) => (
                <div key={i} style={{
                  width: '100px',
                  height: '140px',
                  background: 'linear-gradient(135deg, #fff, #f5f5f5)',
                  borderRadius: '12px',
                  border: '2px solid #333',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '48px',
                  fontWeight: 700,
                  color: card.suit === '♥' || card.suit === '♦' ? '#ef4444' : '#000',
                  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.4)'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div>{card.rank}</div>
                    <div style={{ fontSize: '36px', marginTop: '-10px' }}>{card.suit}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '15px', color: '#ffd700' }}>
              {handNotation}
            </div>
          </div>

          {communityCards.length > 0 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '15px', color: '#888' }}>
                Board
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                {communityCards.map((card, i) => (
                  <div key={i} style={{
                    width: '70px',
                    height: '100px',
                    background: 'linear-gradient(135deg, #fff, #f5f5f5)',
                    borderRadius: '8px',
                    border: '2px solid #333',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '32px',
                    fontWeight: 700,
                    color: card.suit === '♥' || card.suit === '♦' ? '#ef4444' : '#000',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div>{card.rank}</div>
                      <div style={{ fontSize: '24px' }}>{card.suit}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{
          background: 'rgba(26, 26, 46, 0.8)',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '30px',
          display: 'flex',
          flexDirection: 'column',
          gap: '15px'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 700,
            marginBottom: '10px',
            color: '#fff',
            textAlign: 'center'
          }}>
            Qual sua ação?
          </h3>

          <button
            onClick={() => handleUserAction('raise')}
            disabled={gameState === 'feedback'}
            style={{
              padding: '20px',
              fontSize: '18px',
              fontWeight: 700,
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#fff',
              cursor: gameState === 'feedback' ? 'not-allowed' : 'pointer',
              opacity: gameState === 'feedback' ? 0.5 : 1,
              transition: 'all 0.2s',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}
          >
            🚀 RAISE
          </button>

          <button
            onClick={() => handleUserAction('call')}
            disabled={gameState === 'feedback'}
            style={{
              padding: '20px',
              fontSize: '18px',
              fontWeight: 700,
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
              color: '#fff',
              cursor: gameState === 'feedback' ? 'not-allowed' : 'pointer',
              opacity: gameState === 'feedback' ? 0.5 : 1,
              transition: 'all 0.2s',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}
          >
            👍 CALL
          </button>

          <button
            onClick={() => handleUserAction('fold')}
            disabled={gameState === 'feedback'}
            style={{
              padding: '20px',
              fontSize: '18px',
              fontWeight: 700,
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: '#fff',
              cursor: gameState === 'feedback' ? 'not-allowed' : 'pointer',
              opacity: gameState === 'feedback' ? 0.5 : 1,
              transition: 'all 0.2s',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}
          >
            🚫 FOLD
          </button>

          {feedback && (
            <div style={{
              marginTop: '20px',
              padding: '20px',
              background: feedback.correct 
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.2))'
                : 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.2))',
              border: `2px solid ${feedback.correct ? '#10b981' : '#ef4444'}`,
              borderRadius: '12px',
              color: '#fff'
            }}>
              <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '10px' }}>
                {feedback.correct ? '✅ Correto!' : '❌ Incorreto'}
              </div>
              <div style={{ fontSize: '13px', lineHeight: '1.6', color: '#e0e0e0', whiteSpace: 'pre-line' }}>
                {feedback.feedback || feedback.explanation}
              </div>
              
              {/* Informações extras da IA */}
              {useAI && currentAIScenario && (
                <div style={{
                  marginTop: '12px',
                  padding: '12px',
                  background: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}>
                  <div style={{ color: '#ffd700', marginBottom: '6px' }}>
                    📊 Análise IA:
                  </div>
                  <div style={{ color: '#e0e0e0' }}>
                    <div>EV: <strong style={{ color: currentAIScenario.ev > 0 ? '#10b981' : '#ef4444' }}>
                      {currentAIScenario.ev > 0 ? '+' : ''}{currentAIScenario.ev}
                    </strong> chips</div>
                    <div>Range vilão: <strong>{currentAIScenario.villainRange}</strong></div>
                    {currentAIScenario.network && (
                      <div>Network: <strong>{currentAIScenario.network}</strong></div>
                    )}
                  </div>
                </div>
              )}
              
              <button
                onClick={handleNextHand}
                disabled={isLoading}
                style={{
                  width: '100%',
                  marginTop: '15px',
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: 700,
                  borderRadius: '8px',
                  border: 'none',
                  background: isLoading 
                    ? 'rgba(0, 212, 255, 0.3)'
                    : 'linear-gradient(135deg, #00d4ff, #7b2cbf)',
                  color: '#fff',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  textTransform: 'uppercase',
                  opacity: isLoading ? 0.5 : 1
                }}
              >
                {isLoading ? '⏳ Gerando...' : 'Próxima Mão →'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
