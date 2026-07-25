import { getCorrectAnswer, type QuestionType, type Variant, type WordRecord } from "./generateQuiz";

export interface SubmittedAnswer {
  wordId: string;
  questionType: QuestionType;
  variant?: Variant;
  prompt: string;
  selectedText: string;
}

export interface AnswerResult {
  wordId: string;
  questionType: QuestionType;
  prompt: string;
  selectedText: string;
  correctText: string;
  isCorrect: boolean;
}

export class UnknownWordError extends Error {}

export function validateAnswers(
  words: WordRecord[],
  answers: SubmittedAnswer[]
): { score: number; results: AnswerResult[] } {
  const wordsById = new Map(words.map((w) => [w.id, w]));

  const results: AnswerResult[] = answers.map((answer) => {
    const word = wordsById.get(answer.wordId);
    if (!word) {
      throw new UnknownWordError(`Word ${answer.wordId} was not found.`);
    }
    const correctText = getCorrectAnswer(word, answer.questionType, answer.variant);
    return {
      wordId: answer.wordId,
      questionType: answer.questionType,
      prompt: answer.prompt,
      selectedText: answer.selectedText,
      correctText,
      isCorrect: answer.selectedText === correctText,
    };
  });

  const score = results.filter((r) => r.isCorrect).length;
  return { score, results };
}
