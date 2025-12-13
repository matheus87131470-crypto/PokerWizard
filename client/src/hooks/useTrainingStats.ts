import { useState, useEffect } from 'react';

interface TrainingStats {
  totalHands: number;
  correctDecisions: number;
  incorrectDecisions: number;
  accuracy: number;
  currentStreak: number;
  bestStreak: number;
  handsPerPosition: Record<string, number>;
  accuracyPerPosition: Record<string, number>;
  sessionStart: Date;
  totalScore: number;
}

export function useTrainingStats() {
  const [stats, setStats] = useState<TrainingStats>(() => {
    const saved = localStorage.getItem('trainingStats');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        sessionStart: new Date(parsed.sessionStart)
      };
    }
    return {
      totalHands: 0,
      correctDecisions: 0,
      incorrectDecisions: 0,
      accuracy: 0,
      currentStreak: 0,
      bestStreak: 0,
      handsPerPosition: {},
      accuracyPerPosition: {},
      sessionStart: new Date(),
      totalScore: 0
    };
  });

  useEffect(() => {
    localStorage.setItem('trainingStats', JSON.stringify(stats));
  }, [stats]);

  const recordDecision = (correct: boolean, position: string, score: number) => {
    setStats(prev => {
      const newStats = {
        ...prev,
        totalHands: prev.totalHands + 1,
        correctDecisions: correct ? prev.correctDecisions + 1 : prev.correctDecisions,
        incorrectDecisions: correct ? prev.incorrectDecisions : prev.incorrectDecisions + 1,
        currentStreak: correct ? prev.currentStreak + 1 : 0,
        bestStreak: correct 
          ? Math.max(prev.bestStreak, prev.currentStreak + 1)
          : prev.bestStreak,
        totalScore: prev.totalScore + score,
        handsPerPosition: {
          ...prev.handsPerPosition,
          [position]: (prev.handsPerPosition[position] || 0) + 1
        },
        accuracyPerPosition: {
          ...prev.accuracyPerPosition,
          [position]: calculatePositionAccuracy(
            prev.accuracyPerPosition[position] || 0,
            prev.handsPerPosition[position] || 0,
            correct
          )
        }
      };

      newStats.accuracy = (newStats.correctDecisions / newStats.totalHands) * 100;
      
      return newStats;
    });
  };

  const resetStats = () => {
    const newStats: TrainingStats = {
      totalHands: 0,
      correctDecisions: 0,
      incorrectDecisions: 0,
      accuracy: 0,
      currentStreak: 0,
      bestStreak: 0,
      handsPerPosition: {},
      accuracyPerPosition: {},
      sessionStart: new Date(),
      totalScore: 0
    };
    setStats(newStats);
    localStorage.setItem('trainingStats', JSON.stringify(newStats));
  };

  const getSessionDuration = (): string => {
    const now = new Date();
    const diff = now.getTime() - stats.sessionStart.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  return {
    stats,
    recordDecision,
    resetStats,
    getSessionDuration
  };
}

function calculatePositionAccuracy(
  currentAccuracy: number,
  handsPlayed: number,
  wasCorrect: boolean
): number {
  if (handsPlayed === 0) {
    return wasCorrect ? 100 : 0;
  }
  
  const totalCorrect = (currentAccuracy * handsPlayed) / 100;
  const newTotal = totalCorrect + (wasCorrect ? 1 : 0);
  const newHands = handsPlayed + 1;
  
  return (newTotal / newHands) * 100;
}

interface SessionHistory {
  id: string;
  date: Date;
  hands: number;
  accuracy: number;
  score: number;
  duration: string;
}

export function useSessionHistory() {
  const [history, setHistory] = useState<SessionHistory[]>(() => {
    const saved = localStorage.getItem('sessionHistory');
    if (saved) {
      return JSON.parse(saved).map((s: any) => ({
        ...s,
        date: new Date(s.date)
      }));
    }
    return [];
  });

  const saveSession = (stats: TrainingStats, duration: string) => {
    const session: SessionHistory = {
      id: Date.now().toString(),
      date: new Date(),
      hands: stats.totalHands,
      accuracy: stats.accuracy,
      score: stats.totalScore,
      duration
    };

    const newHistory = [session, ...history].slice(0, 50); // Keep last 50 sessions
    setHistory(newHistory);
    localStorage.setItem('sessionHistory', JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('sessionHistory');
  };

  return {
    history,
    saveSession,
    clearHistory
  };
}
