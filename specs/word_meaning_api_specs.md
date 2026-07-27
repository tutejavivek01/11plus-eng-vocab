# Word Meaning / Synonyms / Antonyms Panel

Implemented.

## Overview

A small panel on the right side of the question card, shown once a student answers a vocab question (Synonyms, Antonyms, or General Vocabulary — i.e. `WORD_TO_DEFINITION`, `DEFINITION_TO_WORD`, `SYNONYM_ANTONYM` question types), enriching the review moment with the tested word's dictionary meaning and a fuller list of synonyms/antonyms than the quiz itself reveals. Sourced from two free, keyless APIs, via a small server-side proxy route (see below).

## Decisions confirmed

1. **Scope**: vocab questions only. Spelling questions (`SPOT_MISSPELLING`) are skipped — a "spot the error" sentence tests 5 candidate words at once, so there's no single word to look up.
2. **Data sources**:
   - **[dictionaryapi.dev](https://dictionaryapi.dev/)** for the definition/part of speech (`GET https://api.dictionaryapi.dev/api/v2/entries/en/<word>`), sourced from Wiktionary, no key, no signup.
   - **[Datamuse](https://www.datamuse.com/api/)** for synonyms and antonyms (`GET https://api.datamuse.com/words?rel_syn=<word>` and `...?rel_ant=<word>`, two separate calls — Datamuse doesn't support both relations in one request), no key, no signup. dictionaryapi.dev has its own synonym/antonym fields, but they're too sparse/inconsistent to rely on.
   - **Correction found during implementation**: `dictionaryapi.dev` does send `Access-Control-Allow-Origin: *` (verified via a direct header check), safe for a browser to call directly — but **Datamuse sends no CORS header at all**, so a real browser silently blocks those calls even though server-to-server requests (and curl) succeed fine. The fix: a small server-side route, `app/api/word-meaning/route.ts` (backed by `lib/wordMeaning.ts`), calls both external APIs and returns one bundled response. Same two data sources as decided — just fetched from the server instead of the browser, and as a side benefit the client only makes one request instead of three across two domains.

## Behavior

- **Trigger**: the panel populates the moment per-question feedback appears (the same instant "Correct!"/"Incorrect" shows today) — matching "after the student submits the answer."
- **Content**: definition + part of speech (from dictionaryapi.dev's first sense), a list of synonyms, a list of antonyms (from Datamuse, deduplicated against whatever the quiz question itself already showed as its correct answer, so nothing feels redundant).
- **Loading/error state**: a lightweight "Loading..." while the two API calls are in flight, and a graceful "No additional information available" if dictionaryapi.dev returns 404 (word not found — happens for some proper nouns or less common headwords) or either API fails/times out. A failure here must never block or interfere with the quiz flow itself (answer-checking/scoring already works independently of this panel).
- **No caching**: each occurrence fetches live; given expected traffic (a single student working through 5-20 questions per quiz), this is simple and sufficiently fast — no need for request deduplication or a persistence layer for this.
- **Layout**: the question-play screens (`QuizPlayClient`, `PracticeTestPlayClient` — both currently a single centered `max-w-md` column) grow into a responsive two-column layout at `md:` breakpoints and above (question card + progress smilies on the left, this panel on the right), collapsing to a stacked single column below that, consistent with how the home page's chart/button-column layout was already handled.

## Data model implications

The client needs the actual **word text** being tested, which today's `GeneratedQuestion` shape (`{ wordId, questionType, variant?, prompt, options }`) doesn't carry — only `prompt` (a full sentence) and `options` (answer choices, not necessarily the word itself for `DEFINITION_TO_WORD`/`SYNONYM_ANTONYM`). This needs a new `word: string | null` field on `GeneratedQuestion`, populated:
- In `lib/quiz/generateQuiz.ts`'s question builders (`buildWordToDefinition`/`buildDefinitionToWord`/`buildSynonymAntonym`) — each already has the subject `Word` row in scope, so this is a one-line addition per builder.
- `null` for spelling questions (`toGeneratedSpellingQuestion` in `lib/quiz/spellingQuestions.ts`).
- **`FixedTestQuestion` needs a new nullable column** (e.g. `wordText`) to carry this through for Practice Tests, since those questions are fully baked at seed time rather than derived live. Since all 48 tests (576 questions, both locally and in production) already exist, this requires a **backfill**, not just a forward-only migration: a one-time script joining each non-spelling `FixedTestQuestion.contentId` back to its source `Word.word` (the `contentId` traceability field, already present for exactly this kind of purpose, still resolves correctly since no seeded word has been deleted).

## Implementation notes

- **Word normalization**: lowercase, trimmed, stripped to letters/apostrophes/hyphens only (`lib/wordMeaning.ts`) before querying either API.
- **Layout**: `QuizPlayClient`/`PracticeTestPlayClient` grow to `max-w-4xl` with `md:flex-row` at the `md:` breakpoint — the existing question column stays `max-w-md`, the new panel is a `md:w-72` right column, collapsing to a stacked single column below `md:`.
- **Not implemented**: de-duplicating the word's own already-shown correct answer out of its synonym/antonym list. The panel shows Datamuse's results as-is; on some questions a synonym/antonym may repeat what the quiz already revealed as the correct answer. Left as a future refinement rather than blocking this feature.
- **Data flow**: `GeneratedQuestion` gained an optional `word?: string` field (populated by the three vocab question builders in `lib/quiz/generateQuiz.ts`; absent for spelling questions). `FixedTestQuestion` gained a matching nullable `wordText` column, backfilled for all 576 pre-existing rows via `prisma/backfill-fixed-test-word-text.ts`.
