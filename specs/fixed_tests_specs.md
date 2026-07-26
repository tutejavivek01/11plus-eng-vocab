# Fixed Practice Tests

Feature request captured for future planning. Not yet planned or implemented.

## Overview

A new "Practice Tests" tab/page offering 48 pre-defined, fixed-content tests (numbered 1–48, split into four difficulty bands of 12 tests each). Unlike today's quizzes — which sample random questions fresh on every attempt (`/api/quiz/generate`) — every student who takes "Test #7" must see the exact same 12 questions in the exact same order, every time, forever. This is a materially different mechanism from the existing free-form quiz flow and needs its own persisted question sets rather than on-the-fly generation.

## 1. Practice Tests page

- New "Practice Tests" nav link (alongside the existing History/Settings links in `components/Header.tsx`) and a new page.
- A filter control: **Easy / Medium / Hard / Mix**.
- Selecting a band lists that band's 12 tests, each showing: test name, status (**Attempted** / **Not attempted**), and last score.
- Selecting a test starts it. Attempt history is viewed from the History page (see Section 4), not from this page.

## 2. The 48 fixed tests

- Numbered continuously 1–48 across bands:
  - Easy: Test #1–12
  - Medium: Test #13–24
  - Hard: Test #25–36
  - Mix: Test #37–48
- Each test has exactly **12 questions**, drawn only from the existing word/spelling content already in the database (`Word` and `SpellingQuestion` tables) — never hardcoded.
- Each test blends all 4 topics (Synonyms, Antonyms, Spellings, General Vocabulary), **3 questions from each topic** (3 × 4 = 12 — consistent).
- **Determinism requirement**: because "same test number → same questions for every student," each test's question set must be generated **once** and persisted, not regenerated per request. Today's `/api/quiz/generate` always does `ORDER BY random() LIMIT n` against the live `Word`/`SpellingQuestion` tables on every call — that mechanism cannot satisfy this requirement as-is. Fixed Tests need a one-time generation step (e.g. a seed/admin script) whose output is saved to the database and simply read back on every subsequent attempt, by any student.

## 3. Difficulty banding vs. what the data actually supports

Current word-bank counts (checked against the live database):

| Topic | EASY | MEDIUM | HARD |
|---|---|---|---|
| Synonyms | 158 | 130 | 88 |
| Antonyms | 158 | 130 | 88 |
| General Vocabulary | 158 | 130 | 88 |

Every vocab topic has comfortably more than the 36 words needed per difficulty band (12 tests × 3 questions), so Easy/Medium/Hard/Mix tests can each draw genuinely distinct, non-repeating words for the 3 vocab topics.

**Spellings: confirmed to ignore difficulty entirely.** `SpellingQuestion` has no difficulty field (the source data never had one — a deliberate decision from `specs/spellings_specs.md`). Per the updated requirements, spelling questions are added to every test — Easy, Medium, Hard, or Mix alike — **without considering difficulty**, drawn from the same flat, undifferentiated 150-question pool regardless of band.

**Pool capacity note**: 48 tests × 3 spellings questions = 144 uses against 150 available `SpellingQuestion` rows. This is tight — on average almost every spelling question gets used exactly once across all 48 tests, with only 6 spare — but sufficient, so long as the assignment process spreads usage across the pool rather than clustering repeats. Not a blocking concern, just worth keeping in mind at generation time.

## 4. Attempt history — test-level, not topic-level

- Confirmed: attempt history for Practice Tests lives **at the test level**, not folded into the existing per-topic word history. A student's answers within a Practice Test do not contribute to the Synonyms/Antonyms/Spellings/General Vocabulary tabs' per-word confidence/history data — those two systems stay separate.
- The existing `/history` page gains a **new "Tests" tab**, alongside its current topic tabs, showing Practice Test attempt history organized by test number: which tests have been attempted, their most recent score, and — per attempt — every question with its right/wrong outcome and explanation (the same depth of detail `MissedQuestionsReview`/the attempt-detail page already provide today for topic quizzes, just scoped to a fixed test rather than a free-form one).
- Schema note: `QuizAttempt.topic` is currently always one of the 4 canonical topic strings — there's no existing way to record "this attempt was of Fixed Test #7," since a Practice Test attempt spans all 4 topics in one sitting. Some new field/relationship is needed to tag a `QuizAttempt` with its fixed-test number.

## 5. Retakes

- Confirmed: a student can retake any fixed test any number of times.
- Every attempt is still recorded and viewable in the test-level history (Section 4) — nothing is discarded.
- The Practice Tests list page's "last score" column reflects only the **most recent** attempt's score, not a best-ever or average.

## 6. Quiz-taking flow

- One question at a time, immediate correct/incorrect feedback on selection — matches the existing `QuizPlayClient` → `/api/quiz/check-answer` → `QuestionCard`/`SpellingQuestionCard` flow already built, which should be largely reusable as-is for the "ask one at a time, check immediately" mechanic.
- **"Explain the reason if wrong, with maximum information available"**: confirmed to drop — spelling questions keep their existing authored `explanation` (shown in full, as today), and vocab questions keep today's existing feedback ("Incorrect. Correct answer: X", via `components/QuestionCard.tsx`) with no additional enrichment required.

## Data model implications (draft — TBD at implementation)

- A new persisted representation of each fixed test's exact, permanent question set — e.g. a `FixedTest` model (number 1–48, difficulty band, name) plus a `FixedTestQuestion` model (which `Word`/`SpellingQuestion` row, question type, order 1–12) — generated once via a seed/admin script and never regenerated, so the "same number → same questions, forever" guarantee holds even if the underlying word bank is later edited or re-imported.
- `QuizAttempt` needs some way to record which fixed test (if any) an attempt belongs to, since `topic` doesn't fit a test that blends all 4 topics in one sitting.
- The existing `QuizAnswer` shape (already question-type-agnostic after the spellings work) should be reusable as-is for recording each fixed-test question's right/wrong outcome.

## Resolved

- **Test naming**: `Test #<number>` (e.g. "Test #1", "Test #37").
- **Generation mechanism**: a one-time seed/admin script that persists all 48 tests' question sets permanently, per Section 2/Data model.
- **"Maximum information" feedback enrichment**: dropped — reuse today's existing feedback content as-is for both question types.

All open questions from the previous revision are now resolved. Ready for implementation planning.
