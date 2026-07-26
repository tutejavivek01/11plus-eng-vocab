# History, Summary Dashboard & Theme Enhancements

Feature requests captured for future planning. Not yet planned or implemented.

## Overview

Three feature requests: (1) per-word attempt history, browsable by topic, with a confidence-level meter; (2) a home-page summary bar chart of tests/questions taken per topic; (3) a user-selectable page background color.

## 1. Word attempt history

### Header navigation
- Add a "History" link to the persistent header (`components/Header.tsx`), alongside the logo and sign-out. Today `/history` is only reachable via the home page's "Progress history" button — the header itself has no nav links yet.

### Per-word attempt tracking
For every word a student has ever answered, across all their quiz attempts, track:
- **Attempt count**: how many times this specific word (i.e. this `Word` row/id, not just matching text — some words share identical text across different topics/entries) has been answered by this student.
- **Last status**: whether the *most recent* attempt at this word was correct or incorrect.

This is new — today's `QuizAttempt`/`QuizAnswer` records capture each quiz session, but there's no existing per-word rollup across a student's whole history.

### History page: topic tabs
The History page gains tabs, one per topic (Synonyms / Antonyms / Spellings / General Vocabulary). Under each tab, list every word the student has attempted in that topic, showing:
- Word
- Definition
- Synonym
- Antonym
- Difficulty
- Status — a smiley icon: green/happy if the last attempt was correct, red/sad if incorrect (same visual language as the quiz-taking progress smilies).
- Total attempts (the per-word counter above).

How this relates to the *existing* History page content (a chronological list of past quiz attempts + aggregate stats) is an open question — see below.

### Confidence level meter (per topic)
For each topic, a confidence level derived from the percentage of correct answers:
- **High** — 80% or more
- **Medium** — 60% up to 80%
- **Low** — 40% up to 60%
- **"You should be worried"** — below 40%

(The original wording had the Medium/Low ranges both touching 60% — resolved above as Medium = [60%, 80%), Low = [40%, 60%). Confirm before implementation.)

What exactly "% correct" measures here — see open questions.

## 2. Home page test-summary bar chart

- Displayed on the **left side** of the home page (signed-in view).
- One bar per topic.
- Each bar has two colored segments: number of quizzes (tests) taken in that topic, and total number of questions answered in that topic.
- Each bar is labeled with a single-character confidence badge — **H** / **M** / **L** / **W** — using the same tiers and thresholds as Feature 1's confidence meter.

## 3. Background color picker

A control (dropdown and/or color-picker input) letting the student choose the page's background color.

Open questions on scope below — this interacts with the app's existing Tailwind `dark:` classes, which currently follow the OS/browser light-dark preference rather than a manual toggle.

## Data model implications (draft — TBD at implementation)

- Per-(user, word) attempt count and last-status: could be computed on the fly from existing `QuizAnswer` joined to `QuizAttempt` (grouped by `wordId`, "last" determined by `QuizAttempt.createdAt`), or backed by a new summary table if that aggregation proves too slow at scale.
- Per-topic confidence calculation sources from the same underlying attempt data.
- A persisted background color preference, if stored server-side, would need a new field on `User` (alternative: browser-only via `localStorage`, no DB change).

## Open questions for later

- Does the new topic-tabbed word list on the History page **replace** or **sit alongside** the existing attempt-list + aggregate-stats view?
- Confidence meter basis: percentage of **distinct attempted words whose last attempt was correct**, or percentage of **all answers ever given** (across every attempt, not just each word's latest)? These can differ meaningfully.
- Per-word tracking: computed live via aggregation query, or a new dedicated table/materialized rollup for performance?
- Bar chart: no charting library is currently installed — plain CSS/Tailwind bars, or add a charting dependency?
- Home page layout: what occupies the right side once the chart takes the left (existing "Start a quiz"/"Progress history" content needs a new home)?
- Color picker: persisted per-user (DB) vs. per-browser (`localStorage`) vs. session-only; a freeform color picker vs. a curated preset palette; whether it overrides only the page background or also needs to coordinate with existing light/dark component styling.
