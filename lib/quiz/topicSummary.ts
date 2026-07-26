import { TOPICS } from "./constants";
import {
  computeConfidenceTier,
  confidencePercent,
  type ConfidenceTier,
  type TopicRollup,
} from "./wordHistory";

export interface TopicSummary {
  topic: string;
  label: string;
  testsCount: number;
  questionsCount: number;
  confidencePercent: number | null;
  confidenceTier: ConfidenceTier;
}

export function buildTopicSummaries(rollups: Map<string, TopicRollup>): TopicSummary[] {
  return TOPICS.map(({ value, label }) => {
    const rollup = rollups.get(value);
    const percent = confidencePercent(rollup?.words ?? []);
    return {
      topic: value,
      label,
      testsCount: rollup?.testsCount ?? 0,
      questionsCount: rollup?.questionsCount ?? 0,
      confidencePercent: percent,
      confidenceTier: computeConfidenceTier(percent),
    };
  });
}
