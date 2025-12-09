import React, { useEffect, useState } from 'react';
import CustomSelect from '../components/CustomSelect';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = (import.meta && (import.meta as any).env && (import.meta as any).env.VITE_API_BASE) || 'http://localhost:3000';

export default function Trainer() {
  const auth = useAuth();
  const [position, setPosition] = useState('CO');
  const [gameType, setGameType] = useState('MTT');
  const [street, setStreet] = useState('Flop');
  const [preflopAction, setPreflopAction] = useState('Any');
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
      position,
      gameType,
      street,
      preflopAction,
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

      const res = await fetch(`${API_BASE}/api/trainer/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ position, gameType, street, preflopAction, network: selectedNetwork }),
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

  return (
    <div className="container">
      <h1>🎓 Treinador de Poker (IA)</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 20 }}>
        <div className="card">
          <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <CustomSelect
              label="Plataforma"
              value={selectedNetwork}
              onChange={setSelectedNetwork}
              options={networks.map((n: any) => n.name)}
            />

            <CustomSelect
              label="Posição"
              value={position}
              onChange={setPosition}
              options={['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB']}
            />

            <label style={{ fontSize: 13, fontWeight: 700 }}>Tipo de jogo</label>
            <input value={gameType} onChange={(e) => setGameType(e.target.value)} className="search-input" />

            <CustomSelect
              label="Street inicial"
              value={street}
              onChange={setStreet}
              options={['Pré-flop', 'Flop', 'Turn', 'River']}
            />

            <CustomSelect
              label="Ação pré-flop"
              value={preflopAction}
              onChange={setPreflopAction}
              options={['Any', '3-bet', '4-bet', 'Squeeze', 'Limp', 'Iso']}
            />

            <div style={{ display: 'flex', gap: 8 }}>
              <button disabled={loading} type="submit" className="btn btn-primary">{loading ? 'Gerando...' : (isExampleScenario ? 'Gerar Situação (exemplo)' : 'Gerar Situação')}</button>
              <button type="button" onClick={() => { setScenario(null); setFeedback(null); setIsExampleScenario(false); }} className="btn btn-ghost">Limpar</button>
            </div>
          </form>

          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Treinos gratuitos restantes: {usage ? (usage.remaining === -1 ? 'Ilimitado (assinante)' : usage.remaining) : '—'}</div>
            {usage && usage.remaining === 0 && (
              <div style={{ marginTop: 10 }}>
                <div style={{ marginBottom: 8, color: 'var(--text-muted)' }}>Você atingiu o limite diário.</div>
                <button onClick={handleSubscribe} className="btn btn-primary">Assinar Treino PRO — R$ 5,90/mês</button>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="card" style={{ padding: 20 }}>
            {!scenario && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 28 }}>🧠</div>
                <div style={{ marginTop: 8 }}>Gere uma situação para treinar</div>
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

                <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
                  {['Fold', 'Call', 'Raise', 'All-in', 'Check'].map((a) => (
                    <button key={a} onClick={() => handleChoose(a)} className="btn" style={{ flex: 1 }}>{a}</button>
                  ))}
                </div>

                {feedback && (
                  <div style={{ marginTop: 14, padding: 12, borderRadius: 8, background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>Feedback</div>
                    <div style={{ color: 'var(--text-muted)', marginTop: 8 }}>Jogada correta: <strong>{feedback.correctAction}</strong></div>
                    <div style={{ color: 'var(--text-muted)', marginTop: 6 }}>EV esperado: <strong>{feedback.ev}</strong></div>
                    <div style={{ color: 'var(--text-muted)', marginTop: 6 }}>Range vilão: <strong>{feedback.villainRange}</strong></div>
                  </div>
                )}

                {/* post-training tabs removed per user request */}
              </div>
            )}
          </div>

          <div style={{ marginTop: 12 }} className="card">
            <h3>Meu Progresso</h3>
            <MyProgress />
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

  if(!stats) return <div style={{ color: 'var(--text-muted)' }}>Nenhum treino registrado ainda.</div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <div style={{ padding: 8 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Treinos</div>
        <div style={{ fontSize: 20, fontWeight: 700 }}>{stats.attempts}</div>
      </div>
      <div style={{ padding: 8 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Acertos</div>
        <div style={{ fontSize: 20, fontWeight: 700 }}>{stats.correct}</div>
      </div>
      <div style={{ padding: 8 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>% Decisões corretas</div>
        <div style={{ fontSize: 20, fontWeight: 700 }}>{stats.percent}%</div>
      </div>
      <div style={{ padding: 8 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>WWSF (estim.)</div>
        <div style={{ fontSize: 20, fontWeight: 700 }}>{stats.wwsf}</div>
      </div>
    </div>
  );
}
