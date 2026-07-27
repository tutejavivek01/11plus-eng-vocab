export interface WordDictionaryRow {
  id: string;
  word: string;
  definition: string;
  synonym: string | null;
  antonym: string | null;
}

export function WordDictionaryTable({ rows }: { rows: WordDictionaryRow[] }) {
  if (rows.length === 0) {
    return <p className="text-zinc-500">No words in the dictionary yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded border border-black/[.08] dark:border-white/[.145]">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-black/[.08] bg-black/[.02] dark:border-white/[.145] dark:bg-white/[.04]">
            <th className="px-3 py-2 font-medium text-zinc-600 dark:text-zinc-400">#</th>
            <th className="px-3 py-2 font-medium text-zinc-600 dark:text-zinc-400">Word</th>
            <th className="px-3 py-2 font-medium text-zinc-600 dark:text-zinc-400">Definition</th>
            <th className="px-3 py-2 font-medium text-zinc-600 dark:text-zinc-400">Synonym</th>
            <th className="px-3 py-2 font-medium text-zinc-600 dark:text-zinc-400">Antonym</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.id}
              className="border-b border-black/[.08] last:border-0 dark:border-white/[.145]"
            >
              <td className="px-3 py-2 text-zinc-500">{index + 1}</td>
              <td className="px-3 py-2 font-medium">{row.word}</td>
              <td className="px-3 py-2">{row.definition}</td>
              <td className="px-3 py-2">{row.synonym ?? "—"}</td>
              <td className="px-3 py-2">{row.antonym ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
