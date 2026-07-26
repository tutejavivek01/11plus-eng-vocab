import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { WordHistoryTabs } from "./WordHistoryTabs";

describe("WordHistoryTabs", () => {
  const tabs = [
    { value: "synonyms", label: "Synonyms", content: <p>Synonyms content</p> },
    { value: "antonyms", label: "Antonyms", content: <p>Antonyms content</p> },
  ];

  it("shows the first tab's content by default", () => {
    render(<WordHistoryTabs tabs={tabs} />);
    expect(screen.getByText("Synonyms content")).toBeInTheDocument();
    expect(screen.queryByText("Antonyms content")).not.toBeInTheDocument();
  });

  it("switches the visible panel when a different tab is clicked", async () => {
    const user = userEvent.setup();
    render(<WordHistoryTabs tabs={tabs} />);
    await user.click(screen.getByRole("tab", { name: "Antonyms" }));
    expect(screen.getByText("Antonyms content")).toBeInTheDocument();
    expect(screen.queryByText("Synonyms content")).not.toBeInTheDocument();
  });
});
