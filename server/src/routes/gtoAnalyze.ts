import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import OpenAI from 'openai';

const router = Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

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

export default router;
