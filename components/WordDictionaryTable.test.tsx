import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WordDictionaryTable } from "./WordDictionaryTable";

describe("WordDictionaryTable", () => {
  it("shows an empty-state message when there are no rows", () => {
    render(<WordDictionaryTable rows={[]} />);
    expect(screen.getByText("No words in the dictionary yet.")).toBeInTheDocument();
  });

  it("renders one row per word with a serial number and all fields", () => {
    render(
      <WordDictionaryTable
        rows={[
          { id: "w1", word: "Happy", definition: "feeling joy", synonym: "Joyful", antonym: "Sad" },
          { id: "w2", word: "Big", definition: "large in size", synonym: null, antonym: null },
        ]}
      />
    );

    const rows = screen.getAllByRole("row");
    // header row + 2 data rows
    expect(rows).toHaveLength(3);

    expect(screen.getByText("Happy")).toBeInTheDocument();
    expect(screen.getByText("feeling joy")).toBeInTheDocument();
    expect(screen.getByText("Joyful")).toBeInTheDocument();
    expect(screen.getByText("Sad")).toBeInTheDocument();

    expect(screen.getByText("Big")).toBeInTheDocument();
    expect(screen.getByText("large in size")).toBeInTheDocument();

    // serial numbers
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("shows an em dash for missing synonym/antonym", () => {
    render(
      <WordDictionaryTable
        rows={[{ id: "w1", word: "Big", definition: "large in size", synonym: null, antonym: null }]}
      />
    );
    expect(screen.getAllByText("—")).toHaveLength(2);
  });
});
