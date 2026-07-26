import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SpellingQuestionCard } from "./SpellingQuestionCard";
import type { GeneratedQuestion } from "@/lib/quiz/generateQuiz";

const question: GeneratedQuestion = {
  wordId: "sq1",
  questionType: "SPOT_MISSPELLING",
  prompt: "The goverment [A] met. No error [B]",
  options: ["A", "B", "C", "D", "E"],
};

describe("SpellingQuestionCard", () => {
  it("renders the sentence text", () => {
    render(<SpellingQuestionCard question={question} selected={null} feedback={null} onSelect={vi.fn()} />);
    expect(screen.getByText(/The goverment/)).toBeInTheDocument();
  });

  it("calls onSelect with the clicked letter when unanswered", () => {
    const onSelect = vi.fn();
    render(<SpellingQuestionCard question={question} selected={null} feedback={null} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button", { name: "A" }));
    expect(onSelect).toHaveBeenCalledWith("A");
  });

  it("labels the last option as 'No error'", () => {
    render(<SpellingQuestionCard question={question} selected={null} feedback={null} onSelect={vi.fn()} />);
    expect(screen.getByRole("button", { name: /No error/ })).toBeInTheDocument();
  });

  it("shows incorrect feedback, the explanation, and disables further selection once answered", () => {
    const onSelect = vi.fn();
    render(
      <SpellingQuestionCard
        question={question}
        selected="B"
        feedback={{ isCorrect: false, correctText: "A", explanation: "Goverment is misspelled." }}
        onSelect={onSelect}
      />
    );
    expect(screen.getByText(/Incorrect/)).toBeInTheDocument();
    expect(screen.getByText("Goverment is misspelled.")).toBeInTheDocument();
    for (const option of question.options) {
      expect(screen.getByRole("button", { name: new RegExp(`^${option}`) })).toBeDisabled();
    }
    fireEvent.click(screen.getByRole("button", { name: "C" }));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("shows a correct message when the answer was right", () => {
    render(
      <SpellingQuestionCard
        question={question}
        selected="A"
        feedback={{ isCorrect: true, correctText: "A", explanation: "Goverment is misspelled." }}
        onSelect={vi.fn()}
      />
    );
    expect(screen.getByText("Correct!")).toBeInTheDocument();
  });
});
