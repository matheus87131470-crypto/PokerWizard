"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const aiAnalysisService_1 = require("../services/aiAnalysisService");
const auth_1 = require("../middleware/auth");
const userService_1 = require("../services/userService");
const analysisHistoryService_1 = require("../services/analysisHistoryService");
const router = (0, express_1.Router)();
/**
 * POST /api/ai/analyze
 * Analyze a poker hand history
 * Protected route - requires authentication
 */
router.post('/analyze', auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ error: 'unauthorized' });
        }
        const { history, fileName } = req.body || {};
        if (!history || typeof history !== 'string') {
            return res.status(400).json({ error: 'invalid_history' });
        }
        // Get user
        const user = await (0, userService_1.getUserById)(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'user_not_found' });
        }
        // Size limit: 5 MB
        const maxBytes = 5 * 1024 * 1024;
        const bytes = Buffer.byteLength(history, 'utf8');
        if (bytes > maxBytes) {
            return res.status(413).json({ error: 'history_too_large', maxBytes });
        }
        // Check credits
        const hasCredit = await (0, userService_1.deductCredit)(req.userId);
        if (!hasCredit) {
            return res.status(403).json({
                ok: false,
                error: 'no_credits',
                message: 'Você atingiu o limite de análises gratuitas. Faça upgrade para premium.',
                credits: user.credits,
            });
        }
        // Perform analysis
        let analysisResult = null;
        try {
            analysisResult = await (0, aiAnalysisService_1.analyzeWithOpenAI)(history);
        }
        catch (e) {
            // Fallback to mock analysis
            analysisResult = (0, aiAnalysisService_1.mockAnalyze)(history);
        }
        // Record analysis in history
        const analysis = await (0, analysisHistoryService_1.recordAnalysis)(req.userId, fileName || 'imported_history', analysisResult.stats || {}, analysisResult.analysis || analysisResult.summary || '', analysisResult.improvements || [], analysisResult.leaks || [], analysisResult.aiModelUsed);
        // Get updated user
        const updatedUser = await (0, userService_1.getUserById)(req.userId);
        return res.json({
            ok: true,
            stats: analysisResult.stats || {},
            analysis: analysisResult.analysis || analysisResult.summary || '',
            improvements: analysisResult.improvements || [],
            leaks: analysisResult.leaks || [],
            aiModelUsed: analysisResult.aiModelUsed || null,
            remaining: updatedUser?.credits || 0,
            analysisId: analysis.id,
        });
    }
    catch (err) {
        console.error('AI analyze error:', err?.message || err);
        return res.status(500).json({
            ok: false,
            error: 'internal',
            message: err?.message || String(err),
        });
    }
});
exports.default = router;
//# sourceMappingURL=ai.js.map