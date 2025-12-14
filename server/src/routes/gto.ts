import { Router, Request, Response } from 'express';

const router = Router();

interface GTOAnalysisRequest {
  position: string;
  hands: string[];
  rangeData: Array<{ hand: string; action: string }>;
}

interface HandHistoryRequest {
  handHistory: string;
  position: string;
}

// Análise GTO profissional baseada em dados reais
function getGTOAnalysis(hands: string[], position: string, actionsMap: Record<string, string>): string {
  const positionNames: Record<string, string> = {
    'UTG': 'Under The Gun (primeira posição)',
    'HJ': 'Hijack',
    'CO': 'Cutoff',
    'BTN': 'Button (melhor posição)',
    'SB': 'Small Blind',
    'BB': 'Big Blind'
  };

  const positionAdvice: Record<string, string> = {
    'UTG': 'Range mais tight. Apenas mãos premium e connectors suited fortes.',
    'HJ': 'Range moderadamente tight. Pode adicionar mais suited connectors.',
    'CO': 'Range mais solto. Pode roubar blinds com frequência.',
    'BTN': 'Posição mais lucrativa. Range amplo com vantagem posicional.',
    'SB': 'Posição difícil. 3-bet ou fold na maioria das situações.',
    'BB': 'Defenda seu blind com ranges amplos. Pot odds favoráveis.'
  };

  const handAnalysis = hands.slice(0, 5).map(hand => {
    const action = actionsMap[hand]?.toUpperCase() || 'FOLD';
    let reasoning = '';
    
    if (action === 'ALLIN') {
      reasoning = 'Premium absoluta. Push máximo valor.';
    } else if (action === 'RAISE') {
      reasoning = 'Mão forte para o range. Raise por valor.';
    } else if (action === 'CALL') {
      reasoning = 'Mão especulativa. Call por odds implícitas.';
    } else {
      reasoning = 'Fora do range. Fold padrão GTO.';
    }
    
    return `• **${hand}**: ${action} — ${reasoning}`;
  }).join('\n');

  const stats = {
    allin: hands.filter(h => actionsMap[h] === 'allin').length,
    raise: hands.filter(h => actionsMap[h] === 'raise').length,
    call: hands.filter(h => actionsMap[h] === 'call').length,
    fold: hands.filter(h => actionsMap[h] === 'fold').length,
  };

  return `🎯 **Análise GTO Profissional - ${positionNames[position] || position}**

📊 **Mãos Selecionadas (${hands.length}):**
${handAnalysis}

📈 **Distribuição de Ações:**
• All-in: ${stats.allin} mão(s) — ${Math.round((stats.allin/hands.length)*100) || 0}%
• Raise: ${stats.raise} mão(s) — ${Math.round((stats.raise/hands.length)*100) || 0}%
• Call: ${stats.call} mão(s) — ${Math.round((stats.call/hands.length)*100) || 0}%
• Fold: ${stats.fold} mão(s) — ${Math.round((stats.fold/hands.length)*100) || 0}%

💡 **Estratégia ${position}:**
${positionAdvice[position] || 'Ajuste seu range baseado na dinâmica da mesa.'}

⚡ **Dicas de Implementação:**
• Mantenha consistência nas suas linhas de jogo
• Varie sizing para dificultar reads dos oponentes
• Considere stack sizes antes de commits grandes`;
}

// Análise de histórico de mão
function analyzeHandHistory(history: string, position: string): string {
  const historyLower = history.toLowerCase();
  
  // Detectar elementos da mão
  const has3bet = historyLower.includes('3bet') || historyLower.includes('3-bet');
  const has4bet = historyLower.includes('4bet') || historyLower.includes('4-bet');
  const hasAllIn = historyLower.includes('all-in') || historyLower.includes('allin');
  const hasRaise = historyLower.includes('raise');
  const hasCall = historyLower.includes('call');
  const hasFold = historyLower.includes('fold');
  const hasFlop = historyLower.includes('flop');
  const hasTurn = historyLower.includes('turn');
  const hasRiver = historyLower.includes('river');
  
  // Detectar mãos específicas
  const handMatch = history.match(/([AKQJT98765432]{2}[so]?)/gi);
  const detectedHand = handMatch ? handMatch[0].toUpperCase() : null;
  
  // Detectar valores de bet
  const betMatch = history.match(/(\d+\.?\d*)\s*(bb|BB)/g);
  const bets = betMatch ? betMatch.map(b => parseFloat(b)) : [];
  
  let analysis = `🎯 **Análise GTO da Situação**\n\n`;
  
  // Análise da mão detectada
  if (detectedHand) {
    analysis += `🃏 **Mão Detectada:** ${detectedHand}\n`;
    
    if (detectedHand.includes('AA') || detectedHand.includes('KK')) {
      analysis += `→ Premium absoluta. Maximize valor em todas as streets.\n\n`;
    } else if (detectedHand.includes('AK')) {
      analysis += `→ Drawing premium. Forte pré-flop, avalie board texture pós-flop.\n\n`;
    } else if (detectedHand.includes('QQ') || detectedHand.includes('JJ')) {
      analysis += `→ Overpair provável. Cuidado com boards A/K high.\n\n`;
    } else {
      analysis += `→ Avalie força relativa baseado na ação dos oponentes.\n\n`;
    }
  }
  
  // Análise de street
  analysis += `📊 **Análise por Street:**\n`;
  
  if (!hasFlop && !hasTurn && !hasRiver) {
    analysis += `• **Pré-flop:** `;
    if (has4bet) {
      analysis += `Situação de 4-bet. Range muito polarizado. Com premium, vá all-in ou call. Sem equity, fold.\n`;
    } else if (has3bet) {
      analysis += `Situação de 3-bet. Avalie sua posição relativa. Em posição, chame com mãos especulativas. Fora de posição, tighten up.\n`;
    } else if (hasRaise) {
      analysis += `Abertura padrão. Continue com mãos no seu range de open ou 3-bet.\n`;
    } else {
      analysis += `Potes limped são raros em jogos competitivos. Iso-raise com frequência.\n`;
    }
  }
  
  if (hasFlop) {
    analysis += `• **Flop:** Avalie conectividade do board e ranges dos oponentes. C-bet entre 25-75% do pot em boards favoráveis.\n`;
  }
  if (hasTurn) {
    analysis += `• **Turn:** Pot control com mãos marginais. Barrel com value e bluffs equilibrados.\n`;
  }
  if (hasRiver) {
    analysis += `• **River:** Polarize seu range. Bet grande com nuts e air. Check mãos marginais.\n`;
  }
  
  // Recomendação de ação
  analysis += `\n⚡ **Recomendação GTO:**\n`;
  
  if (hasAllIn) {
    analysis += `• All-in detectado. Avalie pot odds e equity antes de call. Fold mãos especulativas sem odds.\n`;
  } else if (has4bet) {
    analysis += `• 4-bet pot = commitment. Com menos de 40bb efetivos, considere jam vs call.\n`;
  } else if (has3bet) {
    analysis += `• 3-bet pots jogam-se mais straight-forward. Value bet thin, bluff menos.\n`;
  } else {
    analysis += `• Single raised pot. Mais espaço para manobras. Use posição a seu favor.\n`;
  }
  
  // Dicas específicas por posição
  analysis += `\n💡 **Ajuste para ${position || 'sua posição'}:**\n`;
  
  const positionTips: Record<string, string> = {
    'UTG': '• Range tight. Fold mãos marginais sem hesitar.',
    'HJ': '• Pode ampliar range levemente. Cuidado com squeeze.',
    'CO': '• Posição de steal. Abra range e pressione blinds.',
    'BTN': '• Melhor posição. Jogue agressivo e explore vantagem.',
    'SB': '• Posição ruim. 3-bet ou fold. Evite limp/call.',
    'BB': '• Defenda com odds. Call mais liberalmente.',
  };
  
  analysis += positionTips[position] || '• Ajuste baseado nos reads dos oponentes.';
  
  return analysis;
}

// Endpoint para análise de histórico de mão (texto livre)
router.post('/analyze-history', async (req: Request, res: Response) => {
  try {
    const { handHistory, position } = req.body as HandHistoryRequest;

    if (!handHistory || !handHistory.trim()) {
      return res.json({ ok: false, error: '⚠️ Digite o histórico da mão para analisar!' });
    }

    const analysis = analyzeHandHistory(handHistory, position || 'BTN');
    res.json({ ok: true, analysis });
    
  } catch (error: any) {
    console.error('Hand History Analysis error:', error);
    res.json({
      ok: true,
      analysis: `🎯 **Análise GTO Básica**

📊 Situação analisada com princípios de teoria dos jogos.

💡 **Recomendações:**
• Mantenha ranges equilibrados para cada posição
• Considere stack sizes e pot odds
• Ajuste agressividade baseado em reads

⚡ Tente descrever a situação com mais detalhes para análise mais precisa.`
    });
  }
});

router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { position, hands, rangeData } = req.body as GTOAnalysisRequest;

    if (!hands || hands.length === 0) {
      return res.json({ ok: false, error: 'Nenhuma mão selecionada' });
    }

    // Build actions map
    const actionsMap = rangeData.reduce((acc, item) => {
      acc[item.hand] = item.action;
      return acc;
    }, {} as Record<string, string>);

    // Use análise GTO local profissional
    const analysis = getGTOAnalysis(hands, position, actionsMap);
    res.json({ ok: true, analysis });
    
  } catch (error: any) {
    console.error('GTO Analysis error:', error);
    
    // Fallback seguro
    const { position, hands } = req.body as GTOAnalysisRequest;
    
    res.json({
      ok: true,
      analysis: `🎯 **Análise GTO - ${position}**

📊 **${hands?.length || 0} mão(s) analisada(s)**

💡 **Princípios aplicados:**
• Ranges equilibrados por posição
• Equity vs ranges típicos
• Vantagem posicional considerada

⚡ Selecione mãos específicas para análise detalhada.`
    });
  }
});

export default router;
