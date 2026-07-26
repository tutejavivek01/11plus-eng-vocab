import { describe, expect, it } from "vitest";
import {
  validateSpellingAnswers,
  UnknownSpellingQuestionError,
  type SubmittedSpellingAnswer,
} from "./validateSpellingAnswers";
import type { SpellingQuestionRecord } from "./spellingQuestions";

const questions: SpellingQuestionRecord[] = [
  { id: "sq1", sentence: "The goverment [A] met. No error [B]", correctOption: "A", explanation: "Misspelled." },
  { id: "sq2", sentence: "The cat [A] sat. No error [B]", correctOption: "B", explanation: "All correct." },
];

describe("validateSpellingAnswers", () => {
  it("scores correct and incorrect answers accurately", () => {
    const answers: SubmittedSpellingAnswer[] = [
      { wordId: "sq1", questionType: "SPOT_MISSPELLING", prompt: "p1", selectedText: "A" },
      { wordId: "sq2", questionType: "SPOT_MISSPELLING", prompt: "p2", selectedText: "A" },
    ];
    const { score, results } = validateSpellingAnswers(questions, answers);
    expect(score).toBe(1);
    expect(results[0].isCorrect).toBe(true);
    expect(results[1].isCorrect).toBe(false);
    expect(results[1].correctText).toBe("B");
  });

  it("does not trust a tampered selectedText into being marked correct", () => {
    const answers: SubmittedSpellingAnswer[] = [
      { wordId: "sq1", questionType: "SPOT_MISSPELLING", prompt: "p1", selectedText: "B" },
    ];
    const { score, results } = validateSpellingAnswers(questions, answers);
    expect(score).toBe(0);
    expect(results[0].correctText).toBe("A");
  });

  it("includes the explanation on every result, correct or incorrect", () => {
    const answers: SubmittedSpellingAnswer[] = [
      { wordId: "sq1", questionType: "SPOT_MISSPELLING", prompt: "p1", selectedText: "A" },
    ];
    const { results } = validateSpellingAnswers(questions, answers);
    expect(results[0].explanation).toBe("Misspelled.");
  });

  it("throws UnknownSpellingQuestionError when a submitted wordId isn't among the fetched questions", () => {
    const answers: SubmittedSpellingAnswer[] = [
      { wordId: "does-not-exist", questionType: "SPOT_MISSPELLING", prompt: "p", selectedText: "A" },
    ];
    expect(() => validateSpellingAnswers(questions, answers)).toThrow(UnknownSpellingQuestionError);
  });
});
