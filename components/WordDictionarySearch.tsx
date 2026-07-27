"use client";

import { useState } from "react";
import { WordDictionaryTable, type WordDictionaryRow } from "@/components/WordDictionaryTable";

export function WordDictionarySearch({ words }: { words: WordDictionaryRow[] }) {
  const [query, setQuery] = useState("");

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = normalizedQuery
    ? words.filter((w) => w.word.toLowerCase().includes(normalizedQuery))
    : words;

  return (
    <div className="flex flex-col gap-4">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for a word..."
        aria-label="Search for a word"
        className="w-full rounded border border-black/[.15] px-3 py-2 dark:border-white/[.2] dark:bg-black"
      />
      <p className="text-sm text-zinc-500">
        {filtered.length} of {words.length} words
      </p>
      <WordDictionaryTable rows={filtered} />
    </div>
  );
}
