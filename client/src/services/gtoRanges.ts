// Ranges GTO baseados em posição e ação
// Dados simplificados - em produção viriam de um solver

export interface Range {
  hands: string[];
  frequency: number; // 0 a 1
}

export interface ActionRange {
  raise: Range;
  call: Range;
  fold: Range;
}

export interface PositionRanges {
  openRaise: Range;
  vs3bet: ActionRange;
  vs4bet: ActionRange;
}

// Ranges de open-raise por posição (6-max)
export const OPEN_RAISE_RANGES: Record<string, string[]> = {
  'UTG': [
    'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77',
    'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A5s', 'A4s',
    'KQs', 'KJs', 'KTs',
    'QJs', 'QTs',
    'JTs', 'T9s',
    'AKo', 'AQo', 'AJo'
  ],
  'HJ': [
    'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55',
    'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
    'KQs', 'KJs', 'KTs', 'K9s',
    'QJs', 'QTs', 'Q9s',
    'JTs', 'J9s',
    'T9s', 'T8s',
    '98s', '87s', '76s',
    'AKo', 'AQo', 'AJo', 'ATo', 'KQo'
  ],
  'CO': [
    'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22',
    'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
    'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'K6s', 'K5s',
    'QJs', 'QTs', 'Q9s', 'Q8s',
    'JTs', 'J9s', 'J8s',
    'T9s', 'T8s', 'T7s',
    '98s', '97s', '87s', '86s', '76s', '75s', '65s',
    'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'A8o',
    'KQo', 'KJo', 'KTo',
    'QJo', 'QTo',
    'JTo'
  ],
  'BTN': [
    'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22',
    'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
    'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'K6s', 'K5s', 'K4s', 'K3s', 'K2s',
    'QJs', 'QTs', 'Q9s', 'Q8s', 'Q7s', 'Q6s', 'Q5s',
    'JTs', 'J9s', 'J8s', 'J7s',
    'T9s', 'T8s', 'T7s', 'T6s',
    '98s', '97s', '96s', '87s', '86s', '85s', '76s', '75s', '65s', '64s', '54s',
    'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'A8o', 'A7o', 'A6o', 'A5o',
    'KQo', 'KJo', 'KTo', 'K9o',
    'QJo', 'QTo', 'Q9o',
    'JTo', 'J9o',
    'T9o', 'T8o',
    '98o', '87o'
  ],
  'SB': [
    'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22',
    'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
    'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'K6s', 'K5s', 'K4s', 'K3s',
    'QJs', 'QTs', 'Q9s', 'Q8s', 'Q7s', 'Q6s',
    'JTs', 'J9s', 'J8s', 'J7s',
    'T9s', 'T8s', 'T7s',
    '98s', '97s', '87s', '86s', '76s', '75s', '65s',
    'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'A8o', 'A7o',
    'KQo', 'KJo', 'KTo', 'K9o',
    'QJo', 'QTo',
    'JTo'
  ],
  'BB': [] // BB não tem open-raise range (já está no blind)
};

// Ranges de 3-bet por posição
export const THREE_BET_RANGES: Record<string, ActionRange> = {
  'UTG': {
    raise: {
      hands: ['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo'],
      frequency: 0.9
    },
    call: {
      hands: ['TT', '99', '88', 'AQs', 'AJs', 'KQs', 'QJs', 'JTs'],
      frequency: 0.7
    },
    fold: {
      hands: [], // Resto folds
      frequency: 1.0
    }
  },
  'HJ': {
    raise: {
      hands: ['AA', 'KK', 'QQ', 'JJ', 'TT', 'AKs', 'AQs', 'AKo'],
      frequency: 0.85
    },
    call: {
      hands: ['99', '88', '77', 'AJs', 'ATs', 'KQs', 'KJs', 'QJs', 'JTs', 'AQo'],
      frequency: 0.7
    },
    fold: {
      hands: [],
      frequency: 1.0
    }
  },
  'CO': {
    raise: {
      hands: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', 'AKs', 'AQs', 'AJs', 'A5s', 'A4s', 'AKo', 'AQo'],
      frequency: 0.8
    },
    call: {
      hands: ['88', '77', '66', '55', 'ATs', 'A9s', 'KQs', 'KJs', 'QJs', 'JTs', 'T9s', 'AJo'],
      frequency: 0.65
    },
    fold: {
      hands: [],
      frequency: 1.0
    }
  },
  'BTN': {
    raise: {
      hands: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', 'AKs', 'AQs', 'AJs', 'ATs', 'A5s', 'A4s', 'A3s', 'A2s', 'KQs', 'AKo', 'AQo'],
      frequency: 0.75
    },
    call: {
      hands: ['77', '66', '55', '44', '33', '22', 'A9s', 'A8s', 'KJs', 'KTs', 'QJs', 'QTs', 'JTs', 'T9s', '98s', 'AJo', 'ATo', 'KQo'],
      frequency: 0.6
    },
    fold: {
      hands: [],
      frequency: 1.0
    }
  },
  'SB': {
    raise: {
      hands: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', 'AKs', 'AQs', 'AJs', 'A5s', 'A4s', 'KQs', 'AKo', 'AQo'],
      frequency: 0.8
    },
    call: {
      hands: ['88', '77', '66', '55', 'ATs', 'A9s', 'KJs', 'KTs', 'QJs', 'JTs', 'T9s', 'AJo', 'KQo'],
      frequency: 0.65
    },
    fold: {
      hands: [],
      frequency: 1.0
    }
  },
  'BB': {
    raise: {
      hands: ['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AQs', 'AKo'],
      frequency: 0.85
    },
    call: {
      hands: ['TT', '99', '88', '77', '66', '55', '44', '33', '22', 'AJs', 'ATs', 'A9s', 'KQs', 'KJs', 'QJs', 'JTs', 'T9s', 'AQo', 'AJo'],
      frequency: 0.75
    },
    fold: {
      hands: [],
      frequency: 1.0
    }
  }
};

// Verificar se mão está em um range
export function isHandInRange(handNotation: string, range: string[]): boolean {
  return range.includes(handNotation);
}

// Obter ação GTO recomendada
export function getGTOAction(
  handNotation: string,
  position: string,
  scenario: 'open' | '3bet' | '4bet'
): { action: 'raise' | 'call' | 'fold', frequency: number, isGTO: boolean } {
  if (scenario === 'open') {
    const range = OPEN_RAISE_RANGES[position] || [];
    const shouldRaise = isHandInRange(handNotation, range);
    
    return {
      action: shouldRaise ? 'raise' : 'fold',
      frequency: shouldRaise ? 0.9 : 0.0,
      isGTO: true
    };
  }
  
  if (scenario === '3bet') {
    const ranges = THREE_BET_RANGES[position];
    if (!ranges) {
      return { action: 'fold', frequency: 1.0, isGTO: true };
    }
    
    if (isHandInRange(handNotation, ranges.raise.hands)) {
      return { action: 'raise', frequency: ranges.raise.frequency, isGTO: true };
    }
    
    if (isHandInRange(handNotation, ranges.call.hands)) {
      return { action: 'call', frequency: ranges.call.frequency, isGTO: true };
    }
    
    return { action: 'fold', frequency: 1.0, isGTO: true };
  }
  
  // 4bet - simplificado
  const premiumHands = ['AA', 'KK', 'QQ', 'AKs', 'AKo'];
  if (isHandInRange(handNotation, premiumHands)) {
    return { action: 'raise', frequency: 0.9, isGTO: true };
  }
  
  return { action: 'fold', frequency: 1.0, isGTO: true };
}

// Calcular range de equity (simplificado)
export function calculateEquity(handNotation: string, position: string): number {
  const strength = getHandStrengthScore(handNotation);
  const positionBonus = getPositionBonus(position);
  
  return Math.min(100, strength + positionBonus);
}

function getHandStrengthScore(handNotation: string): number {
  const premiumPairs = ['AA', 'KK', 'QQ', 'JJ', 'TT'];
  const goodPairs = ['99', '88', '77', '66', '55'];
  const premiumBroadway = ['AKs', 'AKo', 'AQs', 'AJs', 'KQs'];
  
  if (premiumPairs.includes(handNotation)) return 80;
  if (goodPairs.includes(handNotation)) return 60;
  if (premiumBroadway.includes(handNotation)) return 70;
  if (handNotation.includes('s')) return 50; // suited
  
  return 40;
}

function getPositionBonus(position: string): number {
  const bonuses: Record<string, number> = {
    'BTN': 10,
    'CO': 8,
    'HJ': 5,
    'UTG': 0,
    'SB': -5,
    'BB': -3
  };
  
  return bonuses[position] || 0;
}

// Avaliar jogada do usuário
export function evaluateUserAction(
  userAction: 'raise' | 'call' | 'fold',
  handNotation: string,
  position: string,
  scenario: 'open' | '3bet' | '4bet'
): {
  correct: boolean;
  gtoAction: string;
  feedback: string;
  score: number;
} {
  const gto = getGTOAction(handNotation, position, scenario);
  const correct = userAction === gto.action;
  
  let feedback = '';
  let score = 0;
  
  if (correct) {
    feedback = `✅ Correto! ${gto.action.toUpperCase()} é a jogada GTO com ${handNotation} em ${position}.`;
    score = 100;
  } else {
    feedback = `❌ Incorreto. A jogada GTO seria ${gto.action.toUpperCase()} (${Math.round(gto.frequency * 100)}% do tempo). Você escolheu ${userAction.toUpperCase()}.`;
    score = 0;
    
    // Feedback adicional
    if (gto.action === 'fold' && userAction === 'raise') {
      feedback += ' Esta mão é muito fraca para esta posição.';
    } else if (gto.action === 'raise' && userAction === 'fold') {
      feedback += ' Esta mão é premium e deve ser jogada agressivamente!';
    } else if (gto.action === 'call' && userAction === 'raise') {
      feedback += ' Esta mão tem melhor EV como call do que 3-bet.';
    }
  }
  
  return {
    correct,
    gtoAction: gto.action,
    feedback,
    score
  };
}

// Gerar explicação detalhada
export function getDetailedExplanation(
  handNotation: string,
  position: string,
  scenario: 'open' | '3bet' | '4bet'
): string {
  const gto = getGTOAction(handNotation, position, scenario);
  const equity = calculateEquity(handNotation, position);
  
  let explanation = `**${handNotation} em ${position}**\n\n`;
  explanation += `Equity estimada: ~${equity}%\n\n`;
  explanation += `**Ação GTO:** ${gto.action.toUpperCase()} (${Math.round(gto.frequency * 100)}% frequência)\n\n`;
  
  if (scenario === 'open') {
    if (gto.action === 'raise') {
      explanation += `Esta mão está dentro do range de open-raise para ${position}. `;
      explanation += `Você deve raise para construir o pot com uma mão forte e ter iniciativa pós-flop.`;
    } else {
      explanation += `Esta mão está fora do range de open-raise para ${position}. `;
      explanation += `Fold é a melhor opção para maximizar seu EV a longo prazo.`;
    }
  }
  
  return explanation;
}
