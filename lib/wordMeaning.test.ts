import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchWordMeaning } from "./wordMeaning";

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: async () => body };
}

describe("fetchWordMeaning", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("merges the definition, synonyms, and antonyms from both APIs", async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url.includes("dictionaryapi.dev")) {
        return Promise.resolve(
          jsonResponse([{ meanings: [{ partOfSpeech: "adjective", definitions: [{ definition: "feeling joy" }] }] }])
        );
      }
      if (url.includes("rel_syn")) {
        return Promise.resolve(jsonResponse([{ word: "joyful" }, { word: "glad" }]));
      }
      if (url.includes("rel_ant")) {
        return Promise.resolve(jsonResponse([{ word: "sad" }]));
      }
      throw new Error(`Unexpected URL: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchWordMeaning("happy");
    expect(result).toEqual({
      definition: "feeling joy",
      partOfSpeech: "adjective",
      synonyms: ["joyful", "glad"],
      antonyms: ["sad"],
    });
  });

  it("normalizes the word before querying (trims, lowercases)", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([]));
    vi.stubGlobal("fetch", fetchMock);

    await fetchWordMeaning("  Happy  ");
    for (const call of fetchMock.mock.calls) {
      expect(String(call[0])).toContain("happy");
      expect(String(call[0])).not.toContain("Happy");
    }
  });

  it("falls back to nulls/empty arrays when the dictionary API 404s", async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url.includes("dictionaryapi.dev")) return Promise.resolve(jsonResponse({ title: "No Definitions Found" }, false));
      return Promise.resolve(jsonResponse([]));
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchWordMeaning("asdfqwerty");
    expect(result.definition).toBeNull();
    expect(result.partOfSpeech).toBeNull();
  });

  it("falls back gracefully when a request throws (network error)", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network down"));
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchWordMeaning("happy");
    expect(result).toEqual({ definition: null, partOfSpeech: null, synonyms: [], antonyms: [] });
  });
});
