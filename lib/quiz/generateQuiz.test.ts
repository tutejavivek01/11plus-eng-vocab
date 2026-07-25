import { describe, expect, it } from "vitest";
import { generateQuiz, InsufficientWordsError, type WordRecord } from "./generateQuiz";

function makePool(count: number, { withSynonyms = true }: { withSynonyms?: boolean } = {}): WordRecord[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `word-${i}`,
    word: `word${i}`,
    definition: `definition${i}`,
    synonym: withSynonyms ? `synonym${i}` : null,
    antonym: withSynonyms ? `antonym${i}` : null,
  }));
}

function correctAnswerFor(
  pool: WordRecord[],
  wordId: string,
  questionType: string,
  variant?: string
): string {
  const w = pool.find((word) => word.id === wordId)!;
  if (questionType === "WORD_TO_DEFINITION") return w.definition;
  if (questionType === "DEFINITION_TO_WORD") return w.word;
  return variant === "SYNONYM" ? w.synonym! : w.antonym!;
}

describe("generateQuiz", () => {
  it("returns exactly `length` questions", () => {
    const pool = makePool(30);
    const questions = generateQuiz(pool, 10);
    expect(questions).toHaveLength(10);
  });

  it("throws InsufficientWordsError when the pool is smaller than length", () => {
    const pool = makePool(5);
    expect(() => generateQuiz(pool, 10)).toThrow(InsufficientWordsError);
  });

  it("always includes the correct answer among the 4 options", () => {
    const pool = makePool(30);
    const questions = generateQuiz(pool, 20);
    for (const q of questions) {
      const correct = correctAnswerFor(pool, q.wordId, q.questionType, q.variant);
      expect(q.options).toContain(correct);
    }
  });

  it("never produces duplicate option text within a question", () => {
    const pool = makePool(30);
    const questions = generateQuiz(pool, 20);
    for (const q of questions) {
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options).size).toBe(4);
    }
  });

  it("never assigns SYNONYM_ANTONYM when no word in the pool has synonym/antonym data", () => {
    const pool = makePool(30, { withSynonyms: false });
    const questions = generateQuiz(pool, 20);
    expect(questions.every((q) => q.questionType !== "SYNONYM_ANTONYM")).toBe(true);
  });

  it("mixes question types across a quiz when data supports it", () => {
    const pool = makePool(30);
    const questions = generateQuiz(pool, 20);
    const types = new Set(questions.map((q) => q.questionType));
    expect(types.size).toBeGreaterThan(1);
  });

  it("does not leak the correct answer as a separate field", () => {
    const pool = makePool(30);
    const questions = generateQuiz(pool, 5);
    for (const q of questions) {
      expect(q).not.toHaveProperty("correctText");
      expect(q).not.toHaveProperty("correctIndex");
    }
  });
});
