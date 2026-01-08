const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface TournamentSession {
  id: string;
  tipo_jogo: 'MTT' | 'SNG';
  buy_in: number;
  premio: number;
  lucro: number;
  data: string;
  created_at: string;
}

export interface ROIData {
  roi: number | null;
  total_buyins: number;
  total_premios: number;
  num_torneios: number;
  message?: string;
}

/**
 * Obter ROI do usuário autenticado
 */
export async function fetchUserROI(): Promise<ROIData> {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Token não encontrado');
  }

  const response = await fetch(`${API_URL}/api/roi`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    throw new Error(`Erro ao buscar ROI: ${response.status}`);
  }

  return response.json();
}

/**
 * Criar nova sessão de torneio
 */
export async function createTournamentSession(data: {
  tipo_jogo: 'MTT' | 'SNG';
  buy_in: number;
  premio: number;
  data?: string;
}): Promise<{ success: boolean; session: any }> {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Token não encontrado');
  }

  const response = await fetch(`${API_URL}/api/roi/sessions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error(`Erro ao criar sessão: ${response.status}`);
  }

  return response.json();
}

/**
 * Listar todas as sessões de torneio do usuário
 */
export async function fetchTournamentSessions(limit = 50): Promise<TournamentSession[]> {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Token não encontrado');
  }

  const response = await fetch(`${API_URL}/api/roi/sessions?limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    throw new Error(`Erro ao buscar sessões: ${response.status}`);
  }

  const result = await response.json();
  return result.sessions;
}

/**
 * Deletar uma sessão de torneio
 */
export async function deleteTournamentSession(sessionId: string): Promise<{ success: boolean }> {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Token não encontrado');
  }

  const response = await fetch(`${API_URL}/api/roi/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    throw new Error(`Erro ao deletar sessão: ${response.status}`);
  }

  return response.json();
}
