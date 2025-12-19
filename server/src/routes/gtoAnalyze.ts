import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import OpenAI from 'openai';

const router = Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Verificar se API key está configurada
if (!process.env.OPENAI_API_KEY) {
  console.warn('[gtoAnalyze] ⚠️  OPENAI_API_KEY not configured!');
}

// Analyze GTO action for Practice
router.post('/practice', authMiddleware, async (req: any, res: any) => {
  try {
    const { holeCards, board, position, street, spot, stack, pot } = req.body;

    if (!holeCards || !position || !street || !spot) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Build context for GPT-4
    const boardText = board && board.length > 0 
      ? `Board: ${board.join(' ')}` 
      : 'Preflop (no board yet)';

    const prompt = `You are a GTO poker expert. Analyze this situation and determine the SINGLE BEST GTO action.

Context:
- Hero Position: ${position}
- Stack: ${stack}bb
- Pot: ${pot}bb
- Street: ${street}
- Situation: ${spot}
- Hero Cards: ${holeCards.join(' ')}
- ${boardText}

Available actions: ${street === 'PREFLOP' ? 'FOLD, CALL, RAISE' : 'CHECK, BET, FOLD'}

Respond with ONLY the action name (FOLD/CALL/RAISE/CHECK/BET) and a brief explanation (max 50 words).

Format:
ACTION: [action]
REASON: [brief explanation]`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a GTO poker expert. Always provide the optimal action based on game theory optimal play.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 150,
    });

    const response = completion.choices[0]?.message?.content || '';
    
    // Parse response
    const actionMatch = response.match(/ACTION:\s*(\w+)/i);
    const reasonMatch = response.match(/REASON:\s*(.+)/i);

    const action = actionMatch ? actionMatch[1].toUpperCase() : 'FOLD';
    const reason = reasonMatch ? reasonMatch[1].trim() : 'Default GTO decision';

    return res.json({
      ok: true,
      action,
      reason,
      rawResponse: response,
    });

  } catch (error: any) {
    console.error('GTO Analyze Error:', error);
    return res.status(500).json({ 
      error: 'Failed to analyze',
      details: error.message 
    });
  }
});

// Explain GTO range for specific position
router.post('/range', authMiddleware, async (req: any, res: any) => {
  try {
    const userId = req.userId;
    const { position, scenario, rangeData, stats } = req.body;

    if (!position || !scenario || !rangeData) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verificar e deduzir créditos (igual ao Analyze)
    const { getUserById, deductCredit } = await import('../services/userService');
    const user = await getUserById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isPremium = (user as any).premium || (user as any).statusPlano === 'premium';
    const usosAnalise = (user as any).usosAnalise ?? 5;

    // Verificar créditos
    if (!isPremium && usosAnalise <= 0) {
      return res.status(403).json({ 
        error: 'no_credits',
        remaining: 0,
        feature: 'ranges'
      });
    }

    // Deduzir crédito (se não for premium)
    if (!isPremium) {
      await deductCredit(userId, 'analise');
    }

    // Build range summary
    const rangeHands = rangeData.map((h: any) => `${h.hand} (${h.action})`).slice(0, 20).join(', ');
    const totalHands = rangeData.length;

    const scenarioText = scenario === 'RFI' ? 'Open Raise' : scenario === '3bet' ? '3-Bet' : 'vs 3-Bet';

    const prompt = `You are a GTO poker expert. Explain the strategic reasoning behind this poker range in Portuguese (Brazil).

Position: ${position}
Scenario: ${scenarioText}
Total hands in range: ${totalHands}
Sample hands: ${rangeHands}

Statistics:
- All-in: ${stats.allin} hands
- Raise: ${stats.raise} hands
- Call: ${stats.call} hands
- Opening Range: ${stats.openingRange}%

Provide a detailed explanation (150-200 words) covering:
1. Why this range makes sense for ${position} position
2. Key strategic concepts (position, equity, fold equity)
3. How to adjust this range based on opponent tendencies
4. Common mistakes players make from this position

Write in a clear, educational tone in Portuguese.`;

    // Gerar explicação
    let explanation = '';
    const useAI = !!process.env.OPENAI_API_KEY;
    if (useAI) {
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: 'You are a professional poker coach explaining GTO ranges in Portuguese. Be detailed but accessible.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 400,
        });
        explanation = completion.choices[0]?.message?.content || '';
        console.log('[gtoAnalyze] Explanation generated via OpenAI');
      } catch (err: any) {
        console.error('[gtoAnalyze] OpenAI error, using fallback:', err?.message);
      }
    }

    // Fallback se IA não disponível ou falhou
    if (!explanation) {
      const scenarioText = scenario === 'RFI' ? 'Open Raise' : scenario === '3bet' ? '3-Bet' : 'vs 3-Bet';
      const freq = Number(stats?.openingRange ?? 0);
      explanation = `Este range de ${position} em ${scenarioText} prioriza valor e jogabilidade.
Em posições iniciais, focamos em mãos com boa equidade e baixa dominância, reduzindo offsuit marginais. À medida que avançamos (CO/BTN), incorporamos mais suited connectors e broadways, explorando posição e fold equity.

Pontos-chave:
- Valor: pares médios-altos (TT+) e broadways fortes (AK, AQ) compõem a base.
- Mix: mãos suited ganham frequência de raise/call pela jogabilidade pós-flop; offsuit marginais reduzem.
- Ajustes: contra oponentes que pagam demais, aumente o componente de valor; contra quem folda muito, amplie steals com suited.
- Erros comuns: abrir demais offsuit fracos sem posição; subestimar defesa com suited conectados.

Abertura estimada: ~${freq}% do baralho. Use esse guia como referência prática quando não houver solver.`;
      console.log('[gtoAnalyze] Fallback explanation generated');
    }

    return res.json({ ok: true, explanation });

  } catch (error: any) {
    console.error('[gtoAnalyze] Range Explanation Error:', error);
    console.error('[gtoAnalyze] Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    // Em caso de erro inesperado, tente retornar fallback básico
    try {
      const { position, scenario, stats } = req.body || {};
      const scenarioText = scenario === 'RFI' ? 'Open Raise' : scenario === '3bet' ? '3-Bet' : 'vs 3-Bet';
      const freq = Number(stats?.openingRange ?? 0);
      const explanation = `Resumo rápido de ${position} em ${scenarioText}: priorize valor, evite offsuit marginais fora de posição, e dê preferência a mãos suited com jogabilidade. Abertura referência: ~${freq}%.`;
      return res.json({ ok: true, explanation });
    } catch (_) {
      return res.status(500).json({ 
        error: 'Failed to explain range',
        details: error.message || 'Internal server error'
      });
    }
  }
});

export default router;
