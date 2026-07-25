import { describe, expect, it } from "vitest";
import { validateAnswers, UnknownWordError, type SubmittedAnswer } from "./validateAnswers";
import type { WordRecord } from "./generateQuiz";

const words: WordRecord[] = [
  { id: "w1", word: "happy", definition: "feeling joy", synonym: "joyful", antonym: "sad" },
  { id: "w2", word: "big", definition: "large in size", synonym: "large", antonym: "small" },
];

describe("validateAnswers", () => {
  it("scores correct and incorrect answers accurately", () => {
    const answers: SubmittedAnswer[] = [
      { wordId: "w1", questionType: "WORD_TO_DEFINITION", prompt: "p1", selectedText: "feeling joy" },
      { wordId: "w2", questionType: "DEFINITION_TO_WORD", prompt: "p2", selectedText: "wrong answer" },
    ];
    const { score, results } = validateAnswers(words, answers);
    expect(score).toBe(1);
    expect(results[0].isCorrect).toBe(true);
    expect(results[1].isCorrect).toBe(false);
    expect(results[1].correctText).toBe("big");
  });

  it("does not trust a tampered selectedText into being marked correct", () => {
    // Client claims to have selected the correct answer's text won't matter here —
    // what matters is the server independently recomputes correctText from the DB
    // word data and compares, regardless of what the client sends.
    const answers: SubmittedAnswer[] = [
      { wordId: "w1", questionType: "WORD_TO_DEFINITION", prompt: "p1", selectedText: "large in size" },
    ];
    const { score, results } = validateAnswers(words, answers);
    expect(score).toBe(0);
    expect(results[0].isCorrect).toBe(false);
    expect(results[0].correctText).toBe("feeling joy");
  });

  it("scores synonym/antonym questions using the correct variant field", () => {
    const answers: SubmittedAnswer[] = [
      { wordId: "w1", questionType: "SYNONYM_ANTONYM", variant: "ANTONYM", prompt: "p", selectedText: "sad" },
    ];
    const { score, results } = validateAnswers(words, answers);
    expect(score).toBe(1);
    expect(results[0].correctText).toBe("sad");
  });

  it("throws UnknownWordError when a submitted wordId isn't among the fetched words", () => {
    const answers: SubmittedAnswer[] = [
      { wordId: "does-not-exist", questionType: "WORD_TO_DEFINITION", prompt: "p", selectedText: "anything" },
    ];
    expect(() => validateAnswers(words, answers)).toThrow(UnknownWordError);
  });
});
