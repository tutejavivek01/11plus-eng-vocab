import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ConfidenceMeter } from "./ConfidenceMeter";

describe("ConfidenceMeter", () => {
  it("shows the tier label and rounded percent", () => {
    render(<ConfidenceMeter percent={83.4} tier="high" />);
    expect(screen.getByText("High")).toBeInTheDocument();
    expect(screen.getByText("83%")).toBeInTheDocument();
  });

  it("shows the distinct 'worried' wording for the bottom tier", () => {
    render(<ConfidenceMeter percent={20} tier="worried" />);
    expect(screen.getByText("You should be worried")).toBeInTheDocument();
  });

  it("omits a percent when there is no data", () => {
    render(<ConfidenceMeter percent={null} tier="none" />);
    expect(screen.getByText("Not attempted")).toBeInTheDocument();
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });
});
