export const TOPICS = [
  { value: "synonyms", label: "Synonyms" },
  { value: "antonyms", label: "Antonyms" },
  { value: "spellings", label: "Spellings" },
  { value: "general-vocabulary", label: "General Vocabulary" },
] as const;

export type Topic = (typeof TOPICS)[number]["value"];

export const ALLOWED_QUIZ_LENGTHS = [5, 10, 20] as const;

export type QuizLength = (typeof ALLOWED_QUIZ_LENGTHS)[number];
