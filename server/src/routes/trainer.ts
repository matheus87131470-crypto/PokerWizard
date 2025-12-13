import { Router, Request, Response } from 'express';
import {
  generateScenario,
  recordResult,
  getStats,
  getUsage,
  subscribe,
} from '../controllers/playerController';
import { authMiddleware } from '../middleware/auth';
import OpenAI from 'openai';

const router = Router();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Protect generation endpoint so it consumes a user usage
router.post('/generate', authMiddleware, generateScenario);
router.post('/record', authMiddleware, recordResult);
router.get('/stats', getStats);
router.get('/usage', authMiddleware, getUsage);
router.post('/subscribe', authMiddleware, subscribe);

// AI Analysis endpoint
router.post('/ai-analysis', async (req: Request, res: Response) => {
  try {
    const { scenario, chosenAction } = req.body;

    if (!scenario) {
      return res.json({ ok: false, error: 'Cenário não fornecido' });
    }

    const position = scenario.position || 'BTN';
    const heroCards = (scenario.heroCards || []).join(' ');
    const board = (scenario.board || []).join(' ');
    const villainRange = scenario.villainRange || 'Unknown';
    const correctAction = scenario.correctAction || 'Unknown';
    const userAction = chosenAction || 'Nenhuma ainda';

    const prompt = `Você é um coach profissional de poker. Analise esta situação de treinamento:

**Contexto:**
- Posição: ${position}
- Suas cartas: ${heroCards}
- Board: ${board || 'Pré-flop'}
- Range estimado do vilão: ${villainRange}

**Jogadas:**
- Ação escolhida pelo jogador: ${userAction}
- Ação ótima GTO: ${correctAction}

Forneça uma análise profissional (máximo 200 palavras):
1. Por que a ação GTO é recomendada nesta situação
2. Análise da equity das cartas do herói
3. Como o range do vilão afeta a decisão
4. Dicas para melhorar em situações similares

Use emojis e seja didático.`;

    // Check if OpenAI is configured
    if (!process.env.OPENAI_API_KEY) {
      return res.json({
        ok: true,
        analysis: `🎯 Análise da Situação:

📍 **Posição:** ${position}
🃏 **Suas cartas:** ${heroCards}
🎲 **Board:** ${board || 'Pré-flop'}

✅ **Ação GTO:** ${correctAction}
${userAction !== 'Nenhuma ainda' ? `🤔 **Sua escolha:** ${userAction}` : ''}

💡 **Recomendação:**
Em ${position}, com o board ${board || 'pré-flop'}, a ação ${correctAction} maximiza seu EV contra o range ${villainRange}.

${correctAction === 'Raise' ? '📈 Raise aqui mantém pressão e capitaliza equity.' : ''}
${correctAction === 'Fold' ? '❌ Fold protege seu stack contra ranges fortes.' : ''}
${correctAction === 'Call' ? '✅ Call mantém você no pote com odds favoráveis.' : ''}

⚙️ Configure OPENAI_API_KEY para análises mais profundas!`
      });
    }

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Você é um coach profissional de poker especializado em análise de mãos. Seja didático, use emojis e foque em ensinar.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 400,
      temperature: 0.7,
    });

    const analysis = completion.choices[0]?.message?.content || 'Não foi possível gerar análise.';

    res.json({ ok: true, analysis });
  } catch (error: any) {
    console.error('Training AI Analysis error:', error);
    
    const { scenario } = req.body;
    res.json({
      ok: true,
      analysis: `🎯 Análise Rápida:

📍 Posição: ${scenario?.position || 'N/A'}
🃏 Suas cartas: ${(scenario?.heroCards || []).join(' ') || 'N/A'}
🎲 Board: ${(scenario?.board || []).join(' ') || 'Pré-flop'}

✅ Ação GTO: ${scenario?.correctAction || 'N/A'}

💡 Continue treinando para melhorar suas decisões!

⚠️ Erro ao conectar com IA: ${error.message}`
    });
  }
});

export default router;
