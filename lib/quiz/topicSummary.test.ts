import { describe, expect, it } from "vitest";
import { TOPICS } from "./constants";
import { buildTopicSummaries } from "./topicSummary";
import type { TopicRollup } from "./wordHistory";

describe("buildTopicSummaries", () => {
  it("always returns exactly the 4 canonical topics, in order, when given no data", () => {
    const summaries = buildTopicSummaries(new Map());
    expect(summaries.map((s) => s.topic)).toEqual(TOPICS.map((t) => t.value));
    for (const summary of summaries) {
      expect(summary.testsCount).toBe(0);
      expect(summary.questionsCount).toBe(0);
      expect(summary.confidencePercent).toBeNull();
      expect(summary.confidenceTier).toBe("none");
    }
  });

  it("fills in real data for topics present in the rollups map and defaults the rest", () => {
    const rollups = new Map<string, TopicRollup>([
      [
        "synonyms",
        {
          topic: "synonyms",
          testsCount: 2,
          questionsCount: 10,
          words: [
            {
              wordId: "w1",
              attemptCount: 1,
              lastCorrect: true,
              lastPromptText: "prompt-w1",
              lastSelectedText: "correct",
              lastCorrectText: "correct",
              lastExplanation: null,
            },
            {
              wordId: "w2",
              attemptCount: 1,
              lastCorrect: false,
              lastPromptText: "prompt-w2",
              lastSelectedText: "wrong",
              lastCorrectText: "correct",
              lastExplanation: null,
            },
          ],
        },
      ],
    ]);

    const summaries = buildTopicSummaries(rollups);
    const synonyms = summaries.find((s) => s.topic === "synonyms")!;
    expect(synonyms.testsCount).toBe(2);
    expect(synonyms.questionsCount).toBe(10);
    expect(synonyms.confidencePercent).toBe(50);
    expect(synonyms.confidenceTier).toBe("low");

    const antonyms = summaries.find((s) => s.topic === "antonyms")!;
    expect(antonyms.testsCount).toBe(0);
    expect(antonyms.confidenceTier).toBe("none");
  });

  it("includes the correct label for each topic", () => {
    const summaries = buildTopicSummaries(new Map());
    const bySynonyms = summaries.find((s) => s.topic === "synonyms")!;
    expect(bySynonyms.label).toBe("Synonyms");
  });
});
