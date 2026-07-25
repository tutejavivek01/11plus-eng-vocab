import { describe, expect, it } from "vitest";
import { computeHistoryStats } from "./stats";

describe("computeHistoryStats", () => {
  it("returns zeroed stats and no best topic for an empty history", () => {
    const stats = computeHistoryStats([]);
    expect(stats).toEqual({ totalAttempts: 0, averageScorePercent: 0, bestTopic: null });
  });

  it("computes overall average score percent across attempts of different lengths", () => {
    const stats = computeHistoryStats([
      { topic: "synonyms", length: 10, score: 8 },
      { topic: "synonyms", length: 5, score: 5 },
    ]);
    expect(stats.totalAttempts).toBe(2);
    // (0.8 + 1.0) / 2 * 100 = 90
    expect(stats.averageScorePercent).toBe(90);
  });

  it("does not name a best topic when no topic has reached the minimum attempt count", () => {
    const stats = computeHistoryStats([
      { topic: "synonyms", length: 10, score: 10 },
      { topic: "antonyms", length: 10, score: 2 },
    ]);
    expect(stats.bestTopic).toBeNull();
  });

  it("names the topic with the highest average once it has enough attempts", () => {
    const stats = computeHistoryStats([
      { topic: "synonyms", length: 10, score: 5 },
      { topic: "synonyms", length: 10, score: 5 },
      { topic: "antonyms", length: 10, score: 9 },
      { topic: "antonyms", length: 10, score: 9 },
    ]);
    expect(stats.bestTopic).toEqual({ topic: "antonyms", averageScorePercent: 90 });
  });

  it("breaks ties deterministically by keeping the first topic encountered", () => {
    const stats = computeHistoryStats([
      { topic: "synonyms", length: 10, score: 8 },
      { topic: "synonyms", length: 10, score: 8 },
      { topic: "antonyms", length: 10, score: 8 },
      { topic: "antonyms", length: 10, score: 8 },
    ]);
    expect(stats.bestTopic?.topic).toBe("synonyms");
  });
});
