import { describe, expect, it } from "vitest";
import {
  buildTopicRollups,
  computeConfidenceTier,
  confidencePercent,
  type RawAnswerRow,
  type RawAttemptRow,
  type WordAttemptSummary,
} from "./wordHistory";

function wordSummary(wordId: string, lastCorrect: boolean): WordAttemptSummary {
  return {
    wordId,
    attemptCount: 1,
    lastCorrect,
    lastPromptText: `prompt-${wordId}`,
    lastSelectedText: "correct",
    lastCorrectText: "correct",
    lastExplanation: null,
  };
}

function attempt(
  topic: string,
  createdAt: string,
  answers: Array<Pick<RawAnswerRow, "wordId" | "isCorrect" | "orderIndex"> & Partial<RawAnswerRow>>
): RawAttemptRow {
  return {
    id: `${topic}-${createdAt}`,
    topic,
    createdAt: new Date(createdAt),
    answers: answers.map((a) => ({
      promptText: `prompt-${a.wordId}`,
      selectedText: a.isCorrect ? "correct" : "wrong",
      correctText: "correct",
      explanation: null,
      ...a,
    })),
  };
}

describe("buildTopicRollups", () => {
  it("returns an empty map for no attempts", () => {
    expect(buildTopicRollups([]).size).toBe(0);
  });

  it("tracks a single word from a single attempt", () => {
    const rollups = buildTopicRollups([
      attempt("synonyms", "2026-01-01", [{ wordId: "w1", isCorrect: true, orderIndex: 0 }]),
    ]);
    const rollup = rollups.get("synonyms")!;
    expect(rollup.testsCount).toBe(1);
    expect(rollup.questionsCount).toBe(1);
    expect(rollup.words).toEqual([
      {
        wordId: "w1",
        attemptCount: 1,
        lastCorrect: true,
        lastPromptText: "prompt-w1",
        lastSelectedText: "correct",
        lastCorrectText: "correct",
        lastExplanation: null,
      },
    ]);
  });

  it("carries the last attempt's promptText/selectedText/correctText/explanation through", () => {
    const rollups = buildTopicRollups([
      attempt("spellings", "2026-01-01", [
        {
          wordId: "sq1",
          isCorrect: true,
          orderIndex: 0,
          promptText: "The cat [A] sat. No error [B]",
          selectedText: "B",
          correctText: "B",
          explanation: "All correct.",
        },
      ]),
      attempt("spellings", "2026-01-02", [
        {
          wordId: "sq1",
          isCorrect: false,
          orderIndex: 0,
          promptText: "The cat [A] sat. No error [B]",
          selectedText: "A",
          correctText: "B",
          explanation: "All correct.",
        },
      ]),
    ]);
    const word = rollups.get("spellings")!.words.find((w) => w.wordId === "sq1")!;
    expect(word.lastSelectedText).toBe("A");
    expect(word.lastCorrectText).toBe("B");
    expect(word.lastExplanation).toBe("All correct.");
  });

  it("uses the later attempt's result as the last status for a word answered across two attempts", () => {
    const rollups = buildTopicRollups([
      attempt("synonyms", "2026-01-01", [{ wordId: "w1", isCorrect: true, orderIndex: 0 }]),
      attempt("synonyms", "2026-01-02", [{ wordId: "w1", isCorrect: false, orderIndex: 0 }]),
    ]);
    const word = rollups.get("synonyms")!.words.find((w) => w.wordId === "w1")!;
    expect(word.lastCorrect).toBe(false);
    expect(word.attemptCount).toBe(2);
  });

  it("is insensitive to input order — sorts attempts by createdAt before folding", () => {
    const rollups = buildTopicRollups([
      attempt("synonyms", "2026-01-02", [{ wordId: "w1", isCorrect: false, orderIndex: 0 }]),
      attempt("synonyms", "2026-01-01", [{ wordId: "w1", isCorrect: true, orderIndex: 0 }]),
    ]);
    const word = rollups.get("synonyms")!.words.find((w) => w.wordId === "w1")!;
    expect(word.lastCorrect).toBe(false);
  });

  it("breaks ties within the same attempt by higher orderIndex", () => {
    const rollups = buildTopicRollups([
      attempt("synonyms", "2026-01-01", [
        { wordId: "w1", isCorrect: true, orderIndex: 5 },
        { wordId: "w1", isCorrect: false, orderIndex: 2 },
      ]),
    ]);
    const word = rollups.get("synonyms")!.words.find((w) => w.wordId === "w1")!;
    expect(word.lastCorrect).toBe(true);
    expect(word.attemptCount).toBe(2);
  });

  it("keeps topics isolated from one another", () => {
    const rollups = buildTopicRollups([
      attempt("synonyms", "2026-01-01", [{ wordId: "w1", isCorrect: true, orderIndex: 0 }]),
      attempt("antonyms", "2026-01-01", [{ wordId: "w1", isCorrect: false, orderIndex: 0 }]),
    ]);
    expect(rollups.get("synonyms")!.words.find((w) => w.wordId === "w1")!.lastCorrect).toBe(true);
    expect(rollups.get("antonyms")!.words.find((w) => w.wordId === "w1")!.lastCorrect).toBe(false);
  });

  it("aggregates testsCount and questionsCount per topic", () => {
    const rollups = buildTopicRollups([
      attempt("synonyms", "2026-01-01", [
        { wordId: "w1", isCorrect: true, orderIndex: 0 },
        { wordId: "w2", isCorrect: true, orderIndex: 1 },
      ]),
      attempt("synonyms", "2026-01-02", [{ wordId: "w1", isCorrect: true, orderIndex: 0 }]),
    ]);
    const rollup = rollups.get("synonyms")!;
    expect(rollup.testsCount).toBe(2);
    expect(rollup.questionsCount).toBe(3);
  });
});

describe("confidencePercent", () => {
  it("returns null for no attempted words", () => {
    expect(confidencePercent([])).toBeNull();
  });

  it("returns 100 when every word's last attempt was correct", () => {
    expect(confidencePercent([wordSummary("w1", true), wordSummary("w2", true)])).toBe(100);
  });

  it("computes the percent of distinct words whose last attempt was correct", () => {
    expect(confidencePercent([wordSummary("w1", true), wordSummary("w2", false)])).toBe(50);
  });
});

describe("computeConfidenceTier", () => {
  it("returns 'none' for null percent", () => {
    expect(computeConfidenceTier(null)).toBe("none");
  });

  it.each([
    [100, "high"],
    [80, "high"],
    [79.99, "medium"],
    [60, "medium"],
    [59.99, "low"],
    [40, "low"],
    [39.99, "worried"],
    [0, "worried"],
  ] as const)("classifies %s%% as %s", (percent, tier) => {
    expect(computeConfidenceTier(percent)).toBe(tier);
  });
});
