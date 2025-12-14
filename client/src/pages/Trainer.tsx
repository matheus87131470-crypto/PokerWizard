import React, { useEffect, useState } from 'react';
import CustomSelect from '../components/CustomSelect';
import { useAuth } from '../contexts/AuthContext';

// Detectar ambiente automaticamente
function getApiBase(): string {
  if (import.meta && (import.meta as any).env && (import.meta as any).env.VITE_API_BASE) {
    return (import.meta as any).env.VITE_API_BASE;
  }
  if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
    return 'https://pokerwizard.onrender.com';
  }
  return 'http://localhost:3000';
}
const API_BASE = getApiBase();

// 📋 TYPES
type TableType = 'heads-up' | '6-max' | '9-max';
type Position = 'BTN' | 'SB' | 'BB' | 'UTG' | 'UTG+1' | 'MP' | 'HJ' | 'CO';

// 🎯 POSIÇÕES POR MESA (CORE)
const positionsByTable: Record<TableType, Position[]> = {
  'heads-up': ['BTN', 'BB'],
  '6-max': ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'],
  '9-max': ['UTG', 'UTG+1', 'MP', 'HJ', 'CO', 'BTN', 'SB', 'BB'],
};

export default function Trainer() {
  const auth = useAuth();
  const [table, setTable] = useState<TableType>('6-max');
  const [position, setPosition] = useState<Position>('CO');
  const [gameType, setGameType] = useState('MTT');
  const [street, setStreet] = useState<'Pré-flop' | 'Flop' | 'Turn' | 'River'>('Pré-flop');
  
  // ✅ DOIS STATES SEPARADOS (igual GTO Wizard)
  const [preflopAction, setPreflopAction] = useState('Raise');
  const [postflopAction, setPostflopAction] = useState('Bet');
  
  const [networks, setNetworks] = useState<any[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState('partypoker');
  const [scenario, setScenario] = useState<any>(null);
  const [selectedHeroPos, setSelectedHeroPos] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isExampleScenario, setIsExampleScenario] = useState(false);

  // Helper to create an example scenario when backend is unavailable
  function createExampleScenario(): any {
    const sid = `s-example-${Date.now()}`;
    return {
      id: sid,
      table,
      position,
      gameType,
      street,
      action: street === 'Pré-flop' ? preflopAction : postflopAction,
      heroCards: ['K♠', '9♥'],
      board: street !== 'Pré-flop' ? ['A♣', '7♦', '2♥'] : [],
      villainRange: 'JJ+, AKs, AKo',
      correctAction: 'Call',
      ev: 12.34,
      network: selectedNetwork,
      seats: [
        { position: 'UTG', name: 'PokerMaster99', stack: 1420 },
        { position: 'HJ', name: 'SilentAssassin', stack: 1180 },
        { position: 'CO', name: 'FlopKing', stack: 1360 },
        { position: 'BTN', name: 'BluffMaster', stack: 1580 },
        { position: 'SB', name: 'AllInWin', stack: 1010 },
        { position: 'BB', name: 'PerfectPlay', stack: 1210 },
      ],
    };
  }

  // 🔄 RESET AUTOMÁTICO - Position quando trocar Mesa (igual GTO Wizard)
  useEffect(() => {
    const validPositions = positionsByTable[table];
    
    if (!validPositions.includes(position)) {
      setPosition(validPositions[0]);
    }
  }, [table]);

  // 🔄 RESET AUTOMÁTICO - Action ao trocar Street (igual GTO Wizard)
  useEffect(() => {
    if (street === 'Pré-flop') {
      setPreflopAction('Raise');
    } else {
      setPostflopAction('Bet');
    }
  }, [street]);

  useEffect(() => {
    async function loadNetworks() {
      try {
        const res = await fetch(`${API_BASE}/api/players/networks`);
        const j = await res.json();
        const fetched = j.networks || [];
        setNetworks(fetched);
        if (fetched && fetched.length) {
          // prefer partypoker if available, otherwise pick first
          const hasParty = fetched.some((n: any) => (n.name || '').toLowerCase() === 'partypoker');
          if (hasParty) setSelectedNetwork('partypoker');
          else setSelectedNetwork(fetched[0].name);
        }
      } catch (e) {
        console.error(e);
      }
    }
    async function loadUsage() {
      try {
        if (!auth.token) return;
        const res = await fetch(`${API_BASE}/api/trainer/usage`, { headers: { Authorization: `Bearer ${auth.token}` } });
        const j = await res.json();
        setUsage(j);
      } catch (e) {}
    }
    loadNetworks();
    loadUsage();
  }, []);

  async function handleGenerate(e?: React.FormEvent) {
    e?.preventDefault();
    setFeedback(null);
    setLoading(true);
    try {
      if (!auth.token) {
        setFeedback({ error: 'auth', message: 'Faça login para gerar situações.' });
        setLoading(false);
        return;
      }

      // ✅ PAYLOAD CORRETO (sem gambiarra)
      const action = street === 'Pré-flop' ? preflopAction : postflopAction;
      
      const res = await fetch(`${API_BASE}/api/trainer/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ 
          table,
          position, 
          gameType, 
          street, 
          action,
          network: selectedNetwork 
        }),
      });
      const j = await res.json();
      if (!j.ok) {
        // If backend returns an error, fallback to a local example scenario
        const example = createExampleScenario();
        setScenario(example);
        setSelectedHeroPos(example.position || null);
        setIsExampleScenario(true);
        setUsage((prev: any) => ({ ...prev, remaining: j && typeof j.remaining !== 'undefined' ? j.remaining : (prev ? prev.remaining : 5) }));
        setFeedback({ error: j.error || 'backend_error', message: j.message || 'Servidor indisponível — mostrando exemplo local.' });
        setLoading(false);
        return;
      }
      setScenario(j.scenario);
      setSelectedHeroPos(j.scenario.position || null);
      setUsage((prev: any) => ({ ...prev, remaining: j.remaining }));
    } catch (err) {
      console.error(err);
      // On network error, inject an example scenario so UI remains usable
      const example = createExampleScenario();
      setScenario(example);
      setSelectedHeroPos(example.position || null);
      setIsExampleScenario(true);
      setFeedback({ error: 'network', message: 'Não foi possível conectar ao servidor — mostrando exemplo local.' });
    } finally {
      setLoading(false);
    }
  }

  async function handleChoose(action: string) {
    if (!scenario) return;
    if (!auth.token) {
      setFeedback({ error: 'auth', message: 'Faça login para registrar escolhas.' });
      return;
    }

    const res = await fetch(`${API_BASE}/api/trainer/record`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` },
      body: JSON.stringify({ scenarioId: scenario.id, chosenAction: action }),
    });
    const j = await res.json();
    if (j.ok) {
      setFeedback(j.feedback);
    }
    // refresh usage/stats
    const ures = await fetch(`${API_BASE}/api/trainer/usage`, { headers: { Authorization: `Bearer ${auth.token}` } });
    setUsage(await ures.json());
  }

  function handleSeatClick(pos: string) {
    // change hero position locally and highlight
    setSelectedHeroPos(pos);
    setScenario((s: any) => s ? { ...s, position: pos } : s);
    setFeedback(null);
  }

  async function handleSubscribe() {
    if (!auth.token) { setFeedback({ error: 'auth', message: 'Faça login para assinar.' }); return; }
    await fetch(`${API_BASE}/api/trainer/subscribe`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` } });
    setUsage({ remaining: -1 });
  }

  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiMode, setAiMode] = useState(true);

  async function handleAIAnalysis() {
    if (!scenario) return;
    
    setLoadingAI(true);
    setAiAnalysis('🤖 Analisando situação com IA...');

    try {
      const response = await fetch(`${API_BASE}/api/trainer/ai-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario,
          chosenAction: feedback?.chosenAction || null,
        }),
      });

      const data = await response.json();
      
      if (data.ok && data.analysis) {
        setAiAnalysis(data.analysis);
      } else {
        setAiAnalysis('❌ Erro ao analisar. Tente novamente.');
      }
    } catch (error) {
      console.error('AI Analysis error:', error);
      setAiAnalysis('❌ Erro de conexão com IA.');
    } finally {
      setLoadingAI(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-6">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 flex items-center gap-3">
              <span className="text-4xl">🧪</span>
              Training Lab AI
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                onClick={() => setAiMode(!aiMode)}
                style={{
                  background: aiMode ? 'linear-gradient(90deg, #3b82f6 0%, #a855f7 100%)' : '#374151',
                  color: aiMode ? 'white' : '#9ca3af',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: aiMode ? '0 4px 14px rgba(59, 130, 246, 0.5)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (!aiMode) e.currentTarget.style.background = '#4b5563';
                }}
                onMouseLeave={(e) => {
                  if (!aiMode) e.currentTarget.style.background = '#374151';
                }}
              >
                {aiMode ? '🤖 IA Ativa' : '🤖 Ativar IA'}
              </button>
              {auth.user && (
                <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                  Olá, <span style={{ color: 'white', fontWeight: '600' }}>{auth.user.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 20 }}>
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-2xl p-6 border border-purple-500/20">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span>⚙️</span>
            Configurações
          </h2>
          <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">🎰 Plataforma</label>
              <select 
                value={selectedNetwork}
                onChange={(e) => setSelectedNetwork(e.target.value)}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50"
              >
                {networks.map((n: any) => (
                  <option key={n.name} value={n.name}>{n.name}</option>
                ))}
              </select>
            </div>

            {/* ✅ SELECT DE MESA (NOVO) */}
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">🪑 Mesa</label>
              <select 
                value={table}
                onChange={(e) => setTable(e.target.value as TableType)}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50"
              >
                <option value="heads-up">Heads-up</option>
                <option value="6-max">6-max</option>
                <option value="9-max">9-max</option>
              </select>
            </div>

            {/* ✅ SELECT DE POSIÇÃO (DINÂMICO) */}
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">📍 Posição</label>
              <select 
                value={position}
                onChange={(e) => setPosition(e.target.value as Position)}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50"
              >
                {positionsByTable[table].map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">🎮 Tipo de jogo</label>
              <input 
                value={gameType} 
                onChange={(e) => setGameType(e.target.value)} 
                className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">🃏 Street</label>
              <select 
                value={street}
                onChange={(e) => setStreet(e.target.value as 'Pré-flop' | 'Flop' | 'Turn' | 'River')}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50"
              >
                <option value="Pré-flop">Pré-flop</option>
                <option value="Flop">Flop</option>
                <option value="Turn">Turn</option>
                <option value="River">River</option>
              </select>
            </div>

            {/* ✅ JSX CONDICIONAL - Dois componentes diferentes (igual GTO Wizard) */}
            {street === 'Pré-flop' ? (
              <div style={{ animation: 'fadeIn 0.3s ease-in' }}>
                <label className="block text-sm font-bold text-gray-300 mb-2 flex items-center gap-2">
                  ⚡ Ação pré-flop
                  <span style={{
                    fontSize: '10px',
                    background: 'linear-gradient(90deg, #f97316 0%, #ea580c 100%)',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: 'bold'
                  }}>
                    PRÉ-FLOP
                  </span>
                </label>
                <select 
                  value={preflopAction}
                  onChange={(e) => setPreflopAction(e.target.value)}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50"
                >
                  <option value="Raise">Raise</option>
                  <option value="Call">Call</option>
                  <option value="Fold">Fold</option>
                  <option value="3-bet">3-bet</option>
                  <option value="4-bet">4-bet</option>
                  <option value="All-in">All-in</option>
                </select>
              </div>
            ) : (
              <div style={{ animation: 'fadeIn 0.3s ease-in' }}>
                <label className="block text-sm font-bold text-gray-300 mb-2 flex items-center gap-2">
                  🎲 Ação da Street
                  <span style={{
                    fontSize: '10px',
                    background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: 'bold'
                  }}>
                    {street.toUpperCase()}
                  </span>
                </label>
                <select 
                  value={postflopAction}
                  onChange={(e) => setPostflopAction(e.target.value)}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50"
                >
                  <option value="Bet">Bet</option>
                  <option value="Check">Check</option>
                  <option value="Call">Call</option>
                  <option value="Raise">Raise</option>
                  <option value="Fold">Fold</option>
                </select>
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button 
                disabled={loading} 
                type="submit" 
                style={{
                  flex: 1,
                  background: loading ? '#6b7280' : 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)',
                  color: 'white',
                  fontWeight: 'bold',
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.5 : 1,
                  boxShadow: loading ? 'none' : '0 4px 14px rgba(168, 85, 247, 0.5)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = 'linear-gradient(90deg, #9333ea 0%, #db2777 100%)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)';
                  }
                }}
              >
                {loading ? '⏳ Gerando...' : '✨ Gerar Situação'}
              </button>
              <button 
                type="button" 
                onClick={() => { setScenario(null); setFeedback(null); setIsExampleScenario(false); setAiAnalysis(''); }} 
                style={{
                  padding: '0 16px',
                  background: '#374151',
                  color: '#d1d5db',
                  fontWeight: '600',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#4b5563';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#374151';
                }}
              >
                🗑️
              </button>
            </div>
          </form>

          <div className="mt-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
            <div className="text-sm text-gray-400 mb-2">
              💎 Treinos restantes: <span className="text-white font-bold">{usage ? (usage.remaining === -1 ? '∞ Ilimitado' : usage.remaining) : '—'}</span>
            </div>
            {usage && usage.remaining === 0 && (
              <button 
                onClick={handleSubscribe} 
                style={{
                  width: '100%',
                  marginTop: '8px',
                  background: 'linear-gradient(90deg, #22c55e 0%, #10b981 100%)',
                  color: 'white',
                  fontWeight: 'bold',
                  padding: '8px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(34, 197, 94, 0.5)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(90deg, #16a34a 0%, #059669 100%)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(90deg, #22c55e 0%, #10b981 100%)';
                }}
              >
                ⭐ Assinar PRO — R$ 5,90/mês
              </button>
            )}
          </div>
        </div>

        <div>
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-2xl p-6 border border-purple-500/20">
            {!scenario && (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🧠</div>
                <div className="text-xl text-gray-400">Gere uma situação para treinar</div>
                <div className="text-sm text-gray-500 mt-2">Configure e clique em "Gerar Situação"</div>
              </div>
            )}

            {scenario && (
              <div>
                {/* SVG Table visual */}
                <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexDirection: 'column' }}>
                  <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                    <div style={{ position: 'relative', width: 560, height: 340 }}>
                      <svg width="560" height="340" viewBox="0 0 560 340" style={{ borderRadius: 12 }}>
                        <defs>
                          <radialGradient id="tblGrad" cx="50%" cy="30%">
                            <stop offset="0%" stopColor="#1a1f3a" />
                            <stop offset="100%" stopColor="#0a0e27" />
                          </radialGradient>
                          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                            <feDropShadow dx="0" dy="8" stdDeviation="18" floodOpacity="0.6"/>
                          </filter>
                        </defs>
                        <ellipse cx="280" cy="170" rx="240" ry="120" fill="url(#tblGrad)" filter="url(#shadow)" />
                      </svg>

                      {/* render seats from scenario.seats */}
                      {(scenario.seats || []).map((s: any, i: number) => {
                        // position map
                        const posMap: any = {
                          UTG: { left: '80px', top: '60px' },
                          HJ: { left: '200px', top: '28px' },
                          CO: { left: '360px', top: '28px' },
                          BTN: { left: '480px', top: '60px' },
                          SB: { left: '420px', top: '260px' },
                          BB: { left: '140px', top: '260px' },
                        };
                        const isSelected = selectedHeroPos === s.position;
                        return (
                          <div
                            key={s.position}
                            onClick={() => handleSeatClick(s.position)}
                            style={{
                              position: 'absolute',
                              left: posMap[s.position].left,
                              top: posMap[s.position].top,
                              transform: 'translate(-50%,-50%)',
                              width: 120,
                              cursor: 'pointer',
                              transition: 'transform 160ms ease, box-shadow 160ms ease',
                              zIndex: isSelected ? 30 : 20,
                              boxShadow: isSelected ? '0 10px 30px rgba(124,58,237,0.18)' : '0 6px 18px rgba(0,0,0,0.4)'
                            }}
                          >
                            <div style={{ textAlign: 'center', fontSize: 12, color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)', fontWeight: 700 }}>{s.position}</div>
                            <div style={{ marginTop: 6, width: 110, margin: '6px auto', padding: '8px 10px', borderRadius: 10, background: isSelected ? 'linear-gradient(90deg, rgba(124,58,237,0.12), rgba(6,182,212,0.06))' : 'rgba(255,255,255,0.02)', border: isSelected ? '1px solid rgba(124,58,237,0.22)' : '1px solid rgba(255,255,255,0.04)' }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{s.name}</div>
                              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>Stack: <strong style={{ color: 'var(--accent-green)' }}>{s.stack}</strong></div>
                              {isSelected && <div style={{ marginTop: 6, fontSize: 13, fontWeight: 800, color: 'var(--accent-primary)' }}>HERO</div>}
                            </div>
                          </div>
                        );
                      })}

                      {/* Center area with community cards */}
                      <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 10 }}>
                          {(scenario.board && scenario.board.length ? scenario.board : []).map((c: string, i: number) => (
                            <div key={i} style={{ width: 56, height: 78, borderRadius: 8, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{c}</div>
                          ))}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{scenario.network} • Range vilão: {scenario.villainRange}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hero cards centered below table */}
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Hero</div>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                      {(scenario.heroCards || []).map((c: string, i: number) => (
                        <div key={i} style={{ width: 68, height: 90, borderRadius: 8, background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18 }}>{c}</div>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
                  {[
                    { action: 'Fold', gradient: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', shadow: '0 4px 14px rgba(239, 68, 68, 0.5)', emoji: '❌' },
                    { action: 'Call', gradient: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)', shadow: '0 4px 14px rgba(34, 197, 94, 0.5)', emoji: '✅' },
                    { action: 'Raise', gradient: 'linear-gradient(135deg, #f97316 0%, #c2410c 100%)', shadow: '0 4px 14px rgba(249, 115, 22, 0.5)', emoji: '📈' },
                    { action: 'All-in', gradient: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)', shadow: '0 4px 14px rgba(168, 85, 247, 0.5)', emoji: '💥' },
                    { action: 'Check', gradient: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)', shadow: '0 4px 14px rgba(59, 130, 246, 0.5)', emoji: '✔️' },
                  ].map(({ action, gradient, shadow, emoji }) => (
                    <button 
                      key={action} 
                      onClick={() => { handleChoose(action); if (aiMode && !aiAnalysis) handleAIAnalysis(); }} 
                      style={{
                        background: gradient,
                        color: 'white',
                        fontWeight: 'bold',
                        padding: '16px 8px',
                        borderRadius: '12px',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: shadow,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <div style={{ fontSize: '28px' }}>{emoji}</div>
                      <div style={{ fontSize: '13px' }}>{action}</div>
                    </button>
                  ))}
                </div>

                {feedback && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-lg border border-blue-500/30">
                    <div className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                      <span>📊</span>
                      Feedback GTO
                    </div>
                    <div className="space-y-2 text-gray-300">
                      <div>
                        Sua jogada: <span className="text-yellow-400 font-bold">{feedback.chosenAction || 'N/A'}</span>
                      </div>
                      <div>
                        Jogada ótima: <span className="text-green-400 font-bold">{feedback.correctAction || scenario.correctAction}</span>
                      </div>
                      <div>
                        EV esperado: <span className="text-blue-400 font-bold">{feedback.ev || scenario.ev}</span>
                      </div>
                      <div>
                        Range vilão: <span className="text-purple-400 font-bold">{feedback.villainRange || scenario.villainRange}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* AI Analysis Button */}
                {aiMode && scenario && (
                  <div style={{ marginTop: '16px' }}>
                    <button
                      onClick={handleAIAnalysis}
                      disabled={loadingAI}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: 'none',
                        fontWeight: 'bold',
                        cursor: loadingAI ? 'not-allowed' : 'pointer',
                        background: loadingAI ? '#4b5563' : 'linear-gradient(90deg, #3b82f6 0%, #a855f7 100%)',
                        color: loadingAI ? '#9ca3af' : 'white',
                        boxShadow: loadingAI ? 'none' : '0 4px 14px rgba(59, 130, 246, 0.5)',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (!loadingAI) {
                          e.currentTarget.style.background = 'linear-gradient(90deg, #2563eb 0%, #9333ea 100%)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!loadingAI) {
                          e.currentTarget.style.background = 'linear-gradient(90deg, #3b82f6 0%, #a855f7 100%)';
                        }
                      }}
                    >
                      {loadingAI ? '⏳ Analisando com IA...' : '🤖 Análise Completa com IA'}
                    </button>
                  </div>
                )}

                {/* post-training tabs removed per user request */}
              </div>
            )}
          </div>

          {/* AI Analysis Section */}
          {aiMode && aiAnalysis && (
            <div className="mt-6 bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-xl shadow-2xl p-6 border border-purple-500/30">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                <span>🤖</span>
                Análise IA Completa
              </h2>
              <div className="bg-gray-900/50 rounded-lg p-4 border border-purple-500/20">
                <p className="text-gray-200 whitespace-pre-wrap leading-relaxed">{aiAnalysis}</p>
              </div>
            </div>
          )}

          <div className="mt-6 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-2xl p-6 border border-purple-500/20">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span>📈</span>
              Meu Progresso
            </h3>
            <MyProgress />
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

function MyProgress() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => { load(); async function load(){
    try{
      const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') as string).email : 'anon';
      const res = await fetch(`${API_BASE}/api/trainer/stats?user=${encodeURIComponent(user)}`);
      const j = await res.json();
      setStats(j.stats);
    }catch(e){console.error(e)}
  } }, []);

  if(!stats) return <div className="text-center text-gray-400 py-8">Nenhum treino registrado ainda. Comece agora!</div>;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 p-4 rounded-lg border border-blue-500/20">
        <div className="text-xs text-gray-400 mb-1">📚 Treinos</div>
        <div className="text-3xl font-bold text-white">{stats.attempts}</div>
      </div>
      <div className="bg-gradient-to-br from-green-900/30 to-green-800/30 p-4 rounded-lg border border-green-500/20">
        <div className="text-xs text-gray-400 mb-1">✅ Acertos</div>
        <div className="text-3xl font-bold text-green-400">{stats.correct}</div>
      </div>
      <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 p-4 rounded-lg border border-purple-500/20">
        <div className="text-xs text-gray-400 mb-1">🎯 Precisão</div>
        <div className="text-3xl font-bold text-purple-400">{stats.percent}%</div>
      </div>
      <div className="bg-gradient-to-br from-orange-900/30 to-orange-800/30 p-4 rounded-lg border border-orange-500/20">
        <div className="text-xs text-gray-400 mb-1">💎 WWSF</div>
        <div className="text-3xl font-bold text-orange-400">{stats.wwsf}</div>
      </div>
    </div>
  );
}
