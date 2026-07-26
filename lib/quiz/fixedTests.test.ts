import { describe, expect, it } from "vitest";
import {
  buildFixedTestSummaries,
  formatTestName,
  getBandForNumber,
  isValidTestNumber,
} from "./fixedTests";

describe("isValidTestNumber", () => {
  it.each([
    [0, false],
    [1, true],
    [48, true],
    [49, false],
    [1.5, false],
    [-1, false],
  ])("treats %s as valid=%s", (n, expected) => {
    expect(isValidTestNumber(n)).toBe(expected);
  });
});

describe("getBandForNumber", () => {
  it.each([
    [1, "EASY"],
    [12, "EASY"],
    [13, "MEDIUM"],
    [24, "MEDIUM"],
    [25, "HARD"],
    [36, "HARD"],
    [37, "MIX"],
    [48, "MIX"],
  ] as const)("classifies test #%s as %s", (n, band) => {
    expect(getBandForNumber(n)).toBe(band);
  });

  it("returns null for an out-of-range number", () => {
    expect(getBandForNumber(0)).toBeNull();
    expect(getBandForNumber(49)).toBeNull();
  });
});

describe("formatTestName", () => {
  it("formats as 'Test #<number>'", () => {
    expect(formatTestName(7)).toBe("Test #7");
  });
});

describe("buildFixedTestSummaries", () => {
  const tests = [
    { id: "t1", number: 1, band: "EASY" as const },
    { id: "t2", number: 2, band: "EASY" as const },
  ];

  it("marks every test as not attempted when there are no attempts", () => {
    const summaries = buildFixedTestSummaries(tests, []);
    expect(summaries).toHaveLength(2);
    for (const s of summaries) {
      expect(s.attempted).toBe(false);
      expect(s.attemptCount).toBe(0);
      expect(s.lastScore).toBeNull();
      expect(s.lastAttemptId).toBeNull();
    }
  });

  it("returns results ordered by test number", () => {
    const summaries = buildFixedTestSummaries([tests[1], tests[0]], []);
    expect(summaries.map((s) => s.number)).toEqual([1, 2]);
  });

  it("reflects a single attempt", () => {
    const summaries = buildFixedTestSummaries(tests, [
      { id: "a1", fixedTestId: "t1", score: 9, createdAt: new Date("2026-01-01") },
    ]);
    const t1 = summaries.find((s) => s.number === 1)!;
    expect(t1.attempted).toBe(true);
    expect(t1.attemptCount).toBe(1);
    expect(t1.lastScore).toBe(9);
    expect(t1.lastAttemptId).toBe("a1");
  });

  it("uses the most recent attempt's score when a test is retaken, but keeps an accurate attempt count", () => {
    const summaries = buildFixedTestSummaries(tests, [
      { id: "a1", fixedTestId: "t1", score: 5, createdAt: new Date("2026-01-01") },
      { id: "a2", fixedTestId: "t1", score: 11, createdAt: new Date("2026-01-03") },
      { id: "a3", fixedTestId: "t1", score: 8, createdAt: new Date("2026-01-02") },
    ]);
    const t1 = summaries.find((s) => s.number === 1)!;
    expect(t1.attemptCount).toBe(3);
    expect(t1.lastScore).toBe(11);
    expect(t1.lastAttemptId).toBe("a2");
  });

  it("ignores an attempt referencing a fixedTestId not present in the tests list", () => {
    const summaries = buildFixedTestSummaries(tests, [
      { id: "a1", fixedTestId: "does-not-exist", score: 12, createdAt: new Date("2026-01-01") },
    ]);
    expect(summaries.every((s) => !s.attempted)).toBe(true);
  });
});
