import axios from 'axios';

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

  const response = await axios.get(`${API_URL}/api/roi`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  return response.data;
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

  const response = await axios.post(`${API_URL}/api/roi/sessions`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });

  return response.data;
}

/**
 * Listar todas as sessões de torneio do usuário
 */
export async function fetchTournamentSessions(limit = 50): Promise<TournamentSession[]> {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Token não encontrado');
  }

  const response = await axios.get(`${API_URL}/api/roi/sessions?limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  return response.data.sessions;
}

/**
 * Deletar uma sessão de torneio
 */
export async function deleteTournamentSession(sessionId: string): Promise<{ success: boolean }> {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Token não encontrado');
  }

  const response = await axios.delete(`${API_URL}/api/roi/sessions/${sessionId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  return response.data;
}
