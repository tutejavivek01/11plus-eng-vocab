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

  it("renders the explanation when present", () => {
    render(
      <MissedQuestionsReview
        missed={[
          {
            prompt: "The goverment [A] met. No error [B]",
            selectedText: "B",
            correctText: "A",
            explanation: "Goverment is spelt incorrectly.",
          },
        ]}
      />
    );
    expect(screen.getByText("Goverment is spelt incorrectly.")).toBeInTheDocument();
  });

  it("does not render an explanation line when it is absent", () => {
    render(
      <MissedQuestionsReview
        missed={[
          { prompt: "What does 'happy' mean?", selectedText: "sad feeling", correctText: "feeling joy" },
        ]}
      />
    );
    expect(screen.queryByText(/explanation/i)).not.toBeInTheDocument();
  });
});
