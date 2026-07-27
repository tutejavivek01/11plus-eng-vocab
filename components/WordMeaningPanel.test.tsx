import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WordMeaningPanel } from "./WordMeaningPanel";

describe("WordMeaningPanel", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders nothing when word is null", () => {
    const { container } = render(<WordMeaningPanel word={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("fetches and displays definition, synonyms, and antonyms", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          definition: "feeling joy",
          partOfSpeech: "adjective",
          synonyms: ["joyful", "glad"],
          antonyms: ["sad"],
        }),
      })
    );

    render(<WordMeaningPanel word="happy" />);
    await waitFor(() => expect(screen.getByText("feeling joy")).toBeInTheDocument());
    expect(screen.getByText(/Synonyms:/)).toBeInTheDocument();
    expect(screen.getByText(/joyful, glad/)).toBeInTheDocument();
    expect(screen.getByText(/Antonyms:/)).toBeInTheDocument();
  });

  it("shows a fallback message when no information is available", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ definition: null, partOfSpeech: null, synonyms: [], antonyms: [] }),
      })
    );

    render(<WordMeaningPanel word="asdfqwerty" />);
    await waitFor(() =>
      expect(screen.getByText("No additional information available.")).toBeInTheDocument()
    );
  });

  it("re-fetches when the word prop changes", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ definition: "def1", partOfSpeech: null, synonyms: [], antonyms: [] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { rerender } = render(<WordMeaningPanel word="one" />);
    await waitFor(() => expect(screen.getByText("def1")).toBeInTheDocument());

    rerender(<WordMeaningPanel word="two" />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls[1][0]).toContain("two");
  });
});
