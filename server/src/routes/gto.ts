import { Router, Request, Response } from 'express';
import OpenAI from 'openai';

const router = Router();

// Initialize OpenAI (will use OPENAI_API_KEY from env)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

interface GTOAnalysisRequest {
  position: string;
  hands: string[];
  rangeData: Array<{ hand: string; action: string }>;
}

router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { position, hands, rangeData } = req.body as GTOAnalysisRequest;

    if (!hands || hands.length === 0) {
      return res.json({ ok: false, error: 'Nenhuma mão selecionada' });
    }

    // Build context for AI
    const actionsMap = rangeData.reduce((acc, item) => {
      acc[item.hand] = item.action;
      return acc;
    }, {} as Record<string, string>);

    const handsList = hands.map(h => `${h} (${actionsMap[h] || 'fold'})`).join(', ');

    const prompt = `Você é um expert em poker GTO (Game Theory Optimal). Analise as seguintes mãos na posição ${position}:

Mãos selecionadas: ${handsList}

Forneça uma análise concisa (máximo 150 palavras) sobre:
1. Por que essas mãos têm essas ações recomendadas nesta posição
2. Considerações estratégicas importantes
3. Como ajustar contra diferentes tipos de oponentes

Seja direto e objetivo. Use emojis para facilitar a leitura.`;

    // Check if OpenAI is configured
    if (!process.env.OPENAI_API_KEY) {
      return res.json({
        ok: true,
        analysis: `🎯 Análise de ${hands.length} mão(s) na posição ${position}:

${hands.slice(0, 5).map(h => `• ${h}: ${actionsMap[h]?.toUpperCase() || 'FOLD'}`).join('\n')}

📊 Recomendações GTO:
- Em ${position}, essas mãos seguem ranges equilibrados
- Ações variam baseadas em equity e position advantage
- Considere stack sizes e tendências dos oponentes

⚠️ Configure OPENAI_API_KEY no servidor para análises mais detalhadas!`
      });
    }

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Você é um coach profissional de poker especializado em estratégia GTO. Seja conciso e use emojis.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const analysis = completion.choices[0]?.message?.content || 'Não foi possível gerar análise.';

    res.json({ ok: true, analysis });
  } catch (error: any) {
    console.error('GTO Analysis error:', error);
    
    // Fallback response on error
    const { position, hands, rangeData } = req.body as GTOAnalysisRequest;
    const actionsMap = rangeData.reduce((acc, item) => {
      acc[item.hand] = item.action;
      return acc;
    }, {} as Record<string, string>);

    res.json({
      ok: true,
      analysis: `🎯 Análise rápida - ${position}:

${hands.slice(0, 5).map(h => `• ${h}: ${actionsMap[h]?.toUpperCase() || 'FOLD'}`).join('\n')}

📊 Essas mãos seguem princípios GTO baseados em:
- Equity contra ranges típicos
- Vantagem posicional
- Ranges balanceados

💡 Dica: Em ${position}, mantenha ranges equilibrados e ajuste baseado em stack sizes!

⚠️ Erro ao conectar com IA: ${error.message}`
    });
  }
});

export default router;
