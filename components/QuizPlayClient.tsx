"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { QuestionCard } from "@/components/QuestionCard";
import { SpellingQuestionCard } from "@/components/SpellingQuestionCard";
import { ScoreSummary } from "@/components/ScoreSummary";
import { MissedQuestionsReview } from "@/components/MissedQuestionsReview";
import { QuizProgressSmilies, type AnswerStatus } from "@/components/QuizProgressSmilies";
import { WordMeaningPanel } from "@/components/WordMeaningPanel";
import {
  useQuizPlaySession,
  type AnsweredQuestion,
  type SubmitResult,
} from "@/components/useQuizPlaySession";
import { ALLOWED_QUIZ_LENGTHS, TOPICS, type QuizLength, type Topic } from "@/lib/quiz/constants";

function isValidSetup(topic: string | null, length: number): topic is Topic {
  return Boolean(topic) && TOPICS.some((t) => t.value === topic) && ALLOWED_QUIZ_LENGTHS.includes(length as QuizLength);
}

export function QuizPlayClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const topic = searchParams.get("topic");
  const length = Number(searchParams.get("length"));
  const enabled = isValidSetup(topic, length);

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
    enabled,
    invalidSetupMessage: "Invalid quiz setup. Please go back and choose a topic and length.",
    fetchQuestions: async () => {
      const res = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, length }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate quiz");
      return data.questions;
    },
    checkAnswer: async (question, selectedText) => {
      const res = await fetch("/api/quiz/check-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wordId: question.wordId,
          questionType: question.questionType,
          variant: question.variant,
          selectedText,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to check answer");
      return { isCorrect: data.isCorrect, correctText: data.correctText, explanation: data.explanation };
    },
    submit: async (answers: AnsweredQuestion[]): Promise<SubmitResult> => {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, length, answers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to submit quiz");
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
        <ScoreSummary score={submitResult.score} length={submitResult.length} />
        <MissedQuestionsReview missed={missed} />
        <button
          type="button"
          onClick={() => router.push("/quiz/setup")}
          className="w-full rounded-full bg-foreground px-5 py-3 font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          Start another quiz
        </button>
      </main>
    );
  }

  if (!questions) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center p-6">
        <p>Loading quiz...</p>
      </main>
    );
  }

  const question = questions[currentIndex];
  const smileyStatuses: AnswerStatus[] = Array.from({ length: questions.length }, (_, i) =>
    answers[i] === undefined ? "unanswered" : answers[i].isCorrect ? "correct" : "incorrect"
  );

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-6 md:flex-row md:items-start md:justify-center">
      <div className="flex w-full max-w-md flex-1 flex-col justify-center gap-6">
        <p className="text-sm text-zinc-500">
          Question {currentIndex + 1} of {questions.length}
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
      </div>
      {question.word && (
        <div className="w-full md:w-72">
          <WordMeaningPanel word={feedback ? question.word : null} />
        </div>
      )}
    </main>
  );
}
