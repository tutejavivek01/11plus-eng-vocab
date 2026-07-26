import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TOPICS } from "@/lib/quiz/constants";
import type { TopicSummary } from "@/lib/quiz/topicSummary";
import { TopicSummaryChart } from "./TopicSummaryChart";

function summary(topic: string, label: string, testsCount: number, questionsCount: number): TopicSummary {
  return {
    topic,
    label,
    testsCount,
    questionsCount,
    confidencePercent: null,
    confidenceTier: "none",
  };
}

describe("TopicSummaryChart", () => {
  it("renders one row per topic in TOPICS order", () => {
    const summaries = TOPICS.map((t) => summary(t.value, t.label, 0, 0));
    render(<TopicSummaryChart summaries={summaries} />);
    for (const t of TOPICS) {
      expect(screen.getByText(t.label)).toBeInTheDocument();
    }
  });

  it("renders count labels for a topic with data", () => {
    const summaries = [
      summary("synonyms", "Synonyms", 4, 20),
      ...TOPICS.slice(1).map((t) => summary(t.value, t.label, 0, 0)),
    ];
    render(<TopicSummaryChart summaries={summaries} />);
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
  });

  it("does not throw or divide by zero when every topic has zero counts", () => {
    const summaries = TOPICS.map((t) => summary(t.value, t.label, 0, 0));
    expect(() => render(<TopicSummaryChart summaries={summaries} />)).not.toThrow();
    expect(screen.getAllByText("0").length).toBe(TOPICS.length * 2);
  });
});
