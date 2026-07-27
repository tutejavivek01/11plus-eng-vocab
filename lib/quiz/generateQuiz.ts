export type QuestionType =
  | "WORD_TO_DEFINITION"
  | "DEFINITION_TO_WORD"
  | "SYNONYM_ANTONYM"
  | "SPOT_MISSPELLING";
export type Variant = "SYNONYM" | "ANTONYM";

export interface WordRecord {
  id: string;
  word: string;
  definition: string;
  synonym: string | null;
  antonym: string | null;
}

export interface GeneratedQuestion {
  wordId: string;
  questionType: QuestionType;
  variant?: Variant;
  prompt: string;
  options: string[];
  word?: string; // the actual tested word; absent for question types with no single word (spellings)
}

export class InsufficientWordsError extends Error {}

export function getCorrectAnswer(word: WordRecord, questionType: QuestionType, variant?: Variant): string {
  if (questionType === "WORD_TO_DEFINITION") return word.definition;
  if (questionType === "DEFINITION_TO_WORD") return word.word;
  const value = variant === "ANTONYM" ? word.antonym : word.synonym;
  if (!value) {
    throw new InsufficientWordsError(
      `Word '${word.word}' has no ${(variant ?? "SYNONYM").toLowerCase()} data.`
    );
  }
  return value;
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function pickDistractors(candidates: string[], correct: string, count: number): string[] {
  const unique = Array.from(new Set(candidates.filter((value) => value !== correct)));
  return shuffle(unique).slice(0, count);
}

function buildWordToDefinition(subject: WordRecord, pool: WordRecord[]): GeneratedQuestion | null {
  const correct = getCorrectAnswer(subject, "WORD_TO_DEFINITION");
  const distractorCandidates = pool.filter((w) => w.id !== subject.id).map((w) => w.definition);
  const distractors = pickDistractors(distractorCandidates, correct, 3);
  if (distractors.length < 3) return null;
  return {
    wordId: subject.id,
    questionType: "WORD_TO_DEFINITION",
    prompt: `What does '${subject.word}' mean?`,
    options: shuffle([correct, ...distractors]),
    word: subject.word,
  };
}

function buildDefinitionToWord(subject: WordRecord, pool: WordRecord[]): GeneratedQuestion | null {
  const correct = getCorrectAnswer(subject, "DEFINITION_TO_WORD");
  const distractorCandidates = pool.filter((w) => w.id !== subject.id).map((w) => w.word);
  const distractors = pickDistractors(distractorCandidates, correct, 3);
  if (distractors.length < 3) return null;
  return {
    wordId: subject.id,
    questionType: "DEFINITION_TO_WORD",
    prompt: `Which word matches this definition: "${subject.definition}"?`,
    options: shuffle([correct, ...distractors]),
    word: subject.word,
  };
}

function buildSynonymAntonym(subject: WordRecord, pool: WordRecord[]): GeneratedQuestion | null {
  const availableVariants: Variant[] = [];
  if (subject.synonym) availableVariants.push("SYNONYM");
  if (subject.antonym) availableVariants.push("ANTONYM");
  if (availableVariants.length === 0) return null;

  const variant = availableVariants[Math.floor(Math.random() * availableVariants.length)];
  const correct = getCorrectAnswer(subject, "SYNONYM_ANTONYM", variant);
  const distractorCandidates = pool
    .filter((w) => w.id !== subject.id)
    .map((w) => (variant === "SYNONYM" ? w.synonym : w.antonym))
    .filter((value): value is string => Boolean(value));
  const distractors = pickDistractors(distractorCandidates, correct, 3);
  if (distractors.length < 3) return null;

  return {
    wordId: subject.id,
    questionType: "SYNONYM_ANTONYM",
    variant,
    prompt:
      variant === "SYNONYM"
        ? `Choose the synonym of '${subject.word}'.`
        : `Choose the antonym of '${subject.word}'.`,
    options: shuffle([correct, ...distractors]),
    word: subject.word,
  };
}

export function generateQuiz(pool: WordRecord[], length: number): GeneratedQuestion[] {
  if (pool.length < length) {
    throw new InsufficientWordsError(
      `Topic has only ${pool.length} word(s); need at least ${length} to build this quiz.`
    );
  }

  const subjects = pool.slice(0, length);
  const rotation: QuestionType[] = ["WORD_TO_DEFINITION", "DEFINITION_TO_WORD", "SYNONYM_ANTONYM"];
  const typeAssignment = shuffle(subjects.map((_, i) => rotation[i % rotation.length]));

  return subjects.map((subject, i) => {
    const assigned = typeAssignment[i];

    if (assigned === "SYNONYM_ANTONYM") {
      const question = buildSynonymAntonym(subject, pool);
      if (question) return question;
    }
    if (assigned === "DEFINITION_TO_WORD") {
      const question = buildDefinitionToWord(subject, pool);
      if (question) return question;
    }

    const fallback = buildWordToDefinition(subject, pool);
    if (fallback) return fallback;

    // Extremely small/degenerate pools: last resort, whichever type can be built.
    const lastResort = buildDefinitionToWord(subject, pool) ?? buildSynonymAntonym(subject, pool);
    if (lastResort) return lastResort;

    throw new InsufficientWordsError(
      `Could not build a question for word '${subject.word}' from the available pool.`
    );
  });
}
