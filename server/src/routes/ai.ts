import { Router } from 'express';
import { canAnalyze, recordAnalysis, analyzeWithOpenAI, mockAnalyze } from '../services/aiAnalysisService';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getUserById, deductCredit } from '../services/userService';
import { recordAnalysis as recordAnalysisHistory } from '../services/analysisHistoryService';

const router = Router();

/**
 * POST /api/ai/analyze
 * Analyze a poker hand history
 * Protected route - requires authentication
 */
router.post('/analyze', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const { history, fileName } = req.body || {};
    if (!history || typeof history !== 'string') {
      return res.status(400).json({ error: 'invalid_history' });
    }

    // Get user
    const user = await getUserById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'user_not_found' });
    }

    // Size limit: 5 MB
    const maxBytes = 5 * 1024 * 1024;
    const bytes = Buffer.byteLength(history, 'utf8');
    if (bytes > maxBytes) {
      return res.status(413).json({ error: 'history_too_large', maxBytes });
    }

    // Check credits - usa tipo 'analise' (10 usos gratuitos)
    const hasCredit = await deductCredit(req.userId, 'analise');
    if (!hasCredit) {
      return res.status(403).json({
        ok: false,
        error: 'no_credits',
        message: 'Você atingiu o limite de 10 análises gratuitas. Assine o Premium para continuar.',
        credits: user.credits,
        remaining: (user as any).usosAnalise ?? 0,
        feature: 'analise'
      });
    }

    // Perform analysis
    let analysisResult: any = null;
    try {
      analysisResult = await analyzeWithOpenAI(history);
    } catch (e) {
      // Fallback to mock analysis
      analysisResult = mockAnalyze(history);
    }

    // Record analysis in history
    const analysis = await recordAnalysisHistory(
      req.userId,
      fileName || 'imported_history',
      analysisResult.stats || {},
      analysisResult.analysis || analysisResult.summary || '',
      analysisResult.improvements || [],
      analysisResult.leaks || [],
      analysisResult.aiModelUsed
    );

    // Get updated user
    const updatedUser = await getUserById(req.userId);

    return res.json({
      ok: true,
      stats: analysisResult.stats || {},
      analysis: analysisResult.analysis || analysisResult.summary || '',
      improvements: analysisResult.improvements || [],
      leaks: analysisResult.leaks || [],
      aiModelUsed: analysisResult.aiModelUsed || null,
      remaining: (updatedUser as any)?.usosAnalise ?? 0,
      analysisId: analysis.id,
    });
  } catch (err: any) {
    console.error('AI analyze error:', err?.message || err);
    return res.status(500).json({
      ok: false,
      error: 'internal',
      message: err?.message || String(err),
    });
  }
});

export default router;
