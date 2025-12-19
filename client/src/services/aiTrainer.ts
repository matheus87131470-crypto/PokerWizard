// Service que integra a IA existente do backend com o sistema de treino
import { useAuth } from '../contexts/AuthContext';

const API_BASE = 'http://localhost:3001';

export interface AIScenario {
  id: string;
  position: string;
  gameType: string;
  street: string;
  preflopAction: string;
  heroCards: string[];
  board: string[];
  villainRange: string;
  correctAction: string;
  ev: number;
  network?: string;
  seats?: { position: string; name: string; stack: number }[];
}

export interface AIFeedback {
  correct: boolean;
  expectedAction: string;
  yourAction: string;
  ev: number;
  explanation: string;
  villainRange: string;
}

// Gerar cenário de treino usando a IA do backend
export async function generateAIScenario(
  position: string,
  gameType: string = 'Cash',
  street: string = 'Pré-flop',
  preflopAction: string = 'Any',
  network: string = 'PokerStars'
): Promise<AIScenario | null> {
  try {
    const token = localStorage.getItem('pokerwizard_token');
    
    const response = await fetch(`${API_BASE}/api/trainer/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        position,
        gameType,
        street,
        preflopAction,
        network
      })
    });

    const data = await response.json();
    
    if (!data.ok) {
      if (data.error === 'no_credits') {
        throw new Error('Você atingiu o limite de usos. Faça upgrade para premium!');
      }
      throw new Error(data.message || 'Erro ao gerar cenário');
    }

    return data.scenario;
  } catch (error) {
    console.error('Erro ao gerar cenário com IA:', error);
    throw error;
  }
}

// Registrar resultado da jogada
export async function recordAIResult(
  scenarioId: string,
  userAction: string,
  timeSpent: number
): Promise<void> {
  try {
    const token = localStorage.getItem('pokerwizard_token');
    
    await fetch(`${API_BASE}/api/trainer/record`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        scenarioId,
        userAction,
        timeSpent
      })
    });
  } catch (error) {
    console.error('Erro ao registrar resultado:', error);
  }
}

// Obter estatísticas de uso do treino
export async function getTrainingUsage(): Promise<{
  used: number;
  limit: number;
  remaining: number;
  isPremium: boolean;
}> {
  try {
    const token = localStorage.getItem('pokerwizard_token');
    
    const response = await fetch(`${API_BASE}/api/trainer/usage`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (!data.ok) {
      throw new Error('Erro ao obter uso');
    }

    return {
      used: data.used || 0,
      limit: data.limit || 10,
      remaining: data.remaining || 0,
      isPremium: data.isPremium || false
    };
  } catch (error) {
    console.error('Erro ao obter uso:', error);
    return {
      used: 0,
      limit: 10,
      remaining: 10,
      isPremium: false
    };
  }
}

// Avaliar ação do usuário usando a IA
export function evaluateAIAction(
  scenario: AIScenario,
  userAction: string
): AIFeedback {
  const correct = userAction.toLowerCase() === scenario.correctAction.toLowerCase();
  
  let explanation = '';
  
  if (correct) {
    explanation = `✅ Excelente! ${scenario.correctAction} é a jogada correta nessa situação.\n\n`;
    explanation += `Com ${scenario.heroCards.join('')} em ${scenario.position}, `;
    explanation += `considerando o range do vilão (${scenario.villainRange}), `;
    explanation += `a melhor ação é ${scenario.correctAction}.\n\n`;
    explanation += `EV esperado: ${scenario.ev > 0 ? '+' : ''}${scenario.ev} chips`;
  } else {
    explanation = `❌ Não foi dessa vez. A jogada correta seria ${scenario.correctAction}.\n\n`;
    explanation += `Você escolheu ${userAction}, mas com ${scenario.heroCards.join('')} `;
    explanation += `em ${scenario.position} contra o range ${scenario.villainRange}, `;
    explanation += `${scenario.correctAction} seria mais lucrativo.\n\n`;
    explanation += `EV do ${scenario.correctAction}: ${scenario.ev > 0 ? '+' : ''}${scenario.ev} chips\n`;
    explanation += `Diferença de EV: ~${Math.abs(scenario.ev)} chips`;
  }

  // Adiciona explicação contextual baseado na street
  if (scenario.street !== 'Pré-flop' && scenario.board.length > 0) {
    explanation += `\n\n🎴 Board: ${scenario.board.join(' ')}`;
  }

  return {
    correct,
    expectedAction: scenario.correctAction,
    yourAction: userAction,
    ev: scenario.ev,
    explanation,
    villainRange: scenario.villainRange
  };
}

// Converter cartas do backend para formato do frontend
export function convertAICards(cards: string[]): Array<{ rank: string; suit: string; value: number }> {
  const rankValues: Record<string, number> = {
    'A': 14, 'K': 13, 'Q': 12, 'J': 11, 'T': 10,
    '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2
  };

  return cards.map(card => {
    // Card format: "A♠" or "Ks"
    const rank = card[0];
    const suit = card[1];
    
    return {
      rank,
      suit: suit as any,
      value: rankValues[rank] || 0
    };
  });
}

// Mapear ações do backend para o frontend
export function normalizeAction(action: string): 'raise' | 'call' | 'fold' {
  const lower = action.toLowerCase();
  
  if (lower.includes('raise') || lower.includes('all-in')) {
    return 'raise';
  }
  
  if (lower.includes('call') || lower.includes('check')) {
    return 'call';
  }
  
  return 'fold';
}

// Obter ação recomendada para display
export function getActionRecommendation(scenario: AIScenario): string {
  const action = scenario.correctAction;
  const ev = scenario.ev;
  
  let rec = `Ação recomendada: **${action}**\n`;
  rec += `EV: ${ev > 0 ? '+' : ''}${ev} chips\n\n`;
  
  if (scenario.street === 'Pré-flop') {
    rec += `Range vilão: ${scenario.villainRange}`;
  } else {
    rec += `Board: ${scenario.board.join(' ')}\n`;
    rec += `Range vilão: ${scenario.villainRange}`;
  }
  
  return rec;
}
