import React, { useState, useEffect } from 'react';

interface RankingPlayer {
  rank: number;
  nickname: string;
  totalProfit: number;
  roi: number;
  gamesPlayed: number;
  winRate?: number;
  country: string;
  room: string;
  form?: 'hot' | 'cold' | 'neutral';
}

export default function Rankings() {
  const [rankingType, setRankingType] = useState<'profit' | 'roi' | 'volume' | 'winrate'>('profit');
  const [items, setItems] = useState<RankingPlayer[]>([]);

  const API_BASE = (import.meta && (import.meta as any).env && (import.meta as any).env.VITE_API_BASE) || 'http://localhost:3000';

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/api/players/rankings?by=${rankingType}&limit=20`);
        const json = await res.json();
        if (!cancelled) setItems(json.results || []);
      } catch (err) {
        console.error(err);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [rankingType]);

  const getFormBadgeColor = (form: string) => {
    switch (form) {
      case 'hot':
        return 'bg-red-100 text-red-800';
      case 'cold':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRankMedalColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'text-yellow-500';
      case 2:
        return 'text-gray-400';
      case 3:
        return 'text-orange-600';
      default:
        return 'text-slate-400';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="container">
      <div style={{ marginBottom: 32 }}>
        <h1>🏆 Rankings Globais</h1>
        <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginTop: 8 }}>Acompanhe os melhores jogadores da comunidade</p>
      </div>

      {/* Filter Buttons */}
      <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 24 }}>
        {(['profit', 'roi', 'volume', 'winrate'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setRankingType(type)}
            style={{
              padding: 14,
              borderRadius: 12,
              border: rankingType === type ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
              background: rankingType === type ? 'rgba(124, 58, 237, 0.1)' : 'rgba(255,255,255,0.02)',
              color: rankingType === type ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontSize: 14,
            }}
            onMouseEnter={(e) => {
              if (rankingType !== type) {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent-primary)';
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(124, 58, 237, 0.05)';
              }
            }}
            onMouseLeave={(e) => {
              if (rankingType !== type) {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-color)';
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.02)';
              }
            }}
          >
            {type === 'profit' && '💰 Lucro'}
            {type === 'roi' && '📈 ROI'}
            {type === 'volume' && '📊 Volume'}
            {type === 'winrate' && '🎯 W/L %'}
          </button>
        ))}
      </div>

      {/* Rankings Table */}
      <div className="card" style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th style={{ width: '50px' }}>#</th>
              <th>Jogador</th>
              <th style={{ textAlign: 'right' }}>Lucro</th>
              <th style={{ textAlign: 'right' }}>ROI</th>
              <th style={{ textAlign: 'right' }}>Jogos</th>
              <th style={{ textAlign: 'center' }}>País</th>
              <th style={{ textAlign: 'center' }}>Sala</th>
            </tr>
          </thead>
          <tbody>
            {items.map((player) => (
              <tr key={`${player.nickname}-${player.rank}`}>
                <td style={{ fontWeight: 700, fontSize: 16 }}>
                  {player.rank === 1 && '🥇'}
                  {player.rank === 2 && '🥈'}
                  {player.rank === 3 && '🥉'}
                  {player.rank > 3 && player.rank}
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: `linear-gradient(135deg, hsl(${player.rank * 30}, 70%, 50%), hsl(${player.rank * 40}, 70%, 60%))`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: 14,
                        color: 'white',
                      }}
                    >
                      {player.nickname.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{player.nickname}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>#{player.rank}</div>
                    </div>
                  </div>
                </td>
                <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--accent-green)' }}>
                  R${Math.abs(player.totalProfit).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                </td>
                <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--accent-secondary)' }}>{player.roi.toFixed(1)}%</td>
                <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{player.gamesPlayed}</td>
                <td style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-secondary)' }}>{player.country}</td>
                <td style={{ textAlign: 'center', fontSize: 12, fontWeight: 600 }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      borderRadius: 8,
                      background: player.room === 'PokerStars' ? 'rgba(124, 58, 237, 0.2)' : 'rgba(6, 182, 212, 0.2)',
                      color: player.room === 'PokerStars' ? 'var(--accent-primary)' : 'var(--accent-secondary)',
                    }}
                  >
                    {player.room}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
