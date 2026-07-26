import { describe, expect, it } from "vitest";
import {
  buildTopicRollups,
  computeConfidenceTier,
  confidencePercent,
  type RawAttemptRow,
} from "./wordHistory";

function attempt(
  topic: string,
  createdAt: string,
  answers: { wordId: string; isCorrect: boolean; orderIndex: number }[]
): RawAttemptRow {
  return { id: `${topic}-${createdAt}`, topic, createdAt: new Date(createdAt), answers };
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
    expect(rollup.words).toEqual([{ wordId: "w1", attemptCount: 1, lastCorrect: true }]);
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
    expect(
      confidencePercent([
        { wordId: "w1", attemptCount: 1, lastCorrect: true },
        { wordId: "w2", attemptCount: 1, lastCorrect: true },
      ])
    ).toBe(100);
  });

  it("computes the percent of distinct words whose last attempt was correct", () => {
    expect(
      confidencePercent([
        { wordId: "w1", attemptCount: 1, lastCorrect: true },
        { wordId: "w2", attemptCount: 1, lastCorrect: false },
      ])
    ).toBe(50);
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
