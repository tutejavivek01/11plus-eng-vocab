import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useQuizPlaySession } from "./useQuizPlaySession";
import type { GeneratedQuestion } from "@/lib/quiz/generateQuiz";

const questions: GeneratedQuestion[] = [
  { wordId: "w1", questionType: "WORD_TO_DEFINITION", prompt: "p1", options: ["a", "b"] },
  { wordId: "w2", questionType: "WORD_TO_DEFINITION", prompt: "p2", options: ["c", "d"] },
];

describe("useQuizPlaySession", () => {
  it("sets error and never fetches when enabled is false", async () => {
    const fetchQuestions = vi.fn();
    const { result } = renderHook(() =>
      useQuizPlaySession({
        enabled: false,
        invalidSetupMessage: "nope",
        fetchQuestions,
        checkAnswer: vi.fn(),
        submit: vi.fn(),
      })
    );
    expect(result.current.error).toBe("nope");
    expect(fetchQuestions).not.toHaveBeenCalled();
  });

  it("fetches questions on mount when enabled", async () => {
    const fetchQuestions = vi.fn().mockResolvedValue(questions);
    const { result } = renderHook(() =>
      useQuizPlaySession({
        enabled: true,
        fetchQuestions,
        checkAnswer: vi.fn(),
        submit: vi.fn(),
      })
    );
    await waitFor(() => expect(result.current.questions).toEqual(questions));
  });

  it("handleSelect records an answer and sets feedback", async () => {
    const checkAnswer = vi.fn().mockResolvedValue({ isCorrect: true, correctText: "a" });
    const { result } = renderHook(() =>
      useQuizPlaySession({
        enabled: true,
        fetchQuestions: vi.fn().mockResolvedValue(questions),
        checkAnswer,
        submit: vi.fn(),
      })
    );
    await waitFor(() => expect(result.current.questions).not.toBeNull());

    await act(async () => {
      await result.current.handleSelect("a");
    });

    expect(checkAnswer).toHaveBeenCalledWith(questions[0], "a");
    expect(result.current.feedback).toEqual({ isCorrect: true, correctText: "a" });
    expect(result.current.answers).toHaveLength(1);
    expect(result.current.answers[0]).toMatchObject({ wordId: "w1", selectedText: "a", isCorrect: true });
  });

  it("handleNext advances to the next question, then submits on the last one", async () => {
    const submitResult = { attemptId: "a1", score: 2, length: 2, results: [] };
    const checkAnswer = vi.fn().mockResolvedValue({ isCorrect: true, correctText: "a" });
    const submit = vi.fn().mockResolvedValue(submitResult);
    const { result } = renderHook(() =>
      useQuizPlaySession({
        enabled: true,
        fetchQuestions: vi.fn().mockResolvedValue(questions),
        checkAnswer,
        submit,
      })
    );
    await waitFor(() => expect(result.current.questions).not.toBeNull());

    await act(async () => {
      await result.current.handleSelect("a");
    });
    await act(async () => {
      await result.current.handleNext();
    });
    expect(result.current.currentIndex).toBe(1);
    expect(submit).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.handleSelect("c");
    });
    await act(async () => {
      await result.current.handleNext();
    });
    expect(submit).toHaveBeenCalledOnce();
    expect(result.current.submitResult).toEqual(submitResult);
  });
});
