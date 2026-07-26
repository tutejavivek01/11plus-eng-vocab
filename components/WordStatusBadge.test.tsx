import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WordStatusBadge } from "./WordStatusBadge";

describe("WordStatusBadge", () => {
  it("shows a happy status for a correct last attempt", () => {
    render(<WordStatusBadge correct={true} />);
    expect(screen.getByLabelText("Last attempt correct")).toBeInTheDocument();
  });

  it("shows a sad status for an incorrect last attempt", () => {
    render(<WordStatusBadge correct={false} />);
    expect(screen.getByLabelText("Last attempt incorrect")).toBeInTheDocument();
  });
});
