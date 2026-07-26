import type { SpellingQuestionRecord } from "./spellingQuestions";

export interface SubmittedSpellingAnswer {
  wordId: string;
  questionType: "SPOT_MISSPELLING";
  prompt: string;
  selectedText: string;
}

export interface SpellingAnswerResult {
  wordId: string;
  questionType: "SPOT_MISSPELLING";
  prompt: string;
  selectedText: string;
  correctText: string;
  explanation: string;
  isCorrect: boolean;
}

export class UnknownSpellingQuestionError extends Error {}

export function validateSpellingAnswers(
  questions: SpellingQuestionRecord[],
  answers: SubmittedSpellingAnswer[]
): { score: number; results: SpellingAnswerResult[] } {
  const questionsById = new Map(questions.map((q) => [q.id, q]));

  const results: SpellingAnswerResult[] = answers.map((answer) => {
    const question = questionsById.get(answer.wordId);
    if (!question) {
      throw new UnknownSpellingQuestionError(`Spelling question ${answer.wordId} was not found.`);
    }
    return {
      wordId: answer.wordId,
      questionType: answer.questionType,
      prompt: answer.prompt,
      selectedText: answer.selectedText,
      correctText: question.correctOption,
      explanation: question.explanation,
      isCorrect: answer.selectedText === question.correctOption,
    };
  });

  const score = results.filter((r) => r.isCorrect).length;
  return { score, results };
}
