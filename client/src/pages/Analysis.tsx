import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

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

export default function Analysis() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState<string>('');
  const [site, setSite] = useState<string>('pokerstars');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('graficos');
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const usos = (auth.user as any)?.usosRestantes;
    const noUsos = typeof usos === 'number' ? (usos <= 0 && usos !== -1) : (typeof auth.user?.credits === 'number' && auth.user!.credits <= 0 && !auth.user!.premium);
    if (auth.user && !auth.user.premium && noUsos) {
      navigate('/premium');
    }
  }, [auth.user, navigate]);

  function generateMockPlayerData(name: string) {
    const mockStats = {
      vpip: Math.floor(Math.random() * 40 + 15),
      pfr: Math.floor(Math.random() * 30 + 8),
      aggression_factor: (Math.random() * 0.8 + 0.3).toFixed(2),
      winrate: Math.floor(Math.random() * 20 + 5),
      bb_won: Math.floor(Math.random() * 5000 + 1000),
      total_hands: Math.floor(Math.random() * 50000 + 10000),
      roi: Math.floor(Math.random() * 40 + 5),
      itm: Math.floor(Math.random() * 50 + 20),
    };

    const improvements = [
      'Reduzir VPIP em posições iniciais (UTG/UTG+1)',
      'Aumentar 3-bets contra raises late position',
      'Melhorar fold to 3-bet em botão',
      'Estudar estratégia contra blind steals',
      'Trabalhar valor betting pós-flop',
    ];

    const leaks = [
      'VPIP muito alto em UTG (ideal: 10-14%)',
      'Underbetting no turn com strong hands',
      'Chamadas frequentes em 3-bets',
      'Agressividade inconsistente pós-flop',
    ];

    const tournaments = [
      { name: 'Sunday Million', site: 'PokerStars', profit: 450, roi: 18, placement: '1,245 / 8,934' },
      { name: 'High Roller', site: 'PokerStars', profit: 1250, roi: 42, placement: '156 / 489' },
      { name: 'Turbo Series', site: 'PokerStars', profit: 890, roi: 35, placement: '342 / 2,156' },
    ];

    const afNum = parseFloat(String(mockStats.aggression_factor));
    const analysis = `Análise de ${name} em ${site === 'pokerstars' ? 'PokerStars' : site}:\n\nPERFIL DO JOGADOR:\nEste jogador apresenta um estilo ${afNum > 0.6 ? 'agressivo' : afNum > 0.4 ? 'balanceado' : 'passivo'}. Com VPIP de ${mockStats.vpip}% e PFR de ${mockStats.pfr}%, mostra uma abordagem ${mockStats.vpip > 30 ? 'loose' : 'tight'}.\n\nPONTOS FORTES:\nROI consistente em torneios (${mockStats.roi}%)\nBom ITM rate (${mockStats.itm}%)\nEstilo agressivo detectado (AF: ${mockStats.aggression_factor})\nExperiência em múltiplos formatos`;

    return {
      player: name,
      site,
      stats: mockStats,
      improvements,
      leaks,
      tournaments,
      analysis,
      remaining: (auth.user as any)?.usosRestantes ?? 5,
    };
  }

  async function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    if (!playerName.trim()) {
      setError('Digite um nome de jogador');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      if (!auth.token) {
        setError('Faça login para buscar análises.');
        setLoading(false);
        return;
      }

      const usos = (auth.user as any)?.usosRestantes;
      const noUsos = typeof usos === 'number' ? (usos <= 0 && usos !== -1) : (typeof auth.user?.credits === 'number' && auth.user!.credits <= 0 && !auth.user!.premium);
      if (auth.user && !auth.user.premium && noUsos) {
        setError('Seus créditos acabaram. Assine para continuar.');
        setLoading(false);
        navigate('/premium');
        return;
      }

      // Try backend SharkScope proxy first; fallback to mock if unavailable
      try {
        const res = await api.get(`/api/sharkscope/player/${encodeURIComponent(playerName)}`);
        if (!res.ok) throw new Error(res.message || 'Erro');
        const data = res.data;
        const mapped = {
          player: data.name || playerName,
          site,
          stats: {
            vpip: 0,
            pfr: 0,
            aggression_factor: 0,
            winrate: 0,
            bb_won: 0,
            total_hands: Number(data.games || 0),
            roi: Number(data.roi || 0),
            itm: Number(data.cashes || 0),
          },
          improvements: ['Aprimorar ranges pós-flop', 'Revisar spots de 3-bet', 'Equilibrar agressividade em turn'],
          leaks: ['Divergência de ROI vs volume', 'Frequência de calls em 3-bet'],
          tournaments: [],
          analysis: `Perfil: jogos=${data.games ?? '?'} • ROI=${data.roi ?? '?'} • cashes=${data.cashes ?? '?'}`,
          remaining: (auth.user as any)?.usosRestantes ?? 5,
        };
        setHistory([mapped, ...history.slice(0, 9)]);
        setResult(mapped);
      } catch {
        const mockResult = generateMockPlayerData(playerName);
        setHistory([mockResult, ...history.slice(0, 9)]);
        setResult(mockResult);
      }
    } catch (err: any) {
      setError(err?.message || 'Erro na busca');
    } finally {
      setLoading(false);
    }
  }

  if (!auth.token) {
    return (
      <div>
        <h1>🔍 Análise de Jogadores</h1>
        <div className="card">
          <p>Você precisa estar logado para buscar análises de jogadores com IA.</p>
          <div style={{ marginTop: 12 }}>
            <button className="btn btn-primary" onClick={() => navigate('/login')}>Entrar / Registrar</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1>🔍 Análise de Jogadores</h1>
      <div className="card" style={{ marginBottom: 16, padding: 12, background: 'rgba(255, 255, 255, 0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>ℹ️</span>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Pesquisa fictícia por enquanto — em breve integraremos dados reais.
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
        <div className="card">
          <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{ fontSize: 13, fontWeight: 700 }}>Buscar Jogador</label>
            <input
              type="text"
              placeholder="Ex: jogador_exemplo"
              value={playerName}
              onChange={(e) => { setPlayerName(e.target.value); setError(null); }}
              className="search-input"
              style={{ marginBottom: 4 }}
            />
            <label style={{ fontSize: 13, fontWeight: 700 }}>Site de Poker</label>
            <select
              value={site}
              onChange={(e) => setSite(e.target.value)}
              className="search-input"
              style={{ marginBottom: 8, padding: '8px 12px', borderRadius: 6, background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            >
              <option value="pokerstars">PokerStars</option>
              <option value="partypoker">Party Poker</option>
              <option value="888poker">888poker</option>
              <option value="betfair">Betfair Poker</option>
            </select>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" disabled={loading || !playerName.trim()} type="submit">
                {loading ? 'Buscando...' : '🔍 Buscar'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => { setPlayerName(''); setResult(null); setError(null); }}>
                Limpar
              </button>
            </div>
          </form>

          {error && <div style={{ marginTop: 12, padding: 10, background: 'rgba(239, 68, 68, 0.1)', borderRadius: 6, color: 'var(--accent-red)', fontSize: 13 }}>{error}</div>}
        </div>

        <div className="card">
          <h4 style={{ marginBottom: 12 }}>📋 Histórico</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
            {history.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>Nenhuma busca realizada</p>
            ) : (
              history.map((h, i) => (
                <button
                  key={i}
                  onClick={() => { setResult(h); setPlayerName(h.player); }}
                  style={{
                    padding: '8px 10px',
                    background: result?.player === h.player ? 'rgba(124, 58, 237, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    border: result?.player === h.player ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                    borderRadius: 6,
                    color: 'var(--text-primary)',
                    textAlign: 'left',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  {h.player}
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {result && (
        <div className="card">
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h2 style={{ marginBottom: 4 }}>{result.player}</h2>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', borderRadius: 999, padding: '4px 8px' }}>Modo Demo</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
              {result.site === 'pokerstars' ? 'PokerStars' : result.site} • Visualizações: Inscreva-se
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border-color)', marginBottom: 20, overflowX: 'auto' }}>
            <button onClick={() => setActiveTab('graficos')} style={{ padding: '10px 14px', borderBottom: activeTab === 'graficos' ? '2px solid var(--accent-primary)' : 'none', cursor: 'pointer', background: 'transparent', color: activeTab === 'graficos' ? 'var(--accent-primary)' : 'var(--text-secondary)', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>📊 Gráficos</button>
            <button onClick={() => setActiveTab('torneios')} style={{ padding: '10px 14px', borderBottom: activeTab === 'torneios' ? '2px solid var(--accent-primary)' : 'none', cursor: 'pointer', background: 'transparent', color: activeTab === 'torneios' ? 'var(--accent-primary)' : 'var(--text-secondary)', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>🏆 Torneios</button>
            <button onClick={() => setActiveTab('desmembramento')} style={{ padding: '10px 14px', borderBottom: activeTab === 'desmembramento' ? '2px solid var(--accent-primary)' : 'none', cursor: 'pointer', background: 'transparent', color: activeTab === 'desmembramento' ? 'var(--accent-primary)' : 'var(--text-secondary)', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>📈 Desmembramento</button>
            <button onClick={() => setActiveTab('estatisticas')} style={{ padding: '10px 14px', borderBottom: activeTab === 'estatisticas' ? '2px solid var(--accent-primary)' : 'none', cursor: 'pointer', background: 'transparent', color: activeTab === 'estatisticas' ? 'var(--accent-primary)' : 'var(--text-secondary)', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>📊 Estatísticas</button>
            <button onClick={() => setActiveTab('conquistas')} style={{ padding: '10px 14px', borderBottom: activeTab === 'conquistas' ? '2px solid var(--accent-primary)' : 'none', cursor: 'pointer', background: 'transparent', color: activeTab === 'conquistas' ? 'var(--accent-primary)' : 'var(--text-secondary)', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>🎖️ Conquistas</button>
            <button onClick={() => setActiveTab('intuicoes')} style={{ padding: '10px 14px', borderBottom: activeTab === 'intuicoes' ? '2px solid var(--accent-primary)' : 'none', cursor: 'pointer', background: 'transparent', color: activeTab === 'intuicoes' ? 'var(--accent-primary)' : 'var(--text-secondary)', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>💡 Intuições</button>
            <button onClick={() => setActiveTab('relatorios')} style={{ padding: '10px 14px', borderBottom: activeTab === 'relatorios' ? '2px solid var(--accent-primary)' : 'none', cursor: 'pointer', background: 'transparent', color: activeTab === 'relatorios' ? 'var(--accent-primary)' : 'var(--text-secondary)', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>📄 Relatórios</button>
          </div>

          {activeTab === 'graficos' && (
            <div>
              <h3>Estatísticas Principais</h3>
              <div style={{ padding: 12, background: 'rgba(255, 255, 255, 0.04)', borderRadius: 8, marginBottom: 16 }}>
                <SimpleBars
                  data={[
                    { label: 'VPIP', value: Number(result.stats?.vpip ?? 0), color: '#8b5cf6' },
                    { label: 'PFR', value: Number(result.stats?.pfr ?? 0), color: '#06b6d4' },
                    { label: 'AF', value: Number(result.stats?.aggression_factor ?? 0) * 100, color: '#10b981' },
                  ]}
                  max={100}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 20 }}>
                <StatCard title="VPIP" value={`${result.stats?.vpip ?? 0}%`} bg="rgba(124, 58, 237, 0.1)" />
                <StatCard title="PFR" value={`${result.stats?.pfr ?? 0}%`} bg="rgba(6, 182, 212, 0.1)" />
                <StatCard title="AF" value={`${result.stats?.aggression_factor ?? 0}`} bg="rgba(16, 185, 129, 0.1)" />
              </div>
              <div style={{ padding: 16, background: 'rgba(255, 255, 255, 0.05)', borderRadius: 8 }}>
                <h4>Análise da IA</h4>
                <p style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{result.analysis}</p>
              </div>
            </div>
          )}

          {activeTab === 'torneios' && (
            <div>
              <h3>🏆 Desempenho em Torneios</h3>
              <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
                <div style={{ padding: 14, background: 'rgba(124, 58, 237, 0.1)', borderRadius: 8, flex: 1 }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 4 }}>ROI Médio</div>
                  <div style={{ fontSize: 24, fontWeight: 800 }}>{result.stats?.roi ?? 0}%</div>
                </div>
                <div style={{ padding: 14, background: 'rgba(6, 182, 212, 0.1)', borderRadius: 8, flex: 1 }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 4 }}>ITM Rate</div>
                  <div style={{ fontSize: 24, fontWeight: 800 }}>{result.stats?.itm ?? 0}%</div>
                </div>
                <div style={{ padding: 14, background: 'rgba(16, 185, 129, 0.1)', borderRadius: 8, flex: 1 }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 4 }}>Lucro Total</div>
                  <div style={{ fontSize: 24, fontWeight: 800 }}>R$ {result.stats?.bb_won ?? 0}</div>
                </div>
              </div>
              <div style={{ padding: 16, background: 'rgba(255, 255, 255, 0.05)', borderRadius: 8, marginBottom: 16 }}>
                <h4 style={{ marginBottom: 8 }}>Tendência ROI / ITM</h4>
                <LineChart
                  series={[
                    { name: 'ROI', color: '#8b5cf6', values: (result.tournaments || []).map((t: any) => Number(t.roi || 0)) },
                    { name: 'ITM', color: '#06b6d4', values: (result.tournaments || []).map((t: any) => Number(t.itm || 0)) },
                  ]}
                  labels={(result.tournaments || []).map((t: any) => String(t.name || 'Torneio'))}
                  height={180}
                  max={100}
                />
              </div>
              <div style={{ padding: 16, background: 'rgba(255, 255, 255, 0.05)', borderRadius: 8 }}>
                <h4 style={{ marginBottom: 12 }}>Torneios Recentes</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {(result.tournaments || []).map((t: any, i: number) => (
                    <div key={i} style={{ padding: 12, background: 'rgba(255, 255, 255, 0.02)', borderRadius: 6, borderLeft: '3px solid var(--accent-primary)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t.site}</div>
                        </div>
                        <div style={{ textAlign: 'right', fontWeight: 600, color: t.profit > 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                          R$ {t.profit}
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)' }}>
                        <span>ROI: {t.roi}%</span>
                        <span>Posição: {t.placement}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'desmembramento' && (
            <div>
              <h3>📈 Desmembramento de Mãos</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
                <div style={{ padding: 14, background: 'rgba(255, 255, 255, 0.05)', borderRadius: 8 }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 8 }}>Total de Mãos</div>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>{(result.stats?.total_hands ?? 0).toLocaleString()}</div>
                </div>
                <div style={{ padding: 14, background: 'rgba(255, 255, 255, 0.05)', borderRadius: 8 }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 8 }}>VPIP %</div>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>{result.stats?.vpip ?? 0}%</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Voluntárias com $ no pote</div>
                </div>
                <div style={{ padding: 14, background: 'rgba(255, 255, 255, 0.05)', borderRadius: 8 }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 8 }}>PFR %</div>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>{result.stats?.pfr ?? 0}%</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Raise pré-flop</div>
                </div>
              </div>
              <div style={{ padding: 16, background: 'rgba(255, 255, 255, 0.05)', borderRadius: 8 }}>
                <h4 style={{ marginBottom: 12 }}>Distribuição de Mãos</h4>
                <ul style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                  {(result.improvements || []).map((it: string, i: number) => (
                    <li key={i} style={{ marginBottom: 8 }}>• {it}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'estatisticas' && (
            <div>
              <h3>Estatísticas Detalhadas</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <div style={{ padding: 12, background: 'rgba(255, 255, 255, 0.05)', borderRadius: 8 }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 8 }}>VPIP</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{result.stats?.vpip ?? 0}%</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Percentual de mãos jogadas</div>
                </div>
                <div style={{ padding: 12, background: 'rgba(255, 255, 255, 0.05)', borderRadius: 8 }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 8 }}>PFR</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{result.stats?.pfr ?? 0}%</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Agressividade pré-flop</div>
                </div>
                <div style={{ padding: 12, background: 'rgba(255, 255, 255, 0.05)', borderRadius: 8 }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 8 }}>AF</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{result.stats?.aggression_factor ?? 0}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Nível de agressividade</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'conquistas' && (
            <div>
              <h3>🎖️ Conquistas</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
                <div style={{ padding: 14, background: 'rgba(16, 185, 129, 0.1)', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>🎯</div>
                  <div style={{ fontWeight: 600, fontSize: 12 }}>Analista de Dados</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Enviou primeira análise</div>
                </div>
                <div style={{ padding: 14, background: 'rgba(124, 58, 237, 0.1)', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>📈</div>
                  <div style={{ fontWeight: 600, fontSize: 12 }}>Em Desenvolvimento</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Continue analisando</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'intuicoes' && (
            <div>
              <h3>💡 Intuições & Insights</h3>
              <div style={{ padding: 16, background: 'rgba(255, 255, 255, 0.05)', borderRadius: 8 }}>
                <h4 style={{ marginBottom: 12 }}>Pontos de Melhoria</h4>
                <ul style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
                  {(result.improvements || []).map((it: string, i: number) => (
                    <li key={i} style={{ marginBottom: 8 }}>→ {it}</li>
                  ))}
                </ul>
                <h4 style={{ marginBottom: 12 }}>Vazamentos (Leaks)</h4>
                <ul style={{ color: 'var(--text-secondary)' }}>
                  {(result.leaks || []).map((it: string, i: number) => (
                    <li key={i} style={{ marginBottom: 8 }}>⚠️ {it}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'relatorios' && (
            <div>
              <h3>📄 Relatórios</h3>
              <div style={{ padding: 16, background: 'rgba(255, 255, 255, 0.05)', borderRadius: 8 }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 12, whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                  {result.analysis}
                </p>
                <div style={{ marginTop: 16, fontSize: 12, color: 'var(--text-muted)', padding: 12, background: 'rgba(0, 0, 0, 0.3)', borderRadius: 6 }}>
                  ℹ️ Dados gerados com IA. Integre API real (SharkScope, PokerStars, etc) para dados em tempo real.
                </div>
                <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                  Créditos restantes: {typeof result.remaining !== 'undefined' ? (result.remaining === -1 ? 'Ilimitado (Premium)' : result.remaining) : '0'}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * SimpleBars: gráfico de barras SVG leve, sem dependências.
 */
function SimpleBars({ data, max = 100, height = 160 }: { data: { label: string; value: number; color?: string }[]; max?: number; height?: number }) {
  const width = 520;
  const padding = 24;
  const barGap = 10;
  const barWidth = Math.max(20, Math.floor((width - padding * 2 - barGap * (data.length - 1)) / data.length));
  const scale = (v: number) => Math.max(0, Math.min(1, v / max)) * (height - 30);
  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width={width} height={height} style={{ maxWidth: '100%' }}>
        {data.map((d, i) => {
          const h = scale(isFinite(d.value) ? d.value : 0);
          const x = padding + i * (barWidth + barGap);
          const y = height - h - 20;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barWidth} height={h} rx={6} fill={d.color || 'rgba(124, 58, 237, 0.8)'} />
              <text x={x + barWidth / 2} y={height - 6} textAnchor="middle" fontSize="12" fill="var(--text-secondary)">{d.label}</text>
              <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" fontSize="12" fill="var(--text-primary)" fontWeight={700}>
                {isFinite(d.value) ? (Math.round(d.value * 10) / 10) : 0}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function StatCard({ title, value, bg }: { title: string; value: string; bg: string }) {
  return (
    <div style={{ padding: 12, background: bg, borderRadius: 8 }}>
      <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{title}</div>
      <div style={{ fontSize: 22, fontWeight: 800 }}>{value}</div>
    </div>
  );
}

/**
 * LineChart: gráfico de linhas SVG para múltiplas séries (ROI/ITM).
 */
function LineChart({ series, labels, height = 180, max = 100 }: {
  series: { name: string; color: string; values: number[] }[];
  labels: string[];
  height?: number;
  max?: number;
}) {
  const width = Math.max(520, labels.length * 120);
  const padding = 28;
  const chartW = width - padding * 2;
  const chartH = height - padding * 2;
  const xStep = labels.length > 1 ? chartW / (labels.length - 1) : chartW;
  const scaleY = (v: number) => chartH - Math.max(0, Math.min(1, v / max)) * chartH;
  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width={width} height={height} style={{ maxWidth: '100%' }}>
        {/* Eixos */}
        <g transform={`translate(${padding}, ${padding})`}>
          <line x1={0} y1={chartH} x2={chartW} y2={chartH} stroke="rgba(255,255,255,0.2)" />
          {/* Labels no eixo X */}
          {labels.map((lab, i) => (
            <text key={i} x={i * xStep} y={chartH + 16} fontSize="11" fill="var(--text-muted)" textAnchor="middle">{lab}</text>
          ))}
          {/* Séries */}
          {series.map((s, si) => {
            const points = s.values.map((v, i) => ({ x: i * xStep, y: scaleY(isFinite(v) ? v : 0) }));
            const path = points.map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`)).join(' ');
            return (
              <g key={si}>
                <path d={path} fill="none" stroke={s.color} strokeWidth={2} />
                {points.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r={3} fill={s.color} />
                ))}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
