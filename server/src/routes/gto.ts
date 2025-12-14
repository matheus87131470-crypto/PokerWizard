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

interface HandHistoryRequest {
  handHistory: string;
  position: string;
}

// Endpoint para análise de histórico de mão (texto livre)
router.post('/analyze-history', async (req: Request, res: Response) => {
  try {
    const { handHistory, position } = req.body as HandHistoryRequest;

    if (!handHistory || !handHistory.trim()) {
      return res.json({ ok: false, error: '⚠️ Digite o histórico da mão para analisar!' });
    }

    const prompt = `Você é um coach profissional de poker especializado em estratégia GTO. Analise o seguinte histórico de mão:

${handHistory}

Contexto: Jogador está na posição ${position || 'não especificada'}.

Forneça uma análise completa (máximo 200 palavras) cobrindo:
1. 📊 Avaliação da situação pré-flop/flop/turn/river
2. 🎯 Ação recomendada pelo GTO
3. 💡 Erros ou melhorias na linha de jogo
4. ⚡ Dicas práticas específicas

Seja direto, objetivo e use emojis para organizar a resposta.`;

    // Check if OpenAI is configured
    if (!process.env.OPENAI_API_KEY) {
      // Análise mock quando não tem API key
      return res.json({
        ok: true,
        analysis: `🎯 Análise GTO da Situação

📊 **Avaliação:**
O histórico descreve uma situação comum de ${position || 'mesa'}.

💡 **Recomendação GTO:**
- Considere o tamanho do pot e SPR (Stack-to-Pot Ratio)
- Avalie os ranges dos oponentes baseado nas ações prévias
- Em posição, você tem vantagem informacional

⚡ **Dicas:**
- Mantenha ranges balanceados
- Ajuste sizing baseado na textura do board
- Considere fold equity em spots de blefe

⚠️ *Configure OPENAI_API_KEY no servidor para análises mais detalhadas com IA!*`
      });
    }

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Você é um coach profissional de poker especializado em estratégia GTO. Seja conciso, objetivo e use emojis para organizar suas respostas. Foque em análise acionável.'
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
    console.error('Hand History Analysis error:', error);
    
    res.json({
      ok: true,
      analysis: `🎯 Análise Básica

📊 Situação analisada com base em princípios GTO.

💡 Recomendações gerais:
- Mantenha ranges equilibrados
- Considere posição e stack sizes
- Avalie pot odds antes de decisões

⚠️ Erro ao conectar com IA: ${error.message}

*Tente novamente em alguns segundos.*`
    });
  }
});

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
