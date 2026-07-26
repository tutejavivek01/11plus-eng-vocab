"use client";

import { useRouter } from "next/navigation";
import { QuestionCard } from "@/components/QuestionCard";
import { SpellingQuestionCard } from "@/components/SpellingQuestionCard";
import { ScoreSummary } from "@/components/ScoreSummary";
import { MissedQuestionsReview } from "@/components/MissedQuestionsReview";
import { QuizProgressSmilies, type AnswerStatus } from "@/components/QuizProgressSmilies";
import { useQuizPlaySession, type AnsweredQuestion, type SubmitResult } from "@/components/useQuizPlaySession";
import { formatTestName } from "@/lib/quiz/fixedTests";

export function PracticeTestPlayClient({ number }: { number: number }) {
  const router = useRouter();

  const {
    questions,
    error,
    currentIndex,
    answers,
    feedback,
    submitting,
    submitResult,
    handleSelect,
    handleNext,
  } = useQuizPlaySession({
    enabled: true,
    fetchQuestions: async () => {
      const res = await fetch(`/api/practice-tests/${number}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load test");
      return data.questions;
    },
    checkAnswer: async (question, selectedText) => {
      const res = await fetch(`/api/practice-tests/${number}/check-answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fixedTestQuestionId: question.wordId, selectedText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to check answer");
      return { isCorrect: data.isCorrect, correctText: data.correctText, explanation: data.explanation };
    },
    submit: async (answers: AnsweredQuestion[]): Promise<SubmitResult> => {
      const res = await fetch(`/api/practice-tests/${number}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: answers.map((a) => ({ fixedTestQuestionId: a.wordId, selectedText: a.selectedText })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to submit test");
      return data;
    },
  });

  if (error) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 p-6">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </main>
    );
  }

  if (submitResult) {
    const missed = submitResult.results.filter((r) => !r.isCorrect);
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 p-6">
        <h1 className="text-center text-lg font-semibold">{formatTestName(number)}</h1>
        <ScoreSummary score={submitResult.score} length={submitResult.length} />
        <MissedQuestionsReview missed={missed} />
        <button
          type="button"
          onClick={() => router.push("/practice-tests")}
          className="w-full rounded-full bg-foreground px-5 py-3 font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          Back to Practice Tests
        </button>
      </main>
    );
  }

  if (!questions) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center p-6">
        <p>Loading test...</p>
      </main>
    );
  }

  const question = questions[currentIndex];
  const smileyStatuses: AnswerStatus[] = Array.from({ length: questions.length }, (_, i) =>
    answers[i] === undefined ? "unanswered" : answers[i].isCorrect ? "correct" : "incorrect"
  );

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 p-6">
      <p className="text-sm text-zinc-500">
        {formatTestName(number)} — Question {currentIndex + 1} of {questions.length}
      </p>
      {question.questionType === "SPOT_MISSPELLING" ? (
        <SpellingQuestionCard
          question={question}
          selected={answers[currentIndex]?.selectedText ?? null}
          feedback={feedback}
          onSelect={handleSelect}
        />
      ) : (
        <QuestionCard
          question={question}
          selected={answers[currentIndex]?.selectedText ?? null}
          feedback={feedback}
          onSelect={handleSelect}
        />
      )}
      <QuizProgressSmilies statuses={smileyStatuses} />
      {feedback && (
        <button
          type="button"
          onClick={handleNext}
          disabled={submitting}
          className="w-full rounded-full bg-foreground px-5 py-3 font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
        >
          {submitting ? "Submitting..." : currentIndex + 1 < questions.length ? "Next question" : "See results"}
        </button>
      )}
    </main>
  );
}
