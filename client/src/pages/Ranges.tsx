/**
 * Ranges - Estudar Ranges GTO por posição
 * 
 * Intenção: Usuário estuda ranges de abertura/defesa por posição
 * Similar ao "Ranges" do GTO Wizard
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HandMatrix, { HandData, HandAction } from '../components/HandMatrix';
import PositionTabs, { Position } from '../components/PositionTabs';
import RangeBar, { RangeSegment } from '../components/RangeBar';
import PremiumPaywallModal from '../components/PremiumPaywallModal';
import { useAuth } from '../contexts/AuthContext';

// Gerar dados de range por posição
function generateRangeData(position: Position): HandData[] {
  const allHands: string[] = [];
  const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

  for (let i = 0; i < ranks.length; i++) {
    for (let j = i; j < ranks.length; j++) {
      if (i === j) {
        allHands.push(`${ranks[i]}${ranks[j]}`);
      } else {
        allHands.push(`${ranks[i]}${ranks[j]}s`);
        allHands.push(`${ranks[i]}${ranks[j]}o`);
      }
    }
  }

  // Ranges GTO simplificados por posição
  const ranges: Record<Position, { allin: string[], raise: string[], call: string[] }> = {
    UTG: {
      allin: ['AA', 'KK', 'QQ'],
      raise: ['JJ', 'TT', '99', 'AKs', 'AKo', 'AQs', 'AJs', 'KQs'],
      call: ['88', '77', 'AQo', 'AJo', 'ATs', 'KJs', 'KTs', 'QJs'],
    },
    HJ: {
      allin: ['AA', 'KK', 'QQ'],
      raise: ['JJ', 'TT', '99', '88', 'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'AJo', 'ATs', 'KQs', 'KJs'],
      call: ['77', '66', 'A9s', 'KQo', 'KTs', 'QJs', 'QTs', 'JTs'],
    },
    CO: {
      allin: ['AA', 'KK', 'QQ', 'JJ'],
      raise: ['TT', '99', '88', '77', 'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'AJo', 'ATs', 'A9s', 'KQs', 'KQo', 'KJs', 'KTs', 'QJs'],
      call: ['66', '55', 'A8s', 'A7s', 'KJo', 'K9s', 'QTs', 'QJo', 'JTs', 'J9s', 'T9s'],
    },
    BTN: {
      allin: ['AA', 'KK', 'QQ', 'JJ', 'TT'],
      raise: ['99', '88', '77', '66', '55', 'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'AJo', 'ATs', 'ATo', 'A9s', 'A8s', 'A7s', 'KQs', 'KQo', 'KJs', 'KJo', 'KTs', 'K9s', 'QJs', 'QJo', 'QTs', 'JTs', 'T9s'],
      call: ['44', '33', '22', 'A6s', 'A5s', 'A4s', 'K8s', 'K7s', 'Q9s', 'J9s', 'T8s', '98s'],
    },
    SB: {
      allin: ['AA', 'KK', 'QQ', 'JJ'],
      raise: ['TT', '99', '88', '77', 'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'AJo', 'ATs', 'A9s', 'KQs', 'KQo', 'KJs', 'KTs', 'QJs', 'QTs', 'JTs'],
      call: ['66', '55', '44', 'A8s', 'A7s', 'A6s', 'KJo', 'K9s', 'QJo', 'Q9s', 'J9s', 'T9s', '98s'],
    },
    BB: {
      allin: ['AA', 'KK'],
      raise: ['QQ', 'JJ', 'TT', 'AKs', 'AKo'],
      call: ['99', '88', '77', '66', '55', '44', '33', '22', 'AQs', 'AQo', 'AJs', 'AJo', 'ATs', 'ATo', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'KQs', 'KQo', 'KJs', 'KJo', 'KTs', 'K9s', 'QJs', 'QJo', 'QTs', 'JTs', 'T9s'],
    }
  };

  const positionRange = ranges[position];
  
  return allHands.map(hand => {
    let action: HandAction = 'fold';
    if (positionRange.allin.includes(hand)) action = 'allin';
    else if (positionRange.raise.includes(hand)) action = 'raise';
    else if (positionRange.call.includes(hand)) action = 'call';

    // Heurística de mix de ações (visual GTO-like)
    // Suited e pares têm mais frequência; offsuit marginais têm menos.
    const isSuited = hand.endsWith('s');
    const isOffsuit = hand.endsWith('o');
    const isPair = (hand.length === 2 && hand[0] === hand[1]);

    let mix: HandData['mix'] = { allin: 0, raise: 0, call: 0, fold: 0 };
    if (action === 'allin') {
      mix = { allin: 100, raise: 0, call: 0, fold: 0 };
    } else if (action === 'raise') {
      const base = isPair ? 85 : isSuited ? 75 : 65;
      mix = { raise: base, call: isSuited ? 15 : 10, fold: 100 - base - (isSuited ? 15 : 10), allin: 0 };
    } else if (action === 'call') {
      const base = isSuited ? 60 : 45;
      mix = { call: base, raise: isSuited ? 20 : 15, fold: 100 - base - (isSuited ? 20 : 15), allin: 0 };
    } else {
      mix = { fold: 100, call: 0, raise: 0, allin: 0 };
    }

    // Frequência principal para heatmap (usa a maior do mix)
    const percentage = Math.max(mix.allin || 0, mix.raise || 0, mix.call || 0, mix.fold || 0);

    return { hand, action, percentage, mix };
  });
}

// Calcular estatísticas do range
function calculateRangeStats(hands: HandData[]) {
  const total = hands.length;
  const stats = {
    allin: hands.filter(h => h.action === 'allin').length,
    raise: hands.filter(h => h.action === 'raise').length,
    call: hands.filter(h => h.action === 'call').length,
    fold: hands.filter(h => h.action === 'fold').length,
  };
  
  return {
    ...stats,
    openingRange: ((stats.allin + stats.raise + stats.call) / total * 100).toFixed(1),
  };
}

export default function Ranges() {
  const auth = useAuth();
  const navigate = useNavigate();
  const user = auth.user;

  const [activePosition, setActivePosition] = useState<Position>('BTN');
  const [hands, setHands] = useState<HandData[]>([]);
  const [scenario, setScenario] = useState<'RFI' | '3bet' | 'vs3bet'>('RFI');
  const [showPaywall, setShowPaywall] = useState(false);
  const [explanation, setExplanation] = useState<string>('');
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [selectedHand, setSelectedHand] = useState<string | null>(null);
  const [matrixMode, setMatrixMode] = useState<'simple' | 'advanced'>('simple');
  const [stackSize, setStackSize] = useState<10 | 20 | 40 | 100>(40);
  const [confidence, setConfidence] = useState<number>(82);
  const [format, setFormat] = useState<'CASH' | 'MTT'>('CASH');
  const [field, setField] = useState<'recreativo' | 'regulares'>('regulares');
  const IA_RANGES_COMING_SOON = true; // placeholder: desabilita IA de explicação por enquanto

  // Verificar status premium e créditos (igual ao Analyze)
  const isPremium = user?.premium || (user as any)?.statusPlano === 'premium';
  const usosRanges = (user as any)?.usosAnalise ?? 5; // Usa mesmo campo do Analyze
  const canExplain = isPremium || usosRanges > 0;

  const API_URL = (import.meta as any)?.env?.VITE_API_URL
    || (typeof window !== 'undefined' && window.location.hostname.includes('localhost')
      ? 'http://localhost:3000'
      : 'https://pokerwizard-api.onrender.com');

  // Carregar range quando posição mudar
  useEffect(() => {
    const rangeData = generateRangeData(activePosition);
    // Leve animação quando muda posição
    setHands(rangeData);
  }, [activePosition]);

  const stats = calculateRangeStats(hands);

  // Combos por tipo de mão (aproximação padrão):
  // Pares = 6, Suited = 4, Offsuit = 12
  function combosFor(hand: string): number {
    const isPair = hand.length === 2 && hand[0] === hand[1];
    const isSuited = hand.endsWith('s');
    const isOffsuit = hand.endsWith('o');
    if (isPair) return 6;
    if (isSuited) return 4;
    if (isOffsuit) return 12;
    // Sem sufixo: tratar como suited por simplicidade
    return 4;
  }

  const totalCombos = hands.reduce((acc, h) => acc + combosFor(h.hand), 0);
  const comboStats = {
    allin: hands.filter(h => h.action === 'allin').reduce((a, h) => a + combosFor(h.hand), 0),
    raise: hands.filter(h => h.action === 'raise').reduce((a, h) => a + combosFor(h.hand), 0),
    call: hands.filter(h => h.action === 'call').reduce((a, h) => a + combosFor(h.hand), 0),
    fold: hands.filter(h => h.action === 'fold').reduce((a, h) => a + combosFor(h.hand), 0),
  };

  // Segments para o RangeBar
  const rangeSegments: RangeSegment[] = [
    { label: 'All-in', percentage: (stats.allin / hands.length * 100), color: '#ec4899' },
    { label: 'Raise', percentage: (stats.raise / hands.length * 100), color: '#22c55e' },
    { label: 'Call', percentage: (stats.call / hands.length * 100), color: '#3b82f6' },
    { label: 'Fold', percentage: (stats.fold / hands.length * 100), color: '#6b7280' },
  ];

  // Descrições por posição
  const positionDescriptions: Record<Position, string> = {
    UTG: 'Under the Gun - Posição mais tight. Range ~12-15%.',
    HJ: 'Hijack - Um pouco mais loose que UTG. Range ~15-18%.',
    CO: 'Cutoff - Posição com boa fold equity. Range ~22-27%.',
    BTN: 'Button - Melhor posição da mesa. Range ~35-45%.',
    SB: 'Small Blind - Posição difícil, tight vs limpers. Range ~25-35%.',
    BB: 'Big Blind - Defende wide vs steals. Range de defesa ~40-50%.',
  };

  return (
    <div className="ranges-page" style={{ maxWidth: 1100, margin: '0 auto' }}>
      <style>{`
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes softPulse {
          0% { box-shadow: 0 0 0 0 rgba(99,102,241,0.5); }
          70% { box-shadow: 0 0 0 8px rgba(99,102,241,0); }
          100% { box-shadow: 0 0 0 0 rgba(99,102,241,0); }
        }
      `}</style>
      {/* Barra de confiança */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
      }}>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Confiabilidade GTO:</span>
        <div style={{ flex: 1, height: 8, background: 'rgba(148,163,184,0.2)', borderRadius: 999 }}>
          <div style={{ width: `${confidence}%`, height: '100%', background: 'linear-gradient(90deg, #22c55e, #f59e0b)', borderRadius: 999 }} />
        </div>
        <span style={{ fontSize: 12, color: '#fbbf24', fontWeight: 700 }}>{confidence}%</span>
      </div>
      {/* Paywall Modal - para explicação com IA */}
      <PremiumPaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        paywallType="ranges"
        onUpgrade={() => {
          setShowPaywall(false);
          navigate('/premium');
        }}
        onViewPlans={() => {
          setShowPaywall(false);
          navigate('/planos');
        }}
      />

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>📊 Ranges GTO</h1>
          <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)', fontSize: 14 }}>
            Estude os ranges de abertura GTO por posição
          </p>
        </div>

        {/* Cenário + Toggle simples/avançado + Stack size + Contexto */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {(['RFI', '3bet', 'vs3bet'] as const).map(s => (
            <button
              key={s}
              onClick={() => setScenario(s)}
              style={{
                padding: '8px 16px',
                background: scenario === s
                  ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)'
                  : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${scenario === s ? 'transparent' : 'rgba(255, 255, 255, 0.1)'}`,
                borderRadius: 8,
                color: scenario === s ? 'white' : 'var(--text-secondary)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {s === 'RFI' ? 'Open Raise' : s === '3bet' ? '3-Bet' : 'vs 3-Bet'}
            </button>
          ))}
          <div style={{ marginLeft: 8 }}>
            <button
              onClick={() => setMatrixMode('simple')}
              style={{
                padding: '8px 12px',
                background: matrixMode === 'simple' ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: matrixMode === 'simple' ? '#22c55e' : 'var(--text-secondary)',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Modo Simples
            </button>
            <button
              onClick={() => setMatrixMode('advanced')}
              style={{
                marginLeft: 6,
                padding: '8px 12px',
                background: matrixMode === 'advanced' ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: matrixMode === 'advanced' ? '#818cf8' : 'var(--text-secondary)',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Modo Avançado
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Stack:</span>
            {[10,20,40,100].map(ss => (
              <button key={ss}
                onClick={() => setStackSize(ss as 10|20|40|100)}
                style={{
                  padding: '6px 10px',
                  background: stackSize === ss ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: stackSize === ss ? '#a78bfa' : 'var(--text-secondary)',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >{ss}bb</button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Formato:</span>
            {(['CASH','MTT'] as const).map(f => (
              <button key={f}
                onClick={() => setFormat(f)}
                style={{
                  padding: '6px 10px',
                  background: format === f ? 'rgba(14,165,233,0.2)' : 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: format === f ? '#0ea5e9' : 'var(--text-secondary)',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >{f}</button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Field:</span>
            {(['regulares','recreativo'] as const).map(fl => (
              <button key={fl}
                onClick={() => setField(fl)}
                style={{
                  padding: '6px 10px',
                  background: field === fl ? 'rgba(234,179,8,0.2)' : 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: field === fl ? '#eab308' : 'var(--text-secondary)',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >{fl}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs de Posição */}
      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <PositionTabs
          positions={['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB']}
          activePosition={activePosition}
          onPositionChange={setActivePosition}
        />
        
        <p style={{
          marginTop: 16,
          padding: 12,
          background: 'rgba(139, 92, 246, 0.1)',
          borderRadius: 8,
          fontSize: 13,
          color: 'var(--text-secondary)',
        }}>
          💡 {positionDescriptions[activePosition]}
        </p>
      </div>

      {/* Layout Principal */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
        
        {/* Matrix de Mãos */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
              🎴 Range de {activePosition}
            </h3>
            <span style={{
              padding: '4px 10px',
              background: 'rgba(34, 197, 94, 0.2)',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              color: '#22c55e',
            }}>
              {stats.openingRange}% das mãos
            </span>
          </div>

          <div key={`${activePosition}-${scenario}-${matrixMode}-${stackSize}`}
            style={{
              transition: 'all 300ms ease',
              animation: 'fadeSlide 300ms ease',
            }}>
            <HandMatrix
              hands={hands}
              onHandClick={(hand) => {
                setSelectedHand(hand === selectedHand ? null : hand);
              }}
              selectedHands={selectedHand ? [selectedHand] : []}
              mode={matrixMode}
            />
          </div>

          {/* Mão Selecionada */}
          {selectedHand && (
            <div style={{
              marginTop: 16,
              padding: 16,
              background: 'rgba(34, 197, 94, 0.1)',
              border: '2px solid rgba(34, 197, 94, 0.3)',
              borderRadius: 12,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 4 }}>Mão Selecionada</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#22c55e' }}>{selectedHand}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>
                Ação: <strong style={{ color: '#fff' }}>
                  {hands.find(h => h.hand === selectedHand)?.action.toUpperCase()}
                </strong>
              </div>
              <div style={{ marginTop: 12 }}>
                <button
                  onClick={() => {
                    // Navega para treino com mão predefinida
                    const params = new URLSearchParams({ hand: selectedHand, position: activePosition, stack: String(stackSize) });
                    window.location.href = `/trainer?${params.toString()}`;
                  }}
                  style={{
                    padding: '10px 14px',
                    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                    border: 'none',
                    borderRadius: 10,
                    color: 'white',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  🎯 Treinar essa mão
                </button>
              </div>
            </div>
          )}

          {/* Barra de Range */}
          <div style={{ marginTop: 20 }}>
            <RangeBar segments={rangeSegments} />
          </div>
        </div>

        {/* Sidebar - Estatísticas */}
        <div>
          {/* Stats Card */}
          <div className="card" style={{ padding: 20, marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>📈 Estatísticas</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <StatRow label="All-in" value={stats.allin} total={hands.length} color="#ec4899" />
              <StatRow label="Raise" value={stats.raise} total={hands.length} color="#22c55e" />
              <StatRow label="Call" value={stats.call} total={hands.length} color="#3b82f6" />
              <StatRow label="Fold" value={stats.fold} total={hands.length} color="#6b7280" />
            </div>

            <div style={{
              marginTop: 16,
              padding: 12,
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: 8,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#22c55e' }}>
                {stats.openingRange}%
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Range Total
              </div>
            </div>
          </div>

          {/* Ações (estilo GTO Wizard) */}
          <div className="card" style={{ padding: 20, marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>🎯 Ações</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
              {[
                { label: 'All-in', color: '#7f1d1d', percent: totalCombos ? (comboStats.allin / totalCombos * 100) : 0, combos: comboStats.allin },
                { label: 'Raise 3', color: '#b91c1c', percent: totalCombos ? (comboStats.raise / totalCombos * 100) : 0, combos: comboStats.raise },
                { label: 'Fold', color: '#1e3a8a', percent: totalCombos ? (comboStats.fold / totalCombos * 100) : 0, combos: comboStats.fold },
              ].map((row, i) => (
                <div key={i} style={{
                  display: 'grid',
                  gridTemplateColumns: '120px 1fr 120px',
                  alignItems: 'center',
                  gap: 12,
                }}>
                  <div style={{
                    background: row.color,
                    color: 'white',
                    padding: '10px 12px',
                    borderRadius: 8,
                    fontWeight: 800,
                    textAlign: 'center'
                  }}>{row.label}</div>
                  <div style={{ height: 12, background: 'rgba(255,255,255,0.08)', borderRadius: 999 }}>
                    <div style={{ width: `${row.percent.toFixed(1)}%`, height: '100%', background: row.color, borderRadius: 999 }} />
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 12, textAlign: 'right' }}>
                    {row.percent.toFixed(1)}% · {row.combos} combos
                  </div>
                </div>
              ))}
              {/* Call separado */}
              <div style={{
                display: 'grid', gridTemplateColumns: '120px 1fr 120px', alignItems: 'center', gap: 12,
                marginTop: 4,
              }}>
                <div style={{
                  background: '#166534', color: 'white', padding: '10px 12px', borderRadius: 8, fontWeight: 800, textAlign: 'center'
                }}>Call</div>
                <div style={{ height: 12, background: 'rgba(255,255,255,0.08)', borderRadius: 999 }}>
                  <div style={{ width: `${(totalCombos ? (comboStats.call / totalCombos * 100) : 0).toFixed(1)}%`, height: '100%', background: '#166534', borderRadius: 999 }} />
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 12, textAlign: 'right' }}>
                  {(totalCombos ? (comboStats.call / totalCombos * 100) : 0).toFixed(1)}% · {comboStats.call} combos
                </div>
              </div>
            </div>
          </div>

          {/* Hands (detalhe da mão selecionada) */}
          <div className="card" style={{ padding: 20, marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>🃏 Hands</h3>
            {!selectedHand ? (
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Selecione uma mão na matriz para ver o mix.</div>
            ) : (
              (() => {
                const hd = hands.find(h => h.hand === selectedHand);
                const combos = combosFor(selectedHand);
                const mix = hd?.mix || { allin: 0, raise: 0, call: 0, fold: 0 };
                const rows = [
                  { label: 'Allin 200', color: '#7f1d1d', p: mix.allin || 0 },
                  { label: 'Raise 3', color: '#b91c1c', p: mix.raise || 0 },
                  { label: 'Call', color: '#166534', p: mix.call || 0 },
                  { label: 'Fold', color: '#1e3a8a', p: mix.fold || 0 },
                ];
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {rows.map((r, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 120px', gap: 12, alignItems: 'center' }}>
                        <div style={{ background: r.color, color: '#fff', fontWeight: 800, padding: '10px 12px', borderRadius: 8, textAlign: 'center' }}>{r.label}</div>
                        <div style={{ height: 12, background: 'rgba(255,255,255,0.08)', borderRadius: 999 }}>
                          <div style={{ width: `${r.p.toFixed(1)}%`, height: '100%', background: r.color, borderRadius: 999 }} />
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: 12, textAlign: 'right' }}>
                          {r.p.toFixed(1)}% · {(Math.round(combos * r.p / 100))} combos
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()
            )}
          </div>

          {/* Blockers + Equity chart */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>🛡️ Blockers & Equity</h3>
            {!selectedHand ? (
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Selecione uma mão para ver bloqueadores e equity.</div>
            ) : (
              (() => {
                const ranks = selectedHand.slice(0,2).split('');
                const hasSuited = selectedHand.endsWith('s');
                const info = [
                  { k: 'Bloqueia pares altos', v: (ranks.includes('A') || ranks.includes('K')) ? 'Parcial' : 'Baixo' },
                  { k: 'Bloqueia broadways', v: (ranks.some(r => ['A','K','Q','J','T'].includes(r))) ? 'Médio' : 'Baixo' },
                  { k: 'Conectividade', v: (['A','K','Q','J','T','9','8','7','6','5','4','3','2'].indexOf(ranks[0]) - ['A','K','Q','J','T','9','8','7','6','5','4','3','2'].indexOf(ranks[1]) <= 2) ? 'Boa' : 'Média' },
                  { k: 'Suited', v: hasSuited ? 'Sim' : 'Não' },
                ];
                const hd = hands.find(h => h.hand === selectedHand);
                const mix = hd?.mix || { allin: 0, raise: 0, call: 0, fold: 0 };
                const equityBars = [
                  { label: 'Valor/Agressão', color: '#b91c1c', val: Math.min(100, (mix.raise || 0) + (mix.allin || 0)) },
                  { label: 'Jogabilidade', color: '#166534', val: Math.min(100, (mix.call || 0) + (hasSuited ? 15 : 5)) },
                  { label: 'Passividade', color: '#1e3a8a', val: mix.fold || 0 },
                ];
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      {info.map((it, i) => (
                        <div key={i} style={{ padding: 10, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{it.k}</div>
                          <div style={{ fontSize: 13, fontWeight: 700 }}>{it.v}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 4 }}>
                      {equityBars.map((b, i) => (
                        <div key={i} style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>{b.label}</div>
                          <div style={{ height: 10, background: 'rgba(255,255,255,0.08)', borderRadius: 999 }}>
                            <div style={{ width: `${b.val.toFixed(1)}%`, height: '100%', background: b.color, borderRadius: 999 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()
            )}
          </div>

          {/* Legenda */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>🎨 Legenda</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <LegendItem color="#ec4899" label="All-in" description="Push ou 5bet+" />
              <LegendItem color="#22c55e" label="Raise" description="Open raise ou 3bet" />
              <LegendItem color="#3b82f6" label="Call" description="Call ou flat" />
              <LegendItem color="#6b7280" label="Fold" description="Fold" />
            </div>
          </div>

          {/* Botão de Explicação com IA */}
          <div className="card" style={{ padding: 20, marginTop: 20 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700 }}>🧠 Explicação com IA</h3>
            <p style={{ 
              margin: '0 0 16px', 
              fontSize: 13, 
              color: 'var(--text-secondary)',
              lineHeight: 1.5 
            }}>
              Entenda o porquê de cada decisão no range de {activePosition}
            </p>
            {IA_RANGES_COMING_SOON ? (
              <>
                <button
                  disabled
                  style={{
                    width: '100%',
                    padding: '14px 20px',
                    background: 'rgba(148,163,184,0.2)',
                    border: '1px solid rgba(148,163,184,0.3)',
                    borderRadius: 10,
                    color: '#cbd5e1',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  🚧 Em breve disponível
                </button>
                <div style={{
                  marginTop: 10,
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  textAlign: 'center'
                }}>
                  A explicação por IA dos ranges será liberada em breve.
                </div>
              </>
            ) : (
              isPremium ? (
                <>
                  {/* conteúdo original premium (mantido) */}
                </>
              ) : (
                <button
                  onClick={() => setShowPaywall(true)}
                  style={{
                    width: '100%',
                    padding: '14px 20px',
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(139, 92, 246, 0.1))',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: 10,
                    color: '#a78bfa',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  🔒 Explicação Premium
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Componentes auxiliares
function StatRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const percentage = (value / total * 100).toFixed(1);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
      <span style={{ flex: 1, fontSize: 13 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600 }}>{value}</span>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 50, textAlign: 'right' }}>
        {percentage}%
      </span>
    </div>
  );
}

function LegendItem({ color, label, description }: { color: string; label: string; description: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: 24,
        height: 24,
        borderRadius: 4,
        background: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 10,
        fontWeight: 700,
        color: 'white',
      }}>
        {label[0]}
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{description}</div>
      </div>
    </div>
  );
}
