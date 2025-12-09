import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function SharkScopeSearch() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    navigate('/login');
    return null;
  }

  // Require credits or premium (use usosRestantes when available)
  const usos = (user as any).usosRestantes;
  const noUsos = typeof usos === 'number' ? (usos <= 0 && usos !== -1) : (typeof user.credits === 'number' && user.credits <= 0 && !user.premium);
  if (!user.premium && noUsos) {
    navigate('/premium');
    return null;
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.get(`/api/sharkscope/player/${encodeURIComponent(name)}`);
      if (!res.ok) throw new Error(res.message || 'Erro');
      setResult(res.data);
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar jogador');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ paddingTop: 24 }}>
      <h2>Buscar jogador (SharkScope)</h2>
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do jogador" className="search-input" />
        <button className="btn btn-primary" disabled={loading || !name}>{loading ? 'Buscando...' : 'Buscar'}</button>
      </form>

      {error && <div style={{ marginTop: 12, color: 'crimson' }}>{error}</div>}

      {result && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3>{result.name}</h3>
          <div>Partidas: {result.games}</div>
          <div>Buyins: {result.buyins}</div>
          <div>ROI: {result.roi}</div>
          <div>Cashes: {result.cashes}</div>
          {result.other && <pre style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{JSON.stringify(result.other, null, 2)}</pre>}
        </div>
      )}
    </div>
  );
}
