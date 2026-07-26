import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ConfidenceBadgeLetter } from "./ConfidenceBadgeLetter";

describe("ConfidenceBadgeLetter", () => {
  it.each([
    ["high", "H"],
    ["medium", "M"],
    ["low", "L"],
    ["worried", "W"],
    ["none", "–"],
  ] as const)("renders the %s tier as %s", (tier, letter) => {
    render(<ConfidenceBadgeLetter tier={tier} />);
    expect(screen.getByText(letter)).toBeInTheDocument();
  });

  it("labels the badge with the full tier name for accessibility", () => {
    render(<ConfidenceBadgeLetter tier="worried" />);
    expect(screen.getByLabelText("You should be worried")).toBeInTheDocument();
  });
});
