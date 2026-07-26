import { prisma } from "@/lib/prisma";

export interface RawAnswerRow {
  wordId: string;
  isCorrect: boolean;
  orderIndex: number;
  promptText: string;
  selectedText: string;
  correctText: string;
  explanation: string | null;
}

export interface RawAttemptRow {
  id: string;
  topic: string;
  createdAt: Date;
  answers: RawAnswerRow[];
}

export interface WordAttemptSummary {
  wordId: string;
  attemptCount: number;
  lastCorrect: boolean;
  lastPromptText: string;
  lastSelectedText: string;
  lastCorrectText: string;
  lastExplanation: string | null;
}

export interface TopicRollup {
  topic: string;
  testsCount: number;
  questionsCount: number;
  words: WordAttemptSummary[];
}

export type ConfidenceTier = "high" | "medium" | "low" | "worried" | "none";

export function buildTopicRollups(attempts: RawAttemptRow[]): Map<string, TopicRollup> {
  const rollups = new Map<string, TopicRollup>();
  const wordStateByTopic = new Map<string, Map<string, WordAttemptSummary>>();

  const sortedAttempts = [...attempts].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
  );

  for (const attempt of sortedAttempts) {
    const rollup = rollups.get(attempt.topic) ?? {
      topic: attempt.topic,
      testsCount: 0,
      questionsCount: 0,
      words: [],
    };
    rollup.testsCount += 1;
    rollup.questionsCount += attempt.answers.length;
    rollups.set(attempt.topic, rollup);

    const wordState = wordStateByTopic.get(attempt.topic) ?? new Map<string, WordAttemptSummary>();
    wordStateByTopic.set(attempt.topic, wordState);

    const sortedAnswers = [...attempt.answers].sort((a, b) => a.orderIndex - b.orderIndex);
    for (const answer of sortedAnswers) {
      const existing = wordState.get(answer.wordId);
      wordState.set(answer.wordId, {
        wordId: answer.wordId,
        attemptCount: (existing?.attemptCount ?? 0) + 1,
        lastCorrect: answer.isCorrect,
        lastPromptText: answer.promptText,
        lastSelectedText: answer.selectedText,
        lastCorrectText: answer.correctText,
        lastExplanation: answer.explanation,
      });
    }
  }

  for (const [topic, wordState] of wordStateByTopic) {
    const rollup = rollups.get(topic);
    if (rollup) {
      rollup.words = [...wordState.values()];
    }
  }

  return rollups;
}

export function confidencePercent(words: WordAttemptSummary[]): number | null {
  if (words.length === 0) return null;
  const correctCount = words.filter((w) => w.lastCorrect).length;
  return (correctCount / words.length) * 100;
}

export function computeConfidenceTier(percent: number | null): ConfidenceTier {
  if (percent === null) return "none";
  if (percent >= 80) return "high";
  if (percent >= 60) return "medium";
  if (percent >= 40) return "low";
  return "worried";
}

export async function getUserAttemptHistory(userId: string): Promise<Map<string, TopicRollup>> {
  const attempts = await prisma.quizAttempt.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      topic: true,
      createdAt: true,
      answers: {
        select: {
          wordId: true,
          isCorrect: true,
          orderIndex: true,
          promptText: true,
          selectedText: true,
          correctText: true,
          explanation: true,
        },
        orderBy: { orderIndex: "asc" },
      },
    },
  });

  return buildTopicRollups(attempts);
}
