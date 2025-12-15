import React, { useState } from 'react';

type PlayerSummary = {
  id: string;
  nickname: string;
  totalProfit: number;
  roi: number;
  gamesPlayed: number;
  country: string;
  room: string;
  network: string;
};

type PlayerStats = {
  id: string;
  nickname: string;
  totalProfit: number;
  roi: number;
  gamesPlayed: number;
  averageBuyin: number;
  winRate: number;
  vpip: number;
  pfr: number;
  profitTrend: number[];
};

const API_BASE = (import.meta && (import.meta as any).env && (import.meta as any).env.VITE_API_BASE) || 'http://localhost:3000';

export default function PlayerSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlayerSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<PlayerStats | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [historyLimit] = useState(20);
  const [historyOffset, setHistoryOffset] = useState(0);
  const [historyHasMore, setHistoryHasMore] = useState(true);
  const [filterType, setFilterType] = useState<string>('');
  const [filterRoom, setFilterRoom] = useState<string>('');
  const [activeTab, setActiveTab] = useState('graficos');
  const [networks, setNetworks] = useState<any[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<string>('');

  React.useEffect(() => {
    // Carregar lista de redes disponíveis
    async function loadNetworks() {
      try {
        const res = await fetch(`${API_BASE}/api/players/networks`);
        const json = await res.json();
        setNetworks(json.networks || []);
        if (json.networks && json.networks.length > 0) {
          setSelectedNetwork(json.networks[0].name);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadNetworks();
  }, []);

  async function doSearch(e?: React.FormEvent) {
    e?.preventDefault();
    if (!query) return;
    setLoading(true);
    try {
      const roomParam = selectedNetwork ? `&room=${encodeURIComponent(selectedNetwork)}` : '';
      const res = await fetch(`${API_BASE}/api/players?q=${encodeURIComponent(query)}${roomParam}`);
      const json = await res.json();
      setResults(json.results || []);
    } catch (err) {
      console.error(err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  async function openPlayer(id: string) {
    setSelected(null);
    setHistory([]);
    try {
      const [sRes, rRes] = await Promise.all([
        fetch(`${API_BASE}/api/players/${id}/stats`),
        fetch(`${API_BASE}/api/players/${id}/results?limit=${historyLimit}&offset=0&type=${encodeURIComponent(filterType)}&room=${encodeURIComponent(filterRoom)}`),
      ]);

      const sJson = await sRes.json();
      const rJson = await rRes.json();

      setSelected(sJson.stats || null);
      setHistory(rJson.results || []);
      setHistoryOffset((rJson.results || []).length);
      setHistoryHasMore((rJson.results || []).length >= historyLimit);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadMoreHistory(playerId: string) {
    try {
      const rRes = await fetch(`${API_BASE}/api/players/${playerId}/results?limit=${historyLimit}&offset=${historyOffset}&type=${encodeURIComponent(filterType)}&room=${encodeURIComponent(filterRoom)}`);
      const rJson = await rRes.json();
      const newItems = rJson.results || [];
      setHistory((prev) => [...prev, ...newItems]);
      setHistoryOffset((prev) => prev + newItems.length);
      if (newItems.length < historyLimit) setHistoryHasMore(false);
    } catch (err) {
      console.error(err);
    }
  }

  React.useEffect(() => {
    if (selected) {
      openPlayer(selected.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType, filterRoom]);

  return (
    <div className="container">
      <h1>🎯 Pesquisa de Jogadores</h1>

      <div className="grid cols-3" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
        {/* Left: Search & Results */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 18, fontWeight: 700 }}>🔍</span>
            <h3 style={{ margin: 0, fontSize: 16 }}>Buscar</h3>
          </div>

          <form onSubmit={doSearch} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6, fontWeight: 600 }}>Plataforma</label>
              <select
                value={selectedNetwork}
                onChange={(e) => setSelectedNetwork(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                }}
              >
                {networks.map((net) => (
                  <option key={net.id} value={net.name}>
                    {net.name}
                  </option>
                ))}
              </select>
            </div>

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Digite o nick do jogador"
              className="search-input"
            />
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
              {loading ? '⏳ Buscando...' : '🔎 Buscar'}
            </button>
          </form>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
            <h3 style={{ fontSize: 14, marginBottom: 12, color: 'var(--text-muted)' }}>RESULTADOS ({results.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '500px', overflowY: 'auto' }}>
              {results.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>Nenhum resultado</div>}
              {results.map((p) => (
                <button
                  key={p.id}
                  onClick={() => openPlayer(p.id)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 12,
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.06)',
                    background: selected?.id === p.id ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.02)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(124,58,237,0.1)';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(124,58,237,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    if (selected?.id !== p.id) {
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.02)';
                      (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.06)';
                    }
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{p.nickname}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {p.room} • {p.network}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--accent-green)' }}>+{p.roi.toFixed(1)}%</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.gamesPlayed}J</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Player Details */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {!selected && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎮</div>
              <div style={{ fontSize: 16 }}>Selecione um jogador para ver estatísticas detalhadas</div>
            </div>
          )}

          {selected && (
            <>
              {/* Player Header */}
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 14,
                    background: `linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: 32,
                    color: 'white',
                    boxShadow: '0 8px 24px rgba(124, 58, 237, 0.3)',
                  }}
                >
                  {selected.nickname.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontSize: 24, marginBottom: 8 }}>{selected.nickname}</h2>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Lucro</span>
                      <span style={{ fontWeight: 700, color: 'var(--accent-green)', fontSize: 14, fontFamily: 'Space Mono' }}>
                        R${Math.abs(selected.totalProfit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ padding: '8px 12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 8, fontSize: 12, fontWeight: 600, color: 'var(--accent-green)' }}>
                      ROI: {selected.roi.toFixed(1)}%
                    </div>
                    <div style={{ padding: '8px 12px', background: 'rgba(124, 58, 237, 0.1)', borderRadius: 8, fontSize: 12, fontWeight: 600, color: 'var(--accent-primary)' }}>
                      {selected.gamesPlayed} jogos
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs Navigation */}
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 24, overflowX: 'auto', paddingBottom: 12 }}>
                {[
                  { id: 'graficos', label: '📊 Gráficos' },
                  { id: 'torneios', label: '🏆 Torneios' },
                  { id: 'desmembramento', label: '📈 Desmembramento' },
                  { id: 'estatisticas', label: '📋 Estatísticas' },
                  { id: 'conquistas', label: '🎖️ Conquistas' },
                  { id: 'intuicoes', label: '💡 Intuições' },
                  { id: 'relatorios', label: '📄 Relatórios' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      padding: '8px 0',
                      background: 'none',
                      border: 'none',
                      color: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      borderBottom: activeTab === tab.id ? '2px solid var(--accent-primary)' : 'transparent',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: activeTab === tab.id ? 700 : 500,
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div>
                {activeTab === 'graficos' && (
                  <div>
                    <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 700 }}>📊 Gráficos de Performance</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div style={{
                        height: 200,
                        background: 'linear-gradient(180deg, rgba(124, 58, 237, 0.05), rgba(6, 182, 212, 0.05))',
                        borderRadius: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-muted)',
                        fontSize: 13,
                      }}>
                        Gráfico de Lucro (últimas 12 sessões)
                      </div>
                      <div style={{
                        height: 200,
                        background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.05), rgba(124, 58, 237, 0.05))',
                        borderRadius: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-muted)',
                        fontSize: 13,
                      }}>
                        Taxa de Ganho ao Longo do Tempo
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'torneios' && (
                  <div>
                    <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 700 }}>🏆 Histórico de Torneios</h3>
                    <table style={{ width: '100%' }}>
                      <thead>
                        <tr>
                          <th>Data</th>
                          <th>Torneio</th>
                          <th style={{ textAlign: 'right' }}>Buy-in</th>
                          <th style={{ textAlign: 'right' }}>Prêmio</th>
                          <th style={{ textAlign: 'right' }}>Resultado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.length === 0 ? (
                          <tr><td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Nenhum torneio encontrado</td></tr>
                        ) : (
                          history.map((r) => (
                            <tr key={r.id}>
                              <td style={{ fontSize: 12 }}>{new Date(r.date).toLocaleDateString('pt-BR')}</td>
                              <td style={{ fontSize: 12 }}>{r.tournament}</td>
                              <td style={{ textAlign: 'right', fontSize: 12 }}>R${r.buyin.toFixed(0)}</td>
                              <td style={{ textAlign: 'right', fontSize: 12, color: 'var(--accent-green)' }}>R${r.prize.toFixed(0)}</td>
                              <td style={{ textAlign: 'right', fontWeight: 700, color: r.net >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                                {r.net > 0 ? '+' : ''}{r.net.toFixed(0)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTab === 'desmembramento' && (
                  <div>
                    <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 700 }}>📈 Desmembramento por Tipo</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div style={{ padding: 16, background: 'rgba(124, 58, 237, 0.08)', borderRadius: 10 }}>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>MTT</div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent-primary)' }}>R${Math.floor(selected.totalProfit * 0.6).toLocaleString('pt-BR')}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>~60% do lucro</div>
                      </div>
                      <div style={{ padding: 16, background: 'rgba(6, 182, 212, 0.08)', borderRadius: 10 }}>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>SNG</div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent-secondary)' }}>R${Math.floor(selected.totalProfit * 0.4).toLocaleString('pt-BR')}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>~40% do lucro</div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'estatisticas' && (
                  <div>
                    <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 700 }}>📋 Estatísticas Detalhadas</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                      <div className="card" style={{ padding: 16, background: 'rgba(124, 58, 237, 0.08)' }}>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6 }}>Win Rate</div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent-primary)' }}>{selected.winRate}%</div>
                      </div>
                      <div className="card" style={{ padding: 16, background: 'rgba(6, 182, 212, 0.08)' }}>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6 }}>VPIP</div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent-secondary)' }}>{selected.vpip}%</div>
                      </div>
                      <div className="card" style={{ padding: 16, background: 'rgba(16, 185, 129, 0.08)' }}>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6 }}>PFR</div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent-green)' }}>{selected.pfr}%</div>
                      </div>
                      <div className="card" style={{ padding: 16, background: 'rgba(239, 68, 68, 0.08)' }}>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6 }}>Jogos</div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent-red)' }}>{selected.gamesPlayed}</div>
                      </div>
                      <div className="card" style={{ padding: 16, background: 'rgba(160, 174, 192, 0.08)' }}>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6 }}>Buy-in Médio</div>
                        <div style={{ fontSize: 18, fontWeight: 700 }}>R${selected.averageBuyin.toFixed(0)}</div>
                      </div>
                      <div className="card" style={{ padding: 16, background: 'rgba(34, 197, 94, 0.08)' }}>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6 }}>ROI</div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent-green)' }}>{selected.roi.toFixed(1)}%</div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'conquistas' && (
                  <div>
                    <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 700 }}>🎖️ Conquistas & Medalhas</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
                      <div style={{ padding: 16, background: 'rgba(124, 58, 237, 0.1)', borderRadius: 10, textAlign: 'center', border: '2px solid rgba(124, 58, 237, 0.3)' }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>🥇</div>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>1º Lugar</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>5 vitórias</div>
                      </div>
                      <div style={{ padding: 16, background: 'rgba(6, 182, 212, 0.1)', borderRadius: 10, textAlign: 'center', border: '2px solid rgba(6, 182, 212, 0.3)' }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>🏆</div>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>Campeonato</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>2 títulos</div>
                      </div>
                      <div style={{ padding: 16, background: 'rgba(16, 185, 129, 0.1)', borderRadius: 10, textAlign: 'center', border: '2px solid rgba(16, 185, 129, 0.3)' }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>🚀</div>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>Grande Lucro</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>+R$10K</div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'intuicoes' && (
                  <div>
                    <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 700 }}>💡 Intuições & Análises</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ padding: 16, background: 'rgba(124, 58, 237, 0.08)', borderRadius: 10, borderLeft: '4px solid var(--accent-primary)' }}>
                        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Melhor Desempenho</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Seu melhor desempenho é em torneios MTT com buy-in entre R$50-100</div>
                      </div>
                      <div style={{ padding: 16, background: 'rgba(6, 182, 212, 0.08)', borderRadius: 10, borderLeft: '4px solid var(--accent-secondary)' }}>
                        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Padrão Identificado</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Você tem consistência em suas vitórias. ROI acima da média!</div>
                      </div>
                      <div style={{ padding: 16, background: 'rgba(16, 185, 129, 0.08)', borderRadius: 10, borderLeft: '4px solid var(--accent-green)' }}>
                        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Recomendação</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Aumente o buy-in para maximizar seus lucros nessa faixa</div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'relatorios' && (
                  <div>
                    <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 700 }}>📄 Relatórios</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div style={{ padding: 16, background: 'rgba(124, 58, 237, 0.08)', borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={(e) => { (e.currentTarget as any).style.background = 'rgba(124, 58, 237, 0.12)'; }} onMouseLeave={(e) => { (e.currentTarget as any).style.background = 'rgba(124, 58, 237, 0.08)'; }}>
                        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>📊 Relatório Mensal</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>Análise completa do mês</div>
                        <button style={{ width: '100%', padding: '6px 12px', background: 'var(--accent-primary)', border: 'none', color: 'white', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>Baixar PDF</button>
                      </div>
                      <div style={{ padding: 16, background: 'rgba(6, 182, 212, 0.08)', borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={(e) => { (e.currentTarget as any).style.background = 'rgba(6, 182, 212, 0.12)'; }} onMouseLeave={(e) => { (e.currentTarget as any).style.background = 'rgba(6, 182, 212, 0.08)'; }}>
                        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>📈 Relatório Anual</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>Resumo de todo o ano</div>
                        <button style={{ width: '100%', padding: '6px 12px', background: 'var(--accent-secondary)', border: 'none', color: 'white', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>Baixar PDF</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
