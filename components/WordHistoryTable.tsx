import { WordStatusBadge } from "@/components/WordStatusBadge";

export interface WordHistoryRow {
  wordId: string;
  word: string;
  definition: string;
  synonym: string | null;
  antonym: string | null;
  difficulty: string;
  lastCorrect: boolean;
  attemptCount: number;
}

export function WordHistoryTable({ rows }: { rows: WordHistoryRow[] }) {
  if (rows.length === 0) {
    return <p className="text-zinc-500">No words attempted in this topic yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {rows.map((row) => (
        <li
          key={row.wordId}
          className="rounded border border-black/[.08] p-3 dark:border-white/[.145]"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="font-medium">{row.word}</p>
            <WordStatusBadge correct={row.lastCorrect} />
          </div>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{row.definition}</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
            {row.synonym && <span>Synonym: {row.synonym}</span>}
            {row.antonym && <span>Antonym: {row.antonym}</span>}
            <span>Difficulty: {row.difficulty}</span>
            <span>Attempts: {row.attemptCount}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
