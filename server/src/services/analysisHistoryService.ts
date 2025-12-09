import { v4 as uuid } from 'uuid';

export interface Analysis {
  id: string;
  userId: string;
  fileName: string;
  uploadedAt: Date;
  stats: {
    vpip?: number;
    pfr?: number;
    aggression_factor?: number;
  };
  analysis: string;
  improvements: string[];
  leaks: string[];
  aiModelUsed?: string;
}

// In-memory analysis history (for prototype; use DB in production)
const analyses = new Map<string, Analysis>();
const userAnalyses = new Map<string, Analysis[]>();

export async function recordAnalysis(userId: string, fileName: string, stats: any, analysis: string, improvements: string[], leaks: string[], aiModelUsed?: string): Promise<Analysis> {
  const analysisRecord: Analysis = {
    id: uuid(),
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
  userAnalyses.get(userId)!.push(analysisRecord);

  return analysisRecord;
}

export async function getUserAnalyses(userId: string, limit: number = 10): Promise<Analysis[]> {
  const userRecords = userAnalyses.get(userId) || [];
  // Return most recent first
  return userRecords.slice(-limit).reverse();
}

export async function getAnalysisById(id: string): Promise<Analysis | undefined> {
  return analyses.get(id);
}

export async function getUserAnalysisStats(userId: string) {
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
export function getAllAnalyses() {
  return Array.from(analyses.values());
}
