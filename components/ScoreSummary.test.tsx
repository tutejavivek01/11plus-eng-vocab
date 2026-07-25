import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ScoreSummary } from "./ScoreSummary";

describe("ScoreSummary", () => {
  it("renders the score as a fraction", () => {
    render(<ScoreSummary score={8} length={10} />);
    expect(screen.getByText("8/10")).toBeInTheDocument();
  });
});
