import { WordStatusBadge } from "@/components/WordStatusBadge";

export interface SpellingHistoryRow {
  contentId: string;
  sentence: string;
  lastSelectedText: string;
  lastCorrectText: string;
  lastCorrect: boolean;
  attemptCount: number;
  lastExplanation: string | null;
}

export function SpellingHistoryTable({ rows }: { rows: SpellingHistoryRow[] }) {
  if (rows.length === 0) {
    return <p className="text-zinc-500">No spelling questions attempted yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {rows.map((row) => (
        <li
          key={row.contentId}
          className="rounded border border-black/[.08] p-3 dark:border-white/[.145]"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm">{row.sentence}</p>
            <WordStatusBadge correct={row.lastCorrect} />
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
            <span>Your answer: {row.lastSelectedText}</span>
            <span>Correct answer: {row.lastCorrectText}</span>
            <span>Attempts: {row.attemptCount}</span>
          </div>
          {row.lastExplanation && (
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{row.lastExplanation}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
