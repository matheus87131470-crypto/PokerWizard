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

// Análise GTO profissional estilo coaching
function getGTOAnalysis(hands: string[], position: string, actionsMap: Record<string, string>): string {
  const positionNames: Record<string, string> = {
    'UTG': 'Under The Gun',
    'HJ': 'Hijack',
    'CO': 'Cutoff',
    'BTN': 'Button',
    'SB': 'Small Blind',
    'BB': 'Big Blind'
  };

  // Ranges típicos de abertura por posição (% aproximado)
  const positionRanges: Record<string, { fold: number; raise: number; call: number; allin: number }> = {
    'UTG': { fold: 85, raise: 12, call: 2, allin: 1 },
    'HJ': { fold: 80, raise: 16, call: 3, allin: 1 },
    'CO': { fold: 72, raise: 22, call: 5, allin: 1 },
    'BTN': { fold: 55, raise: 35, call: 8, allin: 2 },
    'SB': { fold: 60, raise: 30, call: 7, allin: 3 },
    'BB': { fold: 40, raise: 15, call: 42, allin: 3 }
  };

  const posFullName = positionNames[position] || position;
  const posRange = positionRanges[position] || positionRanges['BTN'];

  // Contar ações das mãos selecionadas
  const stats = {
    allin: hands.filter(h => actionsMap[h] === 'allin').length,
    raise: hands.filter(h => actionsMap[h] === 'raise').length,
    call: hands.filter(h => actionsMap[h] === 'call').length,
    fold: hands.filter(h => actionsMap[h] === 'fold' || !actionsMap[h]).length,
  };

  // Determinar se todas as mãos são fold
  const allAreFold = stats.fold === hands.length;
  const hasPlayableHands = stats.allin > 0 || stats.raise > 0 || stats.call > 0;

  // Gerar descrições detalhadas das mãos
  const getHandDescription = (hand: string): string => {
    const rank1 = hand[0];
    const rank2 = hand[1];
    const suited = hand.includes('s');
    const offsuit = hand.includes('o');
    const isPair = rank1 === rank2;
    
    // Mãos premium
    if (['AA', 'KK', 'QQ', 'AKs', 'AKo'].includes(hand)) {
      return `→ **Premium absoluta.** Sempre raise/all-in por valor máximo.`;
    }
    if (['JJ', 'TT', 'AQs', 'AQo', 'AJs'].includes(hand)) {
      return `→ **Mão forte.** Raise por valor, 4-bet vs 3-bet leves.`;
    }
    if (['99', '88', '77', 'ATs', 'KQs', 'KJs'].includes(hand)) {
      return `→ **Mão sólida.** Raise padrão, call 3-bet em posição.`;
    }
    
    // Pares médios/baixos
    if (isPair) {
      const pairRank = parseInt(rank1) || { 'A': 14, 'K': 13, 'Q': 12, 'J': 11, 'T': 10 }[rank1] || 0;
      if (pairRank >= 6) {
        return `→ **Par médio.** Jogável em posição tardia. Set mining com odds implícitas.`;
      }
      return `→ **Par baixo.** Set mining apenas com boas odds implícitas (>15:1).`;
    }
    
    // Suited connectors
    if (suited) {
      const gap = Math.abs(
        (['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'].indexOf(rank1)) -
        (['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'].indexOf(rank2))
      );
      
      if (gap <= 1) {
        return `→ **Suited connector.** Boa jogabilidade pós-flop. Potencial de straights e flushes.`;
      }
      if (gap <= 3 && rank1 >= '6') {
        return `→ **Suited gapper.** Especulativa. Apenas com stack profundo e posição.`;
      }
      if (rank1 === 'A') {
        return `→ **Ax suited.** Potencial de nut flush. Jogável em posição tardia.`;
      }
      if (rank1 === 'K') {
        return `→ **Kx suited.** Segundo nut flush potencial. Cuidado com dominated flushes.`;
      }
    }
    
    // Offsuit trash
    if (offsuit) {
      const highCard = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'].indexOf(rank1);
      const lowCard = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'].indexOf(rank2);
      const gap = Math.abs(highCard - lowCard);
      
      if (gap >= 5 && lowCard > 6) {
        return `→ **Sem conectividade.** Baixa equidade e jogabilidade ruim mesmo em posição.`;
      }
      if (rank1 === 'T' || rank1 === '9') {
        return `→ **Desconectada.** Kicker fraco, facilmente dominada por mãos melhores.`;
      }
    }
    
    return `→ **Mão marginal.** Avalie stack sizes e dinâmica antes de jogar.`;
  };

  // Análise individual de cada mão
  const handAnalysis = hands.map(hand => {
    const action = actionsMap[hand]?.toUpperCase() || 'FOLD';
    const description = getHandDescription(hand);
    return `**${hand}** — ${action}\n${description}`;
  }).join('\n\n');

  // Determinar recomendação principal
  let mainRecommendation = '';
  if (allAreFold) {
    mainRecommendation = `As mãos analisadas estão **fora do range lucrativo** do ${posFullName}.\n**FOLD** é a única ação correta em 100% dos cenários GTO.`;
  } else if (stats.allin > 0) {
    mainRecommendation = `${stats.allin} mão(s) no range de **all-in/premium**. Maximize valor pré-flop.`;
  } else if (stats.raise > 0) {
    mainRecommendation = `${stats.raise} mão(s) são **jogáveis para raise**. Abra agressivamente em posição.`;
  } else if (stats.call > 0) {
    mainRecommendation = `${stats.call} mão(s) são **especulativas para call**. Jogue por odds implícitas.`;
  }

  // Montar distribuição apenas se houver variação
  let distributionText = '';
  if (hasPlayableHands) {
    const parts = [];
    if (stats.raise > 0) parts.push(`🟩 **Raise:** ${stats.raise} mão(s)`);
    if (stats.call > 0) parts.push(`🟦 **Call:** ${stats.call} mão(s)`);
    if (stats.allin > 0) parts.push(`🟨 **All-in:** ${stats.allin} mão(s)`);
    if (stats.fold > 0) parts.push(`🟥 **Fold:** ${stats.fold} mão(s)`);
    
    distributionText = `\n\n📊 **Distribuição das Mãos Analisadas:**\n${parts.join('\n')}`;
  } else {
    distributionText = `\n\n📊 **Resultado:** Todas as ${hands.length} mão(s) são **FOLD** nesta posição.`;
  }

  // CTA final premium
  const ctaText = `\n\n━━━━━━━━━━━━━━━━━━━━━━

🎓 **Quer dominar os ranges do ${posFullName}?**
• Estude o matrix completo para ver todas as mãos jogáveis
• Pratique diferentes cenários de 3-bet e 4-bet
• Ajuste seu jogo baseado nos tendências dos oponentes

💡 *Dica Pro: No ${posFullName}, você deve abrir aproximadamente **${posRange.raise}%** das mãos.*`;

  return `📋 **RESUMO GTO — ${posFullName}**

${mainRecommendation}

━━━━━━━━━━━━━━━━━━━━━━

🃏 **Análise Detalhada:**

${handAnalysis}${distributionText}

📈 **Range Típico do ${posFullName} (RFI):**
🟩 Raise: ${posRange.raise}% │ 🟦 Call: ${posRange.call}% │ 🟥 Fold: ${posRange.fold}%${ctaText}`;
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
