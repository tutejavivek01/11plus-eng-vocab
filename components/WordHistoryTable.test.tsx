import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WordHistoryTable } from "./WordHistoryTable";

describe("WordHistoryTable", () => {
  it("shows an empty-state message when there are no rows", () => {
    render(<WordHistoryTable rows={[]} />);
    expect(screen.getByText("No words attempted in this topic yet.")).toBeInTheDocument();
  });

  it("renders one row per word with its details", () => {
    render(
      <WordHistoryTable
        rows={[
          {
            wordId: "w1",
            word: "benevolent",
            definition: "kind and well meaning",
            synonym: "kindly",
            antonym: null,
            difficulty: "HARD",
            lastCorrect: true,
            attemptCount: 3,
          },
        ]}
      />
    );
    expect(screen.getByText("benevolent")).toBeInTheDocument();
    expect(screen.getByText("kind and well meaning")).toBeInTheDocument();
    expect(screen.getByText("Synonym: kindly")).toBeInTheDocument();
    expect(screen.queryByText(/Antonym:/)).not.toBeInTheDocument();
    expect(screen.getByText("Difficulty: HARD")).toBeInTheDocument();
    expect(screen.getByText("Attempts: 3")).toBeInTheDocument();
    expect(screen.getByLabelText("Last attempt correct")).toBeInTheDocument();
  });
});
