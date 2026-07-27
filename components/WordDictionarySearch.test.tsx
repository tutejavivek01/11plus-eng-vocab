import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { WordDictionarySearch } from "./WordDictionarySearch";
import type { WordDictionaryRow } from "./WordDictionaryTable";

const words: WordDictionaryRow[] = [
  { id: "w1", word: "Happy", definition: "feeling joy", synonym: "Joyful", antonym: "Sad" },
  { id: "w2", word: "Big", definition: "large in size", synonym: "Large", antonym: "Small" },
  { id: "w3", word: "Happiness", definition: "the state of being happy", synonym: null, antonym: null },
];

describe("WordDictionarySearch", () => {
  it("shows every word when the search box is empty", () => {
    render(<WordDictionarySearch words={words} />);
    expect(screen.getByText("Happy")).toBeInTheDocument();
    expect(screen.getByText("Big")).toBeInTheDocument();
    expect(screen.getByText("Happiness")).toBeInTheDocument();
    expect(screen.getByText("3 of 3 words")).toBeInTheDocument();
  });

  it("filters case-insensitively by word text as the user types", async () => {
    const user = userEvent.setup();
    render(<WordDictionarySearch words={words} />);
    await user.type(screen.getByPlaceholderText("Search for a word..."), "hap");

    expect(screen.getByText("Happy")).toBeInTheDocument();
    expect(screen.getByText("Happiness")).toBeInTheDocument();
    expect(screen.queryByText("Big")).not.toBeInTheDocument();
    expect(screen.getByText("2 of 3 words")).toBeInTheDocument();
  });

  it("shows the table's empty state when no word matches", async () => {
    const user = userEvent.setup();
    render(<WordDictionarySearch words={words} />);
    await user.type(screen.getByPlaceholderText("Search for a word..."), "zzz");
    expect(screen.getByText("No words in the dictionary yet.")).toBeInTheDocument();
  });
});
