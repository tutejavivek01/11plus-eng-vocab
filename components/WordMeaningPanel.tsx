"use client";

import { useEffect, useState } from "react";
import type { WordMeaningResult } from "@/lib/wordMeaning";

interface FetchedMeaning {
  word: string;
  data: WordMeaningResult;
}

export function WordMeaningPanel({ word }: { word: string | null }) {
  const [fetched, setFetched] = useState<FetchedMeaning | null>(null);

  useEffect(() => {
    if (!word) return;
    let cancelled = false;

    fetch(`/api/word-meaning?word=${encodeURIComponent(word)}`)
      .then((res) => res.json())
      .then((data: WordMeaningResult) => {
        if (!cancelled) setFetched({ word, data });
      })
      .catch(() => {
        if (!cancelled) {
          setFetched({
            word,
            data: { definition: null, partOfSpeech: null, synonyms: [], antonyms: [] },
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [word]);

  if (!word) return null;

  const loading = !fetched || fetched.word !== word;
  const result = loading ? null : fetched.data;
  const hasInfo = Boolean(
    result && (result.definition || result.synonyms.length > 0 || result.antonyms.length > 0)
  );

  return (
    <div className="rounded border border-black/[.08] p-4 dark:border-white/[.145]">
      <h3 className="mb-2 text-sm font-semibold text-zinc-600 dark:text-zinc-400">
        About &quot;{word}&quot;
      </h3>
      {loading && <p className="text-sm text-zinc-500">Loading...</p>}
      {!loading && !hasInfo && (
        <p className="text-sm text-zinc-500">No additional information available.</p>
      )}
      {!loading && hasInfo && result && (
        <div className="space-y-2 text-sm">
          {result.definition && (
            <p>
              {result.partOfSpeech && (
                <span className="italic text-zinc-500">({result.partOfSpeech}) </span>
              )}
              {result.definition}
            </p>
          )}
          {result.synonyms.length > 0 && (
            <p>
              <span className="font-medium">Synonyms: </span>
              {result.synonyms.join(", ")}
            </p>
          )}
          {result.antonyms.length > 0 && (
            <p>
              <span className="font-medium">Antonyms: </span>
              {result.antonyms.join(", ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
