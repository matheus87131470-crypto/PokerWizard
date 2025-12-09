/**
 * Serviço de Análise de Jogadores
 * 
 * Este arquivo contém funções para integrar com APIs reais de dados de poker
 * (SharkScope, PokerStars, Party Poker, etc)
 * 
 * TODO: Integrar com APIs reais quando disponíveis
 */

const API_BASE = (import.meta && (import.meta as any).env && (import.meta as any).env.VITE_API_BASE) || 'http://localhost:3000';

interface PlayerStats {
  vpip: number;
  pfr: number;
  aggression_factor: number;
  winrate: number;
  bb_won: number;
  total_hands: number;
  roi: number;
  itm: number;
}

interface Tournament {
  name: string;
  site: string;
  profit: number;
  roi: number;
  placement: string;
}

interface PlayerAnalysis {
  player: string;
  site: string;
  stats: PlayerStats;
  improvements: string[];
  leaks: string[];
  tournaments: Tournament[];
  analysis: string;
  remaining: number;
}

/**
 * Busca dados de um jogador na API backend
 * A API irá conectar com SharkScope, PokerStars ou outras fontes
 */
export async function searchPlayer(
  playerName: string,
  site: string,
  token: string
): Promise<PlayerAnalysis> {
  const res = await fetch(`${API_BASE}/api/sharkscope/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ playerName, site }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Erro ao buscar dados');
  }

  return res.json();
}

/**
 * Analisa dados do jogador com IA
 * (já integrado no backend)
 */
export async function analyzePlayer(
  playerData: PlayerAnalysis,
  token: string
): Promise<{ analysis: string; improvements: string[]; leaks: string[] }> {
  const res = await fetch(`${API_BASE}/api/ai/analyze-player`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ playerData }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Erro na análise');
  }

  return res.json();
}

/**
 * Conecta com SharkScope API diretamente
 * Requer SHARKSCOPE_API_KEY no .env
 */
export async function fetchFromSharkScope(
  playerName: string,
  site: string
): Promise<PlayerStats> {
  // TODO: Implementar integração com SharkScope API
  // Endpoint exemplo: https://www.sharkscope.com/api/playerprofile
  throw new Error('SharkScope API integration not yet implemented');
}

/**
 * Conecta com PokerStars API
 * Requer credenciais de desenvolvedor
 */
export async function fetchFromPokerStars(
  playerName: string
): Promise<PlayerStats> {
  // TODO: Implementar integração com PokerStars API
  throw new Error('PokerStars API integration not yet implemented');
}

/**
 * Conecta com Party Poker API
 */
export async function fetchFromPartyPoker(
  playerName: string
): Promise<PlayerStats> {
  // TODO: Implementar integração com Party Poker API
  throw new Error('Party Poker API integration not yet implemented');
}

/**
 * Conecta com 888poker API
 */
export async function fetchFrom888Poker(
  playerName: string
): Promise<PlayerStats> {
  // TODO: Implementar integração com 888poker API
  throw new Error('888poker API integration not yet implemented');
}

export default {
  searchPlayer,
  analyzePlayer,
  fetchFromSharkScope,
  fetchFromPokerStars,
  fetchFromPartyPoker,
  fetchFrom888Poker,
};
