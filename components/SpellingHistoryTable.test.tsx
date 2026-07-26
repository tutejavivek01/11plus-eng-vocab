import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SpellingHistoryTable } from "./SpellingHistoryTable";

describe("SpellingHistoryTable", () => {
  it("shows an empty-state message when there are no rows", () => {
    render(<SpellingHistoryTable rows={[]} />);
    expect(screen.getByText("No spelling questions attempted yet.")).toBeInTheDocument();
  });

  it("renders one row per sentence with answer/explanation/attempt-count details", () => {
    render(
      <SpellingHistoryTable
        rows={[
          {
            contentId: "sq1",
            sentence: "The goverment [A] met. No error [B]",
            lastSelectedText: "B",
            lastCorrectText: "A",
            lastCorrect: false,
            attemptCount: 2,
            lastExplanation: "Goverment is spelt incorrectly.",
          },
        ]}
      />
    );
    expect(screen.getByText(/The goverment/)).toBeInTheDocument();
    expect(screen.getByText("Your answer: B")).toBeInTheDocument();
    expect(screen.getByText("Correct answer: A")).toBeInTheDocument();
    expect(screen.getByText("Attempts: 2")).toBeInTheDocument();
    expect(screen.getByText("Goverment is spelt incorrectly.")).toBeInTheDocument();
    expect(screen.getByLabelText("Last attempt incorrect")).toBeInTheDocument();
  });
});
