import Link from "next/link";
import { formatTestName } from "@/lib/quiz/fixedTests";

interface FixedTestAttempt {
  id: string;
  length: number;
  score: number;
  createdAt: Date | string;
  fixedTest: { number: number } | null;
}

export function FixedTestAttemptList({ attempts }: { attempts: FixedTestAttempt[] }) {
  if (attempts.length === 0) {
    return <p className="text-zinc-500">No practice test attempts yet.</p>;
  }

  return (
    <ul className="divide-y divide-black/[.08] dark:divide-white/[.12]">
      {attempts.map((attempt) => (
        <li key={attempt.id}>
          <Link
            href={`/history/${attempt.id}`}
            className="flex items-center justify-between py-3 hover:bg-black/[.02] dark:hover:bg-white/[.04]"
          >
            <div>
              <p className="font-medium">
                {attempt.fixedTest ? formatTestName(attempt.fixedTest.number) : "Practice test"}
              </p>
              <p className="text-xs text-zinc-500">{new Date(attempt.createdAt).toLocaleDateString()}</p>
            </div>
            <p className="font-semibold">
              {attempt.score}/{attempt.length}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
