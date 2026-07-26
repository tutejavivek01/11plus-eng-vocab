# Spellings Question Format Fix

Enhancement request captured for future planning. Not yet planned or implemented.

## Overview

Quiz questions for the **Spellings** topic currently use the same generic vocabulary format as every other topic (Synonyms/Antonyms/General Vocabulary) — "What does 'X' mean?" or "Which word matches this definition?" — which doesn't test spelling ability at all. Real spelling questions (per the source data in `data/sp_qs_1.csv`) follow a different, well-established "spot the misspelled word" format: a full sentence containing five lettered candidate words/phrases `[A]`–`[E]`, where the student identifies which one (if any) is misspelled, with `[E]` always being "No error". Each question also comes with a fixed explanation of the answer.

## Why today's questions are wrong

- `Word.topic = "spellings"` rows (imported from `data/vocab_1.csv`..`vocab_5.csv`) are ordinary vocabulary entries — a word, a definition, a synonym, an antonym — e.g. `Strict / Demanding that rules are obeyed.../ Harsh, Severe / Lenient, Lax, Indulgent`. There is nothing about correct vs. incorrect spelling in this data.
- `lib/quiz/generateQuiz.ts` has **no topic-specific branching at all** — every topic, including `spellings`, is run through the same `WORD_TO_DEFINITION` / `DEFINITION_TO_WORD` / `SYNONYM_ANTONYM` question builders. So a "spellings" quiz today asks the student to match a word to its definition or synonym, never to identify a misspelling.
- `components/QuestionCard.tsx` renders a prompt plus a list of full-text option buttons — there's no concept of a sentence with inline lettered segments, and no explanation is ever shown (during play or in the post-quiz review).

## Desired behavior — sentence-based "spot the error" questions

**Example 1**
> The goverment [A] decided to accommodate [B] all the necessary [C] guests immediately [D]. No error [E]

Answer: **A**
Explanation: Goverment is spelt incorrectly. It requires a silent 'n' before 'm' (government). The other words (accommodate, necessary, immediately) are all correct.

**Example 2**
> It was an unforgettable [A] occasion, but his embarassing [B] behaviour definitely [C] ruined the party [D]. No error [E]

Answer: **B**
Explanation: Embarassing is missing a second 'r'. The correct spelling is embarrassing (double 'r', double 's').

**Example 3**
> The archaeologist [A] made an extraordinary [B] discovery in the ancient [C] cemetery [D]. No error [E]

Answer: **E (No error)**
Explanation: All underlined words (archaeologist, extraordinary, ancient, cemetery) are spelt correctly.

Every question has exactly one correct letter (`A`–`E`), `E` always corresponds to the literal "No error" text already embedded at the end of the sentence, and every question — correct or "no error" — comes with a one- or two-sentence explanation of why.

## Source data

`data/sp_qs_1.csv` — 150 rows, 3 columns: `Question, Answer, Explanation`.
- `Question`: the full sentence with `[A]`–`[E]` markers inline, exactly as shown above (quoted/escaped like a normal CSV field when it contains commas).
- `Answer`: a single letter, `A` through `E`.
- `Explanation`: free text, always present, for both wrong-word and "no error" cases.
- Answer letters are roughly evenly distributed across the 150 rows (~30 each of A/B/C/D/E) — plenty of variety for random sampling at the existing quiz lengths (5/10/20).

## Required changes (high-level, not yet decided in detail — see open questions)

1. **New data model** for spelling questions, since the shape (a full sentence + 5 embedded letter-options + a fixed explanation) doesn't fit the `Word` model (word/definition/synonym/antonym/difficulty) at all.
2. **New question-generation path** for the `spellings` topic specifically — `/api/quiz/generate` needs a topic-aware branch instead of always calling `generateQuiz()` against `Word` rows.
3. **New question-rendering UI** — `QuestionCard.tsx` (or a new sibling component) needs to display a sentence with 5 selectable lettered options, not a flat list of independent option strings.
4. **New explanation UI** — nothing in the app currently shows an explanation anywhere (not during play, not in `MissedQuestionsReview`, not in History). This is a new capability needed for at least this question type.
5. **New server-side answer validation** — `/api/quiz/check-answer` and `/api/quiz/submit` must re-derive correctness from the stored answer letter, the same "never trust the client" principle already applied to `getCorrectAnswer`/`validateAnswers` for the other three question types.
6. **New import script** (analogous to `prisma/import-words.ts`) to load `data/sp_qs_1.csv` into whatever the new data model turns out to be.
7. **Decommissioning the current generic Word-based spelling content** — the production `Word` table was already cleared to empty in a prior change, so there's a clean opportunity to resolve this before anything is re-imported (see open questions below).

## Impact on already-shipped History / confidence features

The per-word history, confidence meter, and home-page summary chart shipped previously (`specs/history_summary_theme_specs.md`) all key off `QuizAnswer.wordId` and join it back to the `Word` table for display (`lib/quiz/wordHistory.ts`, `app/history/page.tsx`). If spelling questions move to a separate table, that join needs a topic-aware branch (or a shared "quiz content" abstraction covering both `Word` and the new table) — otherwise every `spellings`-topic answer would silently show as an unmatched/orphaned `wordId` on the History page, exactly like the existing "soft reference" fallback behavior for a deleted `Word` row. This is a real dependency to account for during implementation planning, not just a content change.

## Open questions for later

- **Data model**: a dedicated new table (e.g. `SpellingQuestion { id, sentence, correctOption, explanation, createdAt }`), or extending `Word` with new nullable fields? A dedicated table is the more obvious fit given how different the shape is, but the History-page integration above needs to be designed either way.
- **Sentence storage**: keep the raw sentence text with inline `[A]`–`[E]` markers (simplest import — copy the CSV field verbatim — but requires a parser at render time to find the 5 segments), or pre-split into structured data (prefix/segment/separator pieces) at import time (trivial rendering, more complex one-time import logic)?
- **UI interaction model**: clickable/underlined inline segments within the rendered sentence (closest to how these questions look on paper), vs. a set of "A / B / C / D / E — No error" choice buttons below the full sentence (simpler, more consistent with the existing `QuestionCard` button-list pattern, easier accessibility)? If buttons are used, each button likely needs to show the actual candidate word too (e.g. "A — goverment"), not just the bare letter.
- **`QuestionType` enum**: add a new value (e.g. `SPOT_MISSPELLING`) to the existing Prisma enum (`WORD_TO_DEFINITION | DEFINITION_TO_WORD | SYNONYM_ANTONYM`), given `QuizAnswer.questionType` is a real enum column today?
- **Answer text representation**: should `QuizAnswer.selectedText`/`correctText` store the bare letter, or the letter plus the word (e.g. `"A — goverment"`) for readability in `MissedQuestionsReview` and History? Should the **explanation** be snapshotted onto `QuizAnswer` at submit time (matching the existing principle that `promptText`/`correctText`/`selectedText` are snapshotted so review stays correct even if the source content is later edited or deleted), or looked up live via a soft reference the same way `Word` enrichment works today?
- **Where explanations are shown**: immediately after answering during quiz play (alongside "Correct!"/"Incorrect"), in the post-quiz missed-questions review, on the History page, or some combination?
- **Difficulty**: `data/sp_qs_1.csv` has no difficulty column, unlike `Word.difficulty` (EASY/MEDIUM/HARD). Should spelling questions get a difficulty tag at all (manually authored later, or simply omitted/nullable), given the History page's `WordHistoryTable` currently always renders a "Difficulty: X" line for every topic?
- **Old `spellings`-tagged rows in `data/vocab_1.csv`..`vocab_5.csv`**: these are genuinely mislabeled generic vocabulary, unrelated to the new format. Should they be dropped from the CSVs (or retagged to `general-vocabulary`) before any future re-import, since `spellings` will now be sourced entirely from `data/sp_qs_1.csv`-style content? The production `Word` table is currently empty, so there's no live-data conflict to worry about — this only affects what gets imported next.
- **Quiz length / sampling**: 150 available questions comfortably covers the existing `ALLOWED_QUIZ_LENGTHS` (5/10/20) with random, non-repeating sampling per quiz, mirroring `/api/quiz/generate`'s existing `ORDER BY random() LIMIT` approach — no expected issue here, just confirming before implementation.
