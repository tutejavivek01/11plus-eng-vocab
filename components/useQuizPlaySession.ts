"use client";

import { useEffect, useState } from "react";
import type { GeneratedQuestion } from "@/lib/quiz/generateQuiz";

export interface AnsweredQuestion {
  wordId: string;
  questionType: GeneratedQuestion["questionType"];
  variant?: GeneratedQuestion["variant"];
  prompt: string;
  selectedText: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface PlaySessionFeedback {
  isCorrect: boolean;
  correctText: string;
  explanation?: string;
}

export interface SubmitResultAnswer {
  prompt: string;
  selectedText: string;
  correctText: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface SubmitResult {
  attemptId: string;
  score: number;
  length: number;
  results: SubmitResultAnswer[];
}

export interface UseQuizPlaySessionOptions {
  enabled: boolean;
  invalidSetupMessage?: string;
  fetchQuestions: () => Promise<GeneratedQuestion[]>;
  checkAnswer: (question: GeneratedQuestion, selectedText: string) => Promise<PlaySessionFeedback>;
  submit: (answers: AnsweredQuestion[]) => Promise<SubmitResult>;
}

export function useQuizPlaySession(options: UseQuizPlaySessionOptions) {
  const [questions, setQuestions] = useState<GeneratedQuestion[] | null>(null);
  const [error, setError] = useState<string | null>(() =>
    options.enabled ? null : (options.invalidSetupMessage ?? "Invalid setup.")
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnsweredQuestion[]>([]);
  const [feedback, setFeedback] = useState<PlaySessionFeedback | null>(null);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);

  useEffect(() => {
    if (!options.enabled) return;
    options.fetchQuestions()
      .then(setQuestions)
      .catch((e: Error) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSelect(option: string) {
    if (!questions || checking || feedback) return;
    const question = questions[currentIndex];
    setChecking(true);
    try {
      const result = await options.checkAnswer(question, option);
      setFeedback(result);
      setAnswers((prev) => [
        ...prev,
        {
          wordId: question.wordId,
          questionType: question.questionType,
          variant: question.variant,
          prompt: question.prompt,
          selectedText: option,
          isCorrect: result.isCorrect,
          explanation: result.explanation,
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
      const result = await options.submit(answers);
      setSubmitResult(result);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return {
    questions,
    error,
    currentIndex,
    answers,
    feedback,
    checking,
    submitting,
    submitResult,
    handleSelect,
    handleNext,
  };
}
