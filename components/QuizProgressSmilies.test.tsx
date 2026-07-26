import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { QuizProgressSmilies } from "./QuizProgressSmilies";

describe("QuizProgressSmilies", () => {
  it("renders one item per status, matching the quiz length", () => {
    render(<QuizProgressSmilies statuses={["unanswered", "unanswered", "unanswered"]} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("labels each smiley by question number and status", () => {
    render(<QuizProgressSmilies statuses={["correct", "incorrect", "unanswered"]} />);
    expect(screen.getByLabelText("Question 1: correct")).toBeInTheDocument();
    expect(screen.getByLabelText("Question 2: incorrect")).toBeInTheDocument();
    expect(screen.getByLabelText("Question 3: unanswered")).toBeInTheDocument();
  });
});
