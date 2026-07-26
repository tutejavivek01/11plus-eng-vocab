"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { QuestionCard } from "@/components/QuestionCard";
import { ScoreSummary } from "@/components/ScoreSummary";
import { MissedQuestionsReview } from "@/components/MissedQuestionsReview";
import { QuizProgressSmilies, type AnswerStatus } from "@/components/QuizProgressSmilies";
import type { GeneratedQuestion, QuestionType, Variant } from "@/lib/quiz/generateQuiz";
import { ALLOWED_QUIZ_LENGTHS, TOPICS, type QuizLength, type Topic } from "@/lib/quiz/constants";

interface AnsweredQuestion {
  wordId: string;
  questionType: QuestionType;
  variant?: Variant;
  prompt: string;
  selectedText: string;
  isCorrect: boolean;
}

export interface SubmitResultAnswer {
  prompt: string;
  selectedText: string;
  correctText: string;
  isCorrect: boolean;
}

export interface SubmitResult {
  attemptId: string;
  score: number;
  length: number;
  results: SubmitResultAnswer[];
}

function isValidSetup(topic: string | null, length: number): topic is Topic {
  return Boolean(topic) && TOPICS.some((t) => t.value === topic) && ALLOWED_QUIZ_LENGTHS.includes(length as QuizLength);
}

export function QuizPlayClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const topic = searchParams.get("topic");
  const length = Number(searchParams.get("length"));

  const [questions, setQuestions] = useState<GeneratedQuestion[] | null>(null);
  const [error, setError] = useState<string | null>(() =>
    isValidSetup(topic, length) ? null : "Invalid quiz setup. Please go back and choose a topic and length."
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnsweredQuestion[]>([]);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; correctText: string } | null>(null);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);

  useEffect(() => {
    if (!isValidSetup(topic, length)) {
      return;
    }
    fetch("/api/quiz/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, length }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to generate quiz");
        setQuestions(data.questions);
      })
      .catch((e: Error) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSelect(option: string) {
    if (!questions || checking || feedback) return;
    const question = questions[currentIndex];
    setChecking(true);
    try {
      const res = await fetch("/api/quiz/check-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wordId: question.wordId,
          questionType: question.questionType,
          variant: question.variant,
          selectedText: option,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to check answer");
      setFeedback({ isCorrect: data.isCorrect, correctText: data.correctText });
      setAnswers((prev) => [
        ...prev,
        {
          wordId: question.wordId,
          questionType: question.questionType,
          variant: question.variant,
          prompt: question.prompt,
          selectedText: option,
          isCorrect: data.isCorrect,
        },
      ]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setChecking(false);
    }
  }

  async function handleNext() {
    if (!questions) return;
    if (currentIndex + 1 < questions.length) {
      setFeedback(null);
      setCurrentIndex((i) => i + 1);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, length, answers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to submit quiz");
      setSubmitResult(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

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
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 p-6">
      <p className="text-sm text-zinc-500">
        Question {currentIndex + 1} of {questions.length}
      </p>
      <QuestionCard
        question={question}
        selected={answers[currentIndex]?.selectedText ?? null}
        feedback={feedback}
        onSelect={handleSelect}
      />
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
