import React, { useState, useEffect } from 'react';
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

// 📋 POSIÇÕES POR MESA
const posicoesPorMesa = {
  'heads-up': ['BTN', 'BB'],
  '6-max': ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'],
  '9-max': ['UTG', 'UTG+1', 'MP', 'HJ', 'CO', 'BTN', 'SB', 'BB'],
} as const;

export default function TrainingLab() {
  const auth = useAuth();

  // 🟦 ESTADOS GLOBAIS
  const [iaAtiva, setIaAtiva] = useState(false); // ✅ Desabilitado por padrão (evita erro 429)
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

  // 🔒 MENSAGEM DE BLOQUEIO CLARA
  const getMensagemBloqueio = (): string | null => {
    if (!auth.user) return '🔒 Faça login para começar';
    if (!iaAtiva) return '🤖 Ative a IA no botão acima';
    if (treinosRestantes !== null && treinosRestantes <= 0) return '💎 Sem créditos - Faça upgrade';
    if (isLoading) return '⏳ Gerando situação...';
    return null;
  };

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
        <div style={{ 
          marginBottom: 32,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 24px',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(124, 58, 237, 0.05) 100%)',
          borderRadius: 16,
          border: '1px solid rgba(139, 92, 246, 0.2)'
        }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 4, color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}>
              Laboratório de Treino
            </h1>
            <p style={{ fontSize: 14, color: '#a78bfa', margin: 0 }}>Treine situações reais de poker com análise profissional</p>
          </div>
          <button
            onClick={() => setIaAtiva(v => !v)}
            style={{
              padding: '10px 20px',
              borderRadius: 10,
              border: iaAtiva ? '2px solid #10b981' : '2px solid #6b7280',
              background: iaAtiva ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
              color: 'white',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s',
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: iaAtiva ? '0 4px 20px rgba(16, 185, 129, 0.4)' : 'none'
            }}
          >
            <span style={{ fontSize: 18 }}>🤖</span>
            {iaAtiva ? 'IA Ativa' : 'Ativar IA'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 32 }}>
          {/* COLUNA ESQUERDA - CONFIGURAÇÕES */}
          <div
            style={{
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              borderRadius: 16,
              padding: 28,
              border: '1px solid rgba(139, 92, 246, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10, color: 'white' }}>
              <span style={{ 
                background: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
                padding: '6px 10px',
                borderRadius: 8,
                fontSize: 16
              }}>⚙️</span>
              Configurações
            </h2>

            <form onSubmit={gerarSituacao} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* MESA */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#a78bfa', marginBottom: 8, letterSpacing: '0.5px' }}>
                  🪑 MESA
                </label>
                <select
                  value={mesa}
                  onChange={e => setMesa(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: '2px solid #334155',
                    background: '#0f172a',
                    color: 'white',
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                  onBlur={(e) => e.target.style.borderColor = '#334155'}
                >
                  <option value="heads-up">Heads-up</option>
                  <option value="6-max">6-max</option>
                  <option value="9-max">9-max</option>
                </select>
              </div>

              {/* POSIÇÃO */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#a78bfa', marginBottom: 8, letterSpacing: '0.5px' }}>
                  📍 POSIÇÃO
                </label>
                <select
                  value={posicao}
                  onChange={e => setPosicao(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: '2px solid #334155',
                    background: '#0f172a',
                    color: 'white',
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                  onBlur={(e) => e.target.style.borderColor = '#334155'}
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
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#a78bfa', marginBottom: 8, letterSpacing: '0.5px' }}>
                  🎮 TIPO DE JOGO
                </label>
                <input
                  value={tipoJogo}
                  onChange={e => setTipoJogo(e.target.value)}
                  placeholder="MTT, Cash Game, Sit&Go..."
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: '2px solid #334155',
                    background: '#0f172a',
                    color: 'white',
                    fontSize: 14,
                    fontWeight: 500,
                    transition: 'all 0.2s',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                  onBlur={(e) => e.target.style.borderColor = '#334155'}
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
                  marginTop: 16,
                  padding: '18px 28px',
                  borderRadius: 14,
                  border: 'none',
                  background: podeGerar
                    ? 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)'
                    : 'linear-gradient(135deg, #374151 0%, #1f2937 100%)',
                  color: 'white',
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: podeGerar ? 'pointer' : 'not-allowed',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  opacity: podeGerar ? 1 : 0.5,
                  boxShadow: podeGerar ? '0 8px 30px rgba(139, 92, 246, 0.4)' : 'none',
                  transform: 'scale(1)',
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  width: '100%'
                }}
                onMouseEnter={(e) => {
                  if (podeGerar) {
                    e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
                    e.currentTarget.style.boxShadow = '0 16px 40px rgba(139, 92, 246, 0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = podeGerar ? '0 8px 30px rgba(139, 92, 246, 0.4)' : 'none';
                }}
              >
                {isLoading ? (
                  <>
                    <span className="spinner"></span>
                    Gerando...
                  </>
                ) : (
                  '✨ Gerar Situação'
                )}
              </button>
              
              {/* MENSAGEM DE BLOQUEIO */}
              {!podeGerar && getMensagemBloqueio() && (
                <div style={{
                  marginTop: 12,
                  padding: 14,
                  borderRadius: 10,
                  background: 'rgba(251, 191, 36, 0.1)',
                  border: '1px solid rgba(251, 191, 36, 0.3)',
                  color: '#fbbf24',
                  fontSize: 14,
                  fontWeight: 500,
                  textAlign: 'center'
                }}>
                  {getMensagemBloqueio()}
                </div>
              )}

              {/* TREINOS RESTANTES */}
              <div style={{ 
                marginTop: 12,
                fontSize: 14, 
                color: treinosRestantes !== null && treinosRestantes <= 3 ? '#fbbf24' : 'var(--text-secondary)', 
                textAlign: 'center',
                fontWeight: 500
              }}>
                💎 Treinos:{' '}
                <strong style={{ 
                  color: treinosRestantes !== null && treinosRestantes <= 3 ? '#fbbf24' : '#a78bfa',
                  fontSize: 16
                }}>
                  {treinosRestantes === null ? '∞ Ilimitado' : treinosRestantes}
                </strong>
              </div>

              {/* ERRO */}
              {erro && (
                <div
                  style={{
                    marginTop: 12,
                    padding: 14,
                    borderRadius: 10,
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#ef4444',
                    fontSize: 14,
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  <span>❌</span> {erro}
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

                {/* MESA VISUAL */}
                <div style={{ 
                  position: 'relative', 
                  width: '100%', 
                  height: 400, 
                  background: 'linear-gradient(135deg, #1e3a2f 0%, #0d1f1a 100%)',
                  borderRadius: 200,
                  border: '8px solid #2d5a47',
                  marginBottom: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {/* CENTRO DA MESA - BOARD */}
                  <div style={{
                    textAlign: 'center',
                    background: 'rgba(0,0,0,0.3)',
                    padding: '16px 24px',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <div style={{ fontSize: 11, color: '#86efac', marginBottom: 8, fontWeight: 600 }}>
                      {cenario.street}
                    </div>
                    {cenario.board && cenario.board.length > 0 ? (
                      <div style={{ fontSize: 28, fontWeight: 700, color: 'white', letterSpacing: 4 }}>
                        {cenario.board.join(' ')}
                      </div>
                    ) : (
                      <div style={{ fontSize: 16, color: '#86efac', fontWeight: 600 }}>
                        Pré-flop
                      </div>
                    )}
                  </div>

                  {/* POSIÇÕES NA MESA */}
                  {posicoesPorMesa[mesa].map((pos, idx) => {
                    const total = posicoesPorMesa[mesa].length;
                    const angle = (idx / total) * 2 * Math.PI - Math.PI / 2;
                    const radius = 160;
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;
                    const isHero = pos === cenario.position;

                    return (
                      <div
                        key={pos}
                        style={{
                          position: 'absolute',
                          left: '50%',
                          top: '50%',
                          transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                          background: isHero 
                            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                            : 'rgba(0,0,0,0.4)',
                          border: isHero ? '3px solid #34d399' : '2px solid rgba(255,255,255,0.2)',
                          borderRadius: '50%',
                          width: 60,
                          height: 60,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 13,
                          fontWeight: 700,
                          color: 'white',
                          boxShadow: isHero ? '0 0 20px rgba(16, 185, 129, 0.5)' : 'none',
                        }}
                      >
                        {pos}
                      </div>
                    );
                  })}
                </div>

                {/* SUAS CARTAS */}
                <div style={{
                  background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                  padding: 20,
                  borderRadius: 12,
                  border: '2px solid #334155',
                  marginBottom: 20
                }}>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, fontWeight: 600 }}>
                    🃏 Suas cartas
                  </div>
                  <div style={{ fontSize: 32, fontWeight: 700, color: 'white', letterSpacing: 8 }}>
                    {cenario.heroCards?.join(' ') || 'N/A'}
                  </div>
                </div>

                {/* AÇÃO GTO */}
                <div style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  padding: 16,
                  borderRadius: 12,
                  border: '2px solid #34d399',
                  marginBottom: 20,
                  boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)'
                }}>
                  <div style={{ fontSize: 12, color: '#d1fae5', marginBottom: 4, fontWeight: 600 }}>
                    ✅ Ação GTO recomendada
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: 'white' }}>
                    {cenario.correctAction}
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
                  background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                  borderRadius: 16,
                  padding: 60,
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Efeito de glow */}
                <div style={{
                  position: 'absolute',
                  top: -50,
                  right: -50,
                  width: 200,
                  height: 200,
                  background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15), transparent)',
                  pointerEvents: 'none'
                }}></div>
                
                <div style={{ fontSize: 64, marginBottom: 24 }}>🎯</div>
                <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, color: 'white' }}>
                  Pronto para treinar?
                </h3>
                <p style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.6, maxWidth: 350, margin: '0 auto' }}>
                  {!auth.user ? (
                    <>Faça <strong style={{color: '#a78bfa'}}>login</strong> para começar</>
                  ) : !iaAtiva ? (
                    <>Clique em <strong style={{color: '#10b981'}}>IA Ativa</strong> acima para gerar situações</>
                  ) : (
                    <>Configure à esquerda e clique em <strong style={{color: '#a78bfa'}}>Gerar Situação</strong></>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
