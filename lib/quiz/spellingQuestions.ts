import type { GeneratedQuestion } from "./generateQuiz";

export const SPELLING_OPTIONS = ["A", "B", "C", "D", "E"] as const;

export interface SpellingQuestionRecord {
  id: string;
  sentence: string;
  correctOption: string;
  explanation: string;
}

export function toGeneratedSpellingQuestion(record: SpellingQuestionRecord): GeneratedQuestion {
  return {
    wordId: record.id,
    questionType: "SPOT_MISSPELLING",
    prompt: record.sentence,
    options: [...SPELLING_OPTIONS],
  };
}
