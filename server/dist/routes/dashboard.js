"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const analysisHistoryService_1 = require("../services/analysisHistoryService");
const router = express_1.default.Router();
/**
 * GET /dashboard/analyses
 * Get user's analysis history
 */
router.get('/analyses', auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ error: 'unauthorized' });
        }
        const limit = parseInt(req.query.limit) || 10;
        const analyses = await (0, analysisHistoryService_1.getUserAnalyses)(req.userId, limit);
        return res.json({
            ok: true,
            analyses,
        });
    }
    catch (err) {
        return res.status(500).json({ error: 'fetch_analyses_failed', message: err.message });
    }
});
/**
 * GET /dashboard/stats
 * Get user's analysis statistics
 */
router.get('/stats', auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ error: 'unauthorized' });
        }
        const stats = await (0, analysisHistoryService_1.getUserAnalysisStats)(req.userId);
        return res.json({
            ok: true,
            stats,
        });
    }
    catch (err) {
        return res.status(500).json({ error: 'fetch_stats_failed', message: err.message });
    }
});
exports.default = router;
//# sourceMappingURL=dashboard.js.map