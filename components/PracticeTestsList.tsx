"use client";

import Link from "next/link";
import { WordHistoryTabs } from "@/components/WordHistoryTabs";
import { FIXED_TEST_BANDS, formatTestName, type FixedTestSummary } from "@/lib/quiz/fixedTests";

function BandTestRows({ tests }: { tests: FixedTestSummary[] }) {
  if (tests.length === 0) {
    return <p className="text-zinc-500">No tests in this band.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {tests.map((t) => (
        <li key={t.id}>
          <Link
            href={`/practice-tests/${t.number}`}
            className="flex items-center justify-between rounded border border-black/[.08] p-3 transition-colors hover:bg-black/[.02] dark:border-white/[.145] dark:hover:bg-white/[.04]"
          >
            <div>
              <p className="font-medium">{formatTestName(t.number)}</p>
              <p className="text-xs text-zinc-500">{t.attempted ? "Attempted" : "Not attempted"}</p>
            </div>
            {t.attempted && <p className="font-semibold">{t.lastScore}/12</p>}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function PracticeTestsList({ summaries }: { summaries: FixedTestSummary[] }) {
  const tabs = FIXED_TEST_BANDS.map((band) => ({
    value: band.value,
    label: band.label,
    content: <BandTestRows tests={summaries.filter((s) => s.band === band.value)} />,
  }));

  return <WordHistoryTabs tabs={tabs} />;
}
