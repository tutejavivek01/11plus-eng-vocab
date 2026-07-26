import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { PracticeTestsList } from "./PracticeTestsList";
import type { FixedTestSummary } from "@/lib/quiz/fixedTests";

function summary(overrides: Partial<FixedTestSummary> & { id: string; number: number; band: FixedTestSummary["band"] }): FixedTestSummary {
  return {
    attempted: false,
    attemptCount: 0,
    lastScore: null,
    lastAttemptId: null,
    ...overrides,
  };
}

const summaries: FixedTestSummary[] = [
  summary({ id: "t1", number: 1, band: "EASY" }),
  summary({ id: "t13", number: 13, band: "MEDIUM", attempted: true, attemptCount: 2, lastScore: 9 }),
  summary({ id: "t25", number: 25, band: "HARD" }),
  summary({ id: "t37", number: 37, band: "MIX" }),
];

describe("PracticeTestsList", () => {
  it("shows the Easy band's tests by default", () => {
    render(<PracticeTestsList summaries={summaries} />);
    expect(screen.getByText("Test #1")).toBeInTheDocument();
    expect(screen.getByText("Not attempted")).toBeInTheDocument();
    expect(screen.queryByText("Test #13")).not.toBeInTheDocument();
  });

  it("switches bands and shows attempted status + last score", async () => {
    const user = userEvent.setup();
    render(<PracticeTestsList summaries={summaries} />);
    await user.click(screen.getByRole("tab", { name: "Medium" }));
    expect(screen.getByText("Test #13")).toBeInTheDocument();
    expect(screen.getByText("Attempted")).toBeInTheDocument();
    expect(screen.getByText("9/12")).toBeInTheDocument();
    expect(screen.queryByText("Test #1")).not.toBeInTheDocument();
  });

  it("links each test to its play page", () => {
    render(<PracticeTestsList summaries={summaries} />);
    expect(screen.getByText("Test #1").closest("a")).toHaveAttribute("href", "/practice-tests/1");
  });
});
