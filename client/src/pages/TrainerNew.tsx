import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = (import.meta && (import.meta as any).env && (import.meta as any).env.VITE_API_BASE) || 'http://localhost:3000';

// 📋 POSIÇÕES POR MESA
const posicoesPorMesa = {
  'heads-up': ['BTN', 'BB'],
  '6-max': ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'],
  '9-max': ['UTG', 'UTG+1', 'MP', 'HJ', 'CO', 'BTN', 'SB', 'BB'],
} as const;

export default function TrainingLab() {
  const auth = useAuth();

  // 🟦 ESTADOS GLOBAIS
  const [iaAtiva, setIaAtiva] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [treinosRestantes, setTreinosRestantes] = useState<number | null>(null);

  // 🟦 CONFIGURAÇÕES DO TREINO
  const [mesa, setMesa] = useState<'heads-up' | '6-max' | '9-max'>('6-max');
  const [posicao, setPosicao] = useState<string>('CO');
  const [tipoJogo, setTipoJogo] = useState('MTT');
  const [street, setStreet] = useState<'preflop' | 'flop' | 'turn' | 'river'>('preflop');
  const [acaoPreflop, setAcaoPreflop] = useState('Raise');
  const [acaoPostflop, setAcaoPostflop] = useState('Bet');

  // 🟦 CENÁRIO GERADO
  const [cenario, setCenario] = useState<any>(null);
  const [analiseIA, setAnaliseIA] = useState<string>('');

  // 🔄 RESET POSIÇÃO ao trocar MESA
  useEffect(() => {
    const validPositions = posicoesPorMesa[mesa];
    if (!validPositions.includes(posicao as any)) {
      setPosicao(validPositions[0]);
    }
  }, [mesa]);

  // 🔄 RESET AÇÃO ao trocar STREET
  useEffect(() => {
    if (street === 'preflop') {
      setAcaoPreflop('Raise');
    } else {
      setAcaoPostflop('Bet');
    }
  }, [street]);

  // 🔄 CARREGAR TREINOS RESTANTES
  useEffect(() => {
    if (auth.user) {
      const restantes = (auth.user as any).usosRestantes ?? auth.user.credits ?? 0;
      setTreinosRestantes(restantes === -1 ? null : restantes);
    }
  }, [auth.user]);

  // 🟦 REGRA DE VALIDAÇÃO
  const podeGerar =
    iaAtiva &&
    mesa &&
    posicao &&
    street &&
    tipoJogo &&
    (treinosRestantes === null || treinosRestantes > 0) &&
    !isLoading &&
    !!auth.user;

  // 🟦 FUNÇÃO GERAR SITUAÇÃO
  async function gerarSituacao(e: React.FormEvent) {
    e.preventDefault();
    
    if (!podeGerar) return;

    try {
      setIsLoading(true);
      setErro(null);
      setCenario(null);
      setAnaliseIA('');

      const action = street === 'preflop' ? acaoPreflop : acaoPostflop;

      const res = await fetch(`${API_BASE}/api/trainer/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({
          table: mesa,
          position: posicao,
          gameType: tipoJogo,
          street: street === 'preflop' ? 'Pré-flop' : street.charAt(0).toUpperCase() + street.slice(1),
          action,
        }),
      });

      const data = await res.json();

      if (!data.ok) {
        throw new Error(data.message || 'Erro ao gerar situação');
      }

      setCenario(data.scenario);

      // Atualizar treinos restantes
      if (auth.user) {
        const newRestantes = treinosRestantes !== null ? treinosRestantes - 1 : null;
        setTreinosRestantes(newRestantes);
      }

      // Chamar análise IA se ativa
      if (iaAtiva && data.scenario) {
        await buscarAnaliseIA(data.scenario);
      }
    } catch (err: any) {
      setErro(err.message || 'Erro ao gerar situação');
    } finally {
      setIsLoading(false);
    }
  }

  // 🟦 BUSCAR ANÁLISE IA
  async function buscarAnaliseIA(scenario: any) {
    try {
      const res = await fetch(`${API_BASE}/api/trainer/ai-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario }),
      });

      const data = await res.json();
      if (data.ok && data.analysis) {
        setAnaliseIA(data.analysis);
      }
    } catch (err) {
      console.error('Erro ao buscar análise IA:', err);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', padding: '40px 20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* HEADER */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 36, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
            ✏️ Training Lab AI
          </h1>
          <button
            onClick={() => setIaAtiva(v => !v)}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: iaAtiva ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)' : '#374151',
              color: 'white',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {iaAtiva ? '🤖 IA Ativa' : '🤖 Ativar IA'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 32 }}>
          {/* COLUNA ESQUERDA - CONFIGURAÇÕES */}
          <div
            style={{
              background: 'var(--card-background)',
              borderRadius: 12,
              padding: 24,
              border: '1px solid var(--border-color)',
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              ⚙️ Configurações
            </h2>

            <form onSubmit={gerarSituacao} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* MESA */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  🪑 Mesa
                </label>
                <select
                  value={mesa}
                  onChange={e => setMesa(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border-color)',
                    background: 'var(--input-background)',
                    color: 'var(--text-primary)',
                    fontSize: 14,
                  }}
                >
                  <option value="heads-up">Heads-up</option>
                  <option value="6-max">6-max</option>
                  <option value="9-max">9-max</option>
                </select>
              </div>

              {/* POSIÇÃO */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  📍 Posição
                </label>
                <select
                  value={posicao}
                  onChange={e => setPosicao(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border-color)',
                    background: 'var(--input-background)',
                    color: 'var(--text-primary)',
                    fontSize: 14,
                  }}
                >
                  {posicoesPorMesa[mesa].map(p => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              {/* TIPO DE JOGO */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  🎮 Tipo de jogo
                </label>
                <input
                  value={tipoJogo}
                  onChange={e => setTipoJogo(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border-color)',
                    background: 'var(--input-background)',
                    color: 'var(--text-primary)',
                    fontSize: 14,
                  }}
                />
              </div>

              {/* STREET */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  🃏 Street
                </label>
                <select
                  value={street}
                  onChange={e => setStreet(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border-color)',
                    background: 'var(--input-background)',
                    color: 'var(--text-primary)',
                    fontSize: 14,
                  }}
                >
                  <option value="preflop">Pré-flop</option>
                  <option value="flop">Flop</option>
                  <option value="turn">Turn</option>
                  <option value="river">River</option>
                </select>
              </div>

              {/* AÇÃO (CONDICIONAL) */}
              {street === 'preflop' ? (
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    ⚡ Ação pré-flop
                  </label>
                  <select
                    value={acaoPreflop}
                    onChange={e => setAcaoPreflop(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--border-color)',
                      background: 'var(--input-background)',
                      color: 'var(--text-primary)',
                      fontSize: 14,
                    }}
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
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    🎲 Ação da Street
                  </label>
                  <select
                    value={acaoPostflop}
                    onChange={e => setAcaoPostflop(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--border-color)',
                      background: 'var(--input-background)',
                      color: 'var(--text-primary)',
                      fontSize: 14,
                    }}
                  >
                    <option value="Bet">Bet</option>
                    <option value="Check">Check</option>
                    <option value="Call">Call</option>
                    <option value="Raise">Raise</option>
                    <option value="Fold">Fold</option>
                  </select>
                </div>
              )}

              {/* BOTÃO GERAR */}
              <button
                type="submit"
                disabled={!podeGerar}
                style={{
                  marginTop: 8,
                  padding: '14px 24px',
                  borderRadius: 8,
                  border: 'none',
                  background: podeGerar
                    ? 'linear-gradient(90deg, #8b5cf6 0%, #7c3aed 100%)'
                    : '#374151',
                  color: 'white',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: podeGerar ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                  opacity: podeGerar ? 1 : 0.5,
                }}
              >
                {isLoading ? '⏳ Gerando situação...' : '✨ Gerar Situação'}
              </button>

              {/* TREINOS RESTANTES */}
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center' }}>
                💎 Treinos restantes:{' '}
                <strong style={{ color: 'var(--text-primary)' }}>
                  {treinosRestantes === null ? 'Ilimitado' : treinosRestantes}
                </strong>
              </div>

              {/* ERRO */}
              {erro && (
                <div
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#991b1b',
                    fontSize: 13,
                  }}
                >
                  ❌ {erro}
                </div>
              )}
            </form>
          </div>

          {/* COLUNA DIREITA - RESULTADO */}
          <div>
            {cenario ? (
              <div
                style={{
                  background: 'var(--card-background)',
                  borderRadius: 12,
                  padding: 24,
                  border: '1px solid var(--border-color)',
                }}
              >
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>🎯 Situação Gerada</h2>

                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Posição</div>
                      <div style={{ fontSize: 16, fontWeight: 600 }}>{cenario.position}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Mesa</div>
                      <div style={{ fontSize: 16, fontWeight: 600 }}>{cenario.table}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Street</div>
                      <div style={{ fontSize: 16, fontWeight: 600 }}>{cenario.street}</div>
                    </div>
                  </div>

                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Suas cartas</div>
                    <div style={{ fontSize: 24, fontWeight: 700 }}>{cenario.heroCards?.join(' ') || 'N/A'}</div>
                  </div>

                  {cenario.board && cenario.board.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Board</div>
                      <div style={{ fontSize: 24, fontWeight: 700 }}>{cenario.board.join(' ')}</div>
                    </div>
                  )}

                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Ação GTO</div>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: '#10b981',
                        padding: '8px 12px',
                        background: '#d1fae5',
                        borderRadius: 6,
                        display: 'inline-block',
                      }}
                    >
                      {cenario.correctAction}
                    </div>
                  </div>
                </div>

                {/* ANÁLISE IA */}
                {iaAtiva && analiseIA && (
                  <div
                    style={{
                      marginTop: 24,
                      padding: 16,
                      background: '#f3f4f6',
                      borderRadius: 8,
                      border: '1px solid #e5e7eb',
                    }}
                  >
                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: '#1f2937' }}>🤖 Análise IA</h3>
                    <div style={{ fontSize: 14, lineHeight: 1.6, color: '#374151', whiteSpace: 'pre-wrap' }}>
                      {analiseIA}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div
                style={{
                  background: 'var(--card-background)',
                  borderRadius: 12,
                  padding: 60,
                  border: '1px solid var(--border-color)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Gere uma situação para treinar</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                  Configure e clique em "Gerar Situação"
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
