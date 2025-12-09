import express, { Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getUserAnalyses, getUserAnalysisStats } from '../services/analysisHistoryService';

const router = express.Router();

/**
 * GET /dashboard/analyses
 * Get user's analysis history
 */
router.get('/analyses', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const limit = parseInt(req.query.limit as string) || 10;
    const analyses = await getUserAnalyses(req.userId, limit);

    return res.json({
      ok: true,
      analyses,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'fetch_analyses_failed', message: err.message });
  }
});

/**
 * GET /dashboard/stats
 * Get user's analysis statistics
 */
router.get('/stats', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const stats = await getUserAnalysisStats(req.userId);

    return res.json({
      ok: true,
      stats,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'fetch_stats_failed', message: err.message });
  }
});

export default router;
