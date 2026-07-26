import { describe, expect, it } from "vitest";
import { SPELLING_OPTIONS, toGeneratedSpellingQuestion, type SpellingQuestionRecord } from "./spellingQuestions";

describe("toGeneratedSpellingQuestion", () => {
  it("maps a SpellingQuestionRecord to a GeneratedQuestion using the sentence as the prompt", () => {
    const record: SpellingQuestionRecord = {
      id: "sq1",
      sentence: "The goverment [A] decided to accommodate [B] all the guests [C]. No error [D]",
      correctOption: "A",
      explanation: "Goverment is spelt incorrectly.",
    };
    const question = toGeneratedSpellingQuestion(record);
    expect(question.wordId).toBe("sq1");
    expect(question.questionType).toBe("SPOT_MISSPELLING");
    expect(question.prompt).toBe(record.sentence);
  });

  it("always returns the fixed A-E options in order, regardless of the record", () => {
    const record: SpellingQuestionRecord = {
      id: "sq2",
      sentence: "Some sentence.",
      correctOption: "E",
      explanation: "All correct.",
    };
    const question = toGeneratedSpellingQuestion(record);
    expect(question.options).toEqual(["A", "B", "C", "D", "E"]);
    expect(question.options).toEqual([...SPELLING_OPTIONS]);
  });
});
