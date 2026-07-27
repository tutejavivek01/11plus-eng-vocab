export interface WordMeaningResult {
  definition: string | null;
  partOfSpeech: string | null;
  synonyms: string[];
  antonyms: string[];
}

function normalizeWord(word: string): string {
  return word.trim().toLowerCase().replace(/[^a-z'-]/g, "");
}

async function fetchDefinition(word: string): Promise<{ definition: string | null; partOfSpeech: string | null }> {
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    if (!res.ok) return { definition: null, partOfSpeech: null };
    const data = await res.json();
    const meaning = data?.[0]?.meanings?.[0];
    return {
      definition: meaning?.definitions?.[0]?.definition ?? null,
      partOfSpeech: meaning?.partOfSpeech ?? null,
    };
  } catch {
    return { definition: null, partOfSpeech: null };
  }
}

async function fetchRelatedWords(word: string, rel: "syn" | "ant"): Promise<string[]> {
  try {
    const res = await fetch(
      `https://api.datamuse.com/words?rel_${rel}=${encodeURIComponent(word)}&max=6`
    );
    if (!res.ok) return [];
    const data: { word: string }[] = await res.json();
    return data.map((d) => d.word);
  } catch {
    return [];
  }
}

export async function fetchWordMeaning(word: string): Promise<WordMeaningResult> {
  const normalized = normalizeWord(word);
  const [{ definition, partOfSpeech }, synonyms, antonyms] = await Promise.all([
    fetchDefinition(normalized),
    fetchRelatedWords(normalized, "syn"),
    fetchRelatedWords(normalized, "ant"),
  ]);
  return { definition, partOfSpeech, synonyms, antonyms };
}
