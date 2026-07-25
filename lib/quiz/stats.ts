export interface AttemptSummary {
  topic: string;
  length: number;
  score: number;
}

export interface HistoryStats {
  totalAttempts: number;
  averageScorePercent: number;
  bestTopic: { topic: string; averageScorePercent: number } | null;
}

const MIN_ATTEMPTS_FOR_BEST_TOPIC = 2;

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function computeHistoryStats(attempts: AttemptSummary[]): HistoryStats {
  if (attempts.length === 0) {
    return { totalAttempts: 0, averageScorePercent: 0, bestTopic: null };
  }

  const totalAttempts = attempts.length;
  const overallPercent =
    (attempts.reduce((sum, a) => sum + a.score / a.length, 0) / totalAttempts) * 100;

  const byTopic = new Map<string, { sum: number; count: number }>();
  for (const a of attempts) {
    const entry = byTopic.get(a.topic) ?? { sum: 0, count: 0 };
    entry.sum += a.score / a.length;
    entry.count += 1;
    byTopic.set(a.topic, entry);
  }

  let bestTopic: { topic: string; averageScorePercent: number } | null = null;
  for (const [topic, { sum, count }] of byTopic) {
    if (count < MIN_ATTEMPTS_FOR_BEST_TOPIC) continue;
    const avg = (sum / count) * 100;
    if (!bestTopic || avg > bestTopic.averageScorePercent) {
      bestTopic = { topic, averageScorePercent: avg };
    }
  }

  return {
    totalAttempts,
    averageScorePercent: round1(overallPercent),
    bestTopic: bestTopic ? { topic: bestTopic.topic, averageScorePercent: round1(bestTopic.averageScorePercent) } : null,
  };
}
