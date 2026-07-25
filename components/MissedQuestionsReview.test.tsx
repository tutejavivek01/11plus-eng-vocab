import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MissedQuestionsReview } from "./MissedQuestionsReview";

describe("MissedQuestionsReview", () => {
  it("shows a perfect-score message when nothing was missed", () => {
    render(<MissedQuestionsReview missed={[]} />);
    expect(screen.getByText(/perfect score/i)).toBeInTheDocument();
  });

  it("lists each missed question with the user's answer and the correct answer", () => {
    render(
      <MissedQuestionsReview
        missed={[
          { prompt: "What does 'happy' mean?", selectedText: "sad feeling", correctText: "feeling joy" },
        ]}
      />
    );
    expect(screen.getByText("What does 'happy' mean?")).toBeInTheDocument();
    expect(screen.getByText(/Your answer: sad feeling/)).toBeInTheDocument();
    expect(screen.getByText(/Correct answer: feeling joy/)).toBeInTheDocument();
  });
});
