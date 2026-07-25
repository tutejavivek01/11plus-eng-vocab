import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QuestionCard } from "./QuestionCard";
import type { GeneratedQuestion } from "@/lib/quiz/generateQuiz";

const question: GeneratedQuestion = {
  wordId: "w1",
  questionType: "WORD_TO_DEFINITION",
  prompt: "What does 'happy' mean?",
  options: ["feeling joy", "feeling sad", "feeling tired", "feeling angry"],
};

describe("QuestionCard", () => {
  it("calls onSelect with the clicked option when unanswered", () => {
    const onSelect = vi.fn();
    render(<QuestionCard question={question} selected={null} feedback={null} onSelect={onSelect} />);
    fireEvent.click(screen.getByText("feeling sad"));
    expect(onSelect).toHaveBeenCalledWith("feeling sad");
  });

  it("shows correct/incorrect feedback and disables further selection once answered", () => {
    const onSelect = vi.fn();
    render(
      <QuestionCard
        question={question}
        selected="feeling sad"
        feedback={{ isCorrect: false, correctText: "feeling joy" }}
        onSelect={onSelect}
      />
    );
    expect(screen.getByText(/Incorrect/)).toBeInTheDocument();
    for (const option of question.options) {
      expect(screen.getByText(option).closest("button")).toBeDisabled();
    }
    fireEvent.click(screen.getByText("feeling tired"));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("shows a correct message when the answer was right", () => {
    render(
      <QuestionCard
        question={question}
        selected="feeling joy"
        feedback={{ isCorrect: true, correctText: "feeling joy" }}
        onSelect={vi.fn()}
      />
    );
    expect(screen.getByText("Correct!")).toBeInTheDocument();
  });
});
