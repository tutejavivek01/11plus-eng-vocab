"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function WordUploadForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [word, setWord] = useState("");
  const [definition, setDefinition] = useState("");
  const [synonym, setSynonym] = useState("");
  const [antonym, setAntonym] = useState("");
  const [difficulty, setDifficulty] = useState("MEDIUM");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/dictionary/words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word, definition, synonym, antonym, difficulty }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add word");
      setSuccess(`"${word}" added to the dictionary.`);
      setWord("");
      setDefinition("");
      setSynonym("");
      setAntonym("");
      setDifficulty("MEDIUM");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="self-start rounded-full border border-black/[.08] px-4 py-2 text-sm font-medium transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-white/[.06]"
      >
        + Add a word
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded border border-black/[.08] p-4 dark:border-white/[.145]"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Add a new word</h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-zinc-500 underline"
        >
          Cancel
        </button>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        Word
        <input
          required
          value={word}
          onChange={(e) => setWord(e.target.value)}
          className="rounded border border-black/[.15] px-3 py-2 dark:border-white/[.2] dark:bg-black"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Definition
        <textarea
          required
          value={definition}
          onChange={(e) => setDefinition(e.target.value)}
          className="rounded border border-black/[.15] px-3 py-2 dark:border-white/[.2] dark:bg-black"
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Synonym (optional)
          <input
            value={synonym}
            onChange={(e) => setSynonym(e.target.value)}
            className="rounded border border-black/[.15] px-3 py-2 dark:border-white/[.2] dark:bg-black"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Antonym (optional)
          <input
            value={antonym}
            onChange={(e) => setAntonym(e.target.value)}
            className="rounded border border-black/[.15] px-3 py-2 dark:border-white/[.2] dark:bg-black"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        Difficulty
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="rounded border border-black/[.15] px-3 py-2 dark:border-white/[.2] dark:bg-black"
        >
          <option value="EASY">Easy</option>
          <option value="MEDIUM">Medium</option>
          <option value="HARD">Hard</option>
        </select>
      </label>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {success && <p className="text-sm text-green-700 dark:text-green-400">{success}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-foreground px-5 py-2 font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
      >
        {submitting ? "Adding..." : "Add word"}
      </button>
    </form>
  );
}
