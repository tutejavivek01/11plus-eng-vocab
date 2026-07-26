import type { FixedTestBand } from "@prisma/client";

export const PRACTICE_TEST_TOPIC_SENTINEL = "practice-test";

export const FIXED_TEST_BANDS = [
  { value: "EASY", label: "Easy", range: [1, 12] },
  { value: "MEDIUM", label: "Medium", range: [13, 24] },
  { value: "HARD", label: "Hard", range: [25, 36] },
  { value: "MIX", label: "Mix", range: [37, 48] },
] as const satisfies { value: FixedTestBand; label: string; range: [number, number] }[];

export function isValidTestNumber(n: number): boolean {
  return Number.isInteger(n) && n >= 1 && n <= 48;
}

export function getBandForNumber(n: number): FixedTestBand | null {
  return FIXED_TEST_BANDS.find(({ range: [lo, hi] }) => n >= lo && n <= hi)?.value ?? null;
}

export function formatTestName(number: number): string {
  return `Test #${number}`;
}

export interface FixedTestSummary {
  id: string;
  number: number;
  band: FixedTestBand;
  attempted: boolean;
  attemptCount: number;
  lastScore: number | null;
  lastAttemptId: string | null;
}

export function buildFixedTestSummaries(
  tests: { id: string; number: number; band: FixedTestBand }[],
  attempts: { id: string; fixedTestId: string | null; score: number; createdAt: Date }[]
): FixedTestSummary[] {
  const relevant = attempts.filter(
    (a): a is typeof a & { fixedTestId: string } => a.fixedTestId !== null
  );
  const sorted = [...relevant].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  const latestByTestId = new Map<string, { attemptId: string; score: number }>();
  const countByTestId = new Map<string, number>();
  for (const a of sorted) {
    countByTestId.set(a.fixedTestId, (countByTestId.get(a.fixedTestId) ?? 0) + 1);
    latestByTestId.set(a.fixedTestId, { attemptId: a.id, score: a.score });
  }

  return [...tests]
    .sort((a, b) => a.number - b.number)
    .map((t) => {
      const latest = latestByTestId.get(t.id);
      return {
        id: t.id,
        number: t.number,
        band: t.band,
        attempted: Boolean(latest),
        attemptCount: countByTestId.get(t.id) ?? 0,
        lastScore: latest?.score ?? null,
        lastAttemptId: latest?.attemptId ?? null,
      };
    });
}
