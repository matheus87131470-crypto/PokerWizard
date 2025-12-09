"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordAnalysis = recordAnalysis;
exports.getUserAnalyses = getUserAnalyses;
exports.getAnalysisById = getAnalysisById;
exports.getUserAnalysisStats = getUserAnalysisStats;
exports.getAllAnalyses = getAllAnalyses;
const uuid_1 = require("uuid");
// In-memory analysis history (for prototype; use DB in production)
const analyses = new Map();
const userAnalyses = new Map();
async function recordAnalysis(userId, fileName, stats, analysis, improvements, leaks, aiModelUsed) {
    const analysisRecord = {
        id: (0, uuid_1.v4)(),
        userId,
        fileName,
        uploadedAt: new Date(),
        stats,
        analysis,
        improvements,
        leaks,
        aiModelUsed,
    };
    analyses.set(analysisRecord.id, analysisRecord);
    if (!userAnalyses.has(userId)) {
        userAnalyses.set(userId, []);
    }
    userAnalyses.get(userId).push(analysisRecord);
    return analysisRecord;
}
async function getUserAnalyses(userId, limit = 10) {
    const userRecords = userAnalyses.get(userId) || [];
    // Return most recent first
    return userRecords.slice(-limit).reverse();
}
async function getAnalysisById(id) {
    return analyses.get(id);
}
async function getUserAnalysisStats(userId) {
    const userRecords = userAnalyses.get(userId) || [];
    if (userRecords.length === 0) {
        return {
            totalAnalyses: 0,
            avgVpip: 0,
            avgPfr: 0,
            avgAggressionFactor: 0,
            recentAnalyses: [],
        };
    }
    const vpips = userRecords.map(a => a.stats?.vpip || 0).filter(v => v > 0);
    const pfrs = userRecords.map(a => a.stats?.pfr || 0).filter(v => v > 0);
    const afs = userRecords.map(a => a.stats?.aggression_factor || 0).filter(v => v > 0);
    return {
        totalAnalyses: userRecords.length,
        avgVpip: vpips.length > 0 ? vpips.reduce((a, b) => a + b, 0) / vpips.length : 0,
        avgPfr: pfrs.length > 0 ? pfrs.reduce((a, b) => a + b, 0) / pfrs.length : 0,
        avgAggressionFactor: afs.length > 0 ? afs.reduce((a, b) => a + b, 0) / afs.length : 0,
        recentAnalyses: userRecords.slice(-5),
    };
}
// Export all analyses for debugging
function getAllAnalyses() {
    return Array.from(analyses.values());
}
//# sourceMappingURL=analysisHistoryService.js.map