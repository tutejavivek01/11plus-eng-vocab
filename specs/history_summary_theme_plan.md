# History, Summary Dashboard & Theme Enhancements — Implementation Plan

## Context

`specs/history_summary_theme_specs.md` captures three feature requests that are not yet implemented: (1) a per-word attempt history with a confidence meter, browsable by topic on the History page; (2) a home-page bar chart summarizing tests/questions taken per topic; (3) a user-selectable page background color. The spec deliberately left several product decisions open ("TBD at implementation"). Those have now been resolved with the user (see below), and the codebase has been explored in full (schema, History page, home page, quiz-submission flow, the smiley component, Header, and theming setup) so this plan is concrete rather than exploratory.

One additional, pre-existing issue surfaced during exploration and is being folded into this work at the user's request: `prisma/seed.ts` is wired as the project's official seed script (via `prisma.config.ts`) and destructively wipes and recreates the entire `Word` table (fresh `cuid()`s) every time it runs — meaning `QuizAnswer.wordId` values can already silently go stale today. Since Feature 1 depends on joining `QuizAnswer.wordId` back to `Word` for display, this plan fixes `seed.ts` to be non-destructive as part of the schema step.

### Decisions confirmed with the user
1. **History page**: new topic-tabbed per-word view sits **alongside** the existing chronological attempt list + `StatsPanel` — nothing existing is removed.
2. **Confidence metric** (used by both Feature 1's meter and Feature 2's H/M/L/W badge): % of **distinct words attempted in a topic whose most recent attempt was correct**. Tiers: High ≥80%, Medium [60,80), Low [40,60), "You should be worried" <40%.
3. **Background color preference**: persisted **per-user in the database** (new nullable `User.backgroundColor` field).
4. **Color picker**: a **curated preset palette** (7 options + default), not freeform.
5. **Bar chart**: **plain CSS/Tailwind**, no charting dependency; rendered as **grouped mini-bars** (tests-bar and questions-bar side by side per topic, each normalized against its own metric's max across topics) rather than a single literal stack — stacking is numerically misleading since questions-count is always ≥ tests-count.
6. **`seed.ts` landmine**: fix it now — make seeding idempotent/non-destructive (see Section A) rather than leaving it as an out-of-scope risk.

---

## A. Schema changes (`prisma/schema.prisma`)

```prisma
model User {
  id              String        @id @default(cuid())
  name            String?
  email           String        @unique
  passwordHash    String
  createdAt       DateTime      @default(now())
  backgroundColor String?       // preset key, e.g. "sunrise"; null = default theme
  quizAttempts    QuizAttempt[]
}

model Word {
  id         String     @id @default(cuid())
  word       String
  definition String
  topic      String
  difficulty Difficulty
  synonym    String?
  antonym    String?
  createdAt  DateTime   @default(now())

  @@index([topic])
  @@index([topic, difficulty])
  @@unique([word, topic])   // new — enables idempotent upsert-based seeding
}

model QuizAnswer {
  // ...unchanged fields...
  // wordId stays a plain String, NOT a Prisma relation — see rationale below.
  @@index([quizAttemptId])
  @@index([wordId])         // new — cheap, supports future per-word analytics
}
```

- `User.backgroundColor` is nullable with no default — purely additive, zero backfill risk.
- **`QuizAnswer.wordId` stays a plain scalar, not a real `@relation`.** Adding a real FK would force a choice of `onDelete` behavior, and every option is wrong here: `Restrict` (Prisma's default) would break word deletion entirely; `Cascade` would silently delete a user's answer history if a word is ever removed; `SetNull` requires making `wordId` nullable, which is a bigger change than this feature needs. `QuizAnswer` already snapshots `promptText`/`correctText`/`selectedText`, so a missing `Word` join only degrades *enrichment* (definition/synonym/antonym display), not attempt-review correctness — the data layer (Section B) defensively skips any `wordId` with no matching `Word` row.
- **Pre-migration diagnostics to run against the real DB before applying:**
  ```sql
  -- 1. Any QuizAnswer already pointing at a deleted Word? (informs how much the seed.ts bug has already bitten)
  SELECT count(*) FROM "QuizAnswer" qa LEFT JOIN "Word" w ON w.id = qa."wordId" WHERE w.id IS NULL;

  -- 2. Any existing duplicate (word, topic) pairs? Required to succeed before @@unique([word, topic]) can be added.
  SELECT word, topic, COUNT(*) FROM "Word" GROUP BY word, topic HAVING COUNT(*) > 1;
  ```
  If query 2 finds duplicates, they must be resolved (merge/delete duplicates, reassigning any `QuizAnswer.wordId` referencing a removed duplicate to the surviving row's id) before the migration can apply the unique constraint.
- Migration: `npx prisma migrate dev --name add_background_color_word_unique_and_index`. No CI runs `prisma migrate deploy` automatically (no `.github/` workflows exist) — applying this to the Neon prod DB is a manual step.

### `prisma/seed.ts` fix
Replace the current `deleteMany()` + `createMany()` (which assigns fresh ids and orphans any existing `QuizAnswer.wordId`) with a per-word `upsert` keyed on the new `@@unique([word, topic])`:
```ts
async function main() {
  for (const w of WORDS) {
    await prisma.word.upsert({
      where: { word_topic: { word: w.word, topic: w.topic } },
      update: { definition: w.definition, difficulty: w.difficulty, synonym: w.synonym, antonym: w.antonym },
      create: w,
    });
  }
  console.log(`Seeded/updated ${WORDS.length} words.`);
}
```
This never deletes a `Word` row, so ids (and therefore `QuizAnswer.wordId` references) are stable across reseeds, and re-running is idempotent.

### `prisma/import-words.ts` (one-line consequence)
Since `Word` now has a unique `(word, topic)` constraint, re-importing a CSV that includes an already-imported row would otherwise hard-fail the whole `createMany` call. Add `skipDuplicates: true` to the existing `prisma.word.createMany({ data: words })` call (Postgres supports this) so re-running an import script is safe. No other changes to this file.

---

## B. Shared per-word rollup / confidence data layer

New file **`lib/quiz/wordHistory.ts`** — pure, unit-testable functions (no Prisma import in the core logic, matching the `lib/quiz/stats.ts` convention) plus one thin Prisma entry point, reused by both Feature 1 and Feature 2 so there is exactly **one query per page load**, not one per topic:

```ts
export interface RawAnswerRow { wordId: string; isCorrect: boolean; orderIndex: number }
export interface RawAttemptRow { id: string; topic: string; createdAt: Date; answers: RawAnswerRow[] }

export interface WordAttemptSummary { wordId: string; attemptCount: number; lastCorrect: boolean }
export interface TopicRollup { topic: string; testsCount: number; questionsCount: number; words: WordAttemptSummary[] }

export function buildTopicRollups(attempts: RawAttemptRow[]): Map<string, TopicRollup>

export type ConfidenceTier = "high" | "medium" | "low" | "worried" | "none";
export function confidencePercent(words: WordAttemptSummary[]): number | null
export function computeConfidenceTier(percent: number | null): ConfidenceTier

export async function getUserAttemptHistory(userId: string): Promise<Map<string, TopicRollup>>
```

Semantics (exactly matching the confirmed decisions, and to be covered explicitly by tests):
- **Attempt count** = number of `QuizAnswer` rows for that `wordId` (not distinct `QuizAttempt` sessions) — the same word asked twice in one quiz counts as 2 attempts.
- **Last status**: sort attempts ascending by `createdAt`, and within an attempt sort answers ascending by `orderIndex`; fold into a `Map<wordId, WordAttemptSummary>` always overwriting, so the chronologically-last write wins (ties within one attempt resolved by higher `orderIndex`).
- **Confidence %** = distinct words whose `lastCorrect === true` / total distinct words attempted in that topic — computed only over the deduplicated `words` array, never raw answers. `null` if no words attempted.
- **Tiers**: `null → "none"`; `≥80 → "high"`; `[60,80) → "medium"`; `[40,60) → "low"`; `<40 → "worried"`.

`getUserAttemptHistory` query:
```ts
const attempts = await prisma.quizAttempt.findMany({
  where: { userId },
  orderBy: { createdAt: "asc" },
  select: {
    id: true, topic: true, createdAt: true,
    answers: { select: { wordId: true, isCorrect: true, orderIndex: true }, orderBy: { orderIndex: "asc" } },
  },
});
return buildTopicRollups(attempts);
```
This uses the existing `@@index([userId, createdAt])` on `QuizAttempt` and `@@index([quizAttemptId])` on `QuizAnswer` — no new index is required for correctness/performance here (the new `wordId` index from Section A is a nice-to-have for future analytics, not load-bearing for this query).

New file **`lib/quiz/topicSummary.ts`** (pure), built on top of B, consumed by Feature 2:
```ts
export interface TopicSummary {
  topic: string; label: string; testsCount: number; questionsCount: number;
  confidencePercent: number | null; confidenceTier: ConfidenceTier;
}
export function buildTopicSummaries(rollups: Map<string, TopicRollup>): TopicSummary[]
```
Always returns exactly the 4 entries from `lib/quiz/constants.ts`'s `TOPICS`, in that order, defaulting absent topics to zero counts and `"none"` tier — so a brand-new user sees 4 empty rows, not a variable-length list.

For Feature 1's per-word display (word/definition/synonym/antonym/difficulty), fetch the `Word` rows once across all 4 topics' distinct `wordId`s (not per tab) inside `app/history/page.tsx`:
```ts
const wordIds = [...new Set([...rollups.values()].flatMap(r => r.words.map(w => w.wordId)))];
const words = await prisma.word.findMany({ where: { id: { in: wordIds } }, select: { id: true, word: true, definition: true, synonym: true, antonym: true, difficulty: true } });
```
Any `wordId` with no matching `Word` (orphaned by a past bad seed run) is silently dropped from the merged display.

---

## C. Feature 1 — History page

**New components:**
- **`lib/ui/statusColors.ts`** — extract the existing green/red chip class strings out of `components/QuizProgressSmilies.tsx`'s `CHIP_CLASS` map into shared exports (`CORRECT_CHIP_CLASS`, `INCORRECT_CHIP_CLASS`), and update `QuizProgressSmilies.tsx` to import them. Small, low-risk dedup so new components share the exact same visual language without duplicating color strings.
- **`components/WordStatusBadge.tsx`** — `{ correct: boolean }` → renders the same emoji/chip shape as the smilies (😊/😞, using the shared classes above) but for a boolean, not a 3-state per-question array. Does not reuse `QuizProgressSmilies` itself since its prop shape and "unanswered" state don't apply per-word.
- **`components/ConfidenceMeter.tsx`** — takes `{ percent: number | null; tier: ConfidenceTier }`, renders a labeled 4-tier badge (green/yellow/orange/red + "You should be worried" text for the bottom tier) and the percent.
- **`components/WordHistoryTable.tsx`** — takes merged rows `{ wordId, word, definition, synonym, antonym, difficulty, lastCorrect, attemptCount }[]`. Renders as a **card list** (word + `WordStatusBadge` on top, definition below, synonym/antonym/difficulty/attempts as label:value pairs), matching the app's existing narrow `max-w-md` card style (`AttemptList.tsx`) rather than introducing the app's first `<table>` (avoids horizontal scroll on mobile).
- **`components/WordHistoryTabs.tsx`** — `"use client"`, takes `{ tabs: { value, label, content: ReactNode }[] }`, holds `useState` for active tab, toggles visibility. Server-rendered content (`ConfidenceMeter` + `WordHistoryTable`) is computed in `app/history/page.tsx` and passed down as `content` — valid Server-Component-as-prop pattern, so no client-side data fetching is needed.

**Page layout** (`app/history/page.tsx`) — existing content untouched, new section added below `StatsPanel`, above the (now-headed) existing attempt list:
```tsx
<main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-6">
  <h1 className="text-2xl font-semibold">Progress history</h1>
  <StatsPanel stats={stats} />
  <section>
    <h2 className="mb-3 text-lg font-semibold">Word-by-word history</h2>
    <WordHistoryTabs tabs={TOPICS.map(t => ({
      value: t.value, label: t.label,
      content: <>
        <ConfidenceMeter percent={summary.confidencePercent} tier={summary.confidenceTier} />
        <WordHistoryTable rows={rowsForTopic(t.value)} />
      </>,
    }))} />
  </section>
  <section>
    <h2 className="mb-3 text-lg font-semibold">Recent attempts</h2>
    <AttemptList attempts={attempts} />
  </section>
</main>
```
`computeHistoryStats`, `StatsPanel`, `AttemptList` get zero behavior changes.

**Header** (`components/Header.tsx`): add `<Link href="/history">History</Link>` inside the existing `{session?.user && (...)}` block. (Done in the same pass as Feature 3's "Settings" link, since both touch this file.)

---

## D. Feature 2 — Home page bar chart

**New components:**
- **`components/TopicSummaryChart.tsx`** — takes `summaries: TopicSummary[]` (always 4, `TOPICS` order). Renders one row per topic: topic label, a single-letter confidence badge, and two small grouped bars (tests / questions) each width-scaled against that metric's max value across the 4 topics (e.g. `width: ${(count / maxAcrossTopics) * 100}%`, guarding against divide-by-zero when all counts are 0).
- **`components/ConfidenceBadgeLetter.tsx`** — H/M/L/W single-letter badge, or "–" for `"none"`. Shares tier→color constants with `ConfidenceMeter` via a small new `lib/quiz/confidenceStyles.ts` module (extracted once both consumers exist).

**Layout** (`app/page.tsx`): the signed-in view moves from the single `max-w-md` column to a responsive two-column layout; the signed-out view is untouched.
```tsx
<main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-6 md:flex-row md:items-start">
  <div className="flex-1">
    <TopicSummaryChart summaries={summaries} />
  </div>
  <div className="flex w-full flex-col gap-4 text-center md:w-64">
    {/* existing "Signed in as", "Start a quiz", "Progress history" content, unchanged */}
  </div>
</main>
```
Data: reuse `getUserAttemptHistory(userId)` from B, then `buildTopicSummaries(...)` from D's underlying `lib/quiz/topicSummary.ts` — one query, shared with the History page's data needs (though these are two separate requests since they're two separate page loads).

---

## E. Feature 3 — Background color

**Palette** (`lib/theme/presets.ts`, new) — 7 presets + implicit "Default" (no override), each a light/dark hex pair chosen so the existing OS-driven `--foreground`/`dark:` text utilities stay readable (light variants ~90-96% lightness near the current `#ffffff`; dark variants ~10-20% lightness near the current `#0a0a0a`):

| key | label | light | dark |
|---|---|---|---|
| sunrise | Sunrise | `#fff4e6` | `#3a2a18` |
| mint | Mint | `#e6f7f0` | `#123326` |
| sky | Sky | `#e8f3fc` | `#122a3d` |
| lavender | Lavender | `#f1ecfa` | `#2c2140` |
| blush | Blush | `#fdecef` | `#3a1e24` |
| sand | Sand | `#f7f1e3` | `#332b1a` |
| slate | Slate | `#eef1f4` | `#1b2226` |

`User.backgroundColor` stores the preset **key** (e.g. `"sunrise"`), not a raw hex — keeps validation to a fixed allowlist.

**CSS** (`app/globals.css`) — one attribute-selector block per preset, gated by the same `@media (prefers-color-scheme: dark)` query the rest of the app already uses (so presets stay in lockstep with the OS signal driving every other `dark:` class):
```css
[data-bg-preset="sunrise"] { --background: #fff4e6; }
@media (prefers-color-scheme: dark) {
  [data-bg-preset="sunrise"] { --background: #3a2a18; }
}
/* ...repeat per preset... */
```
`--foreground` is left untouched — the palette's lightness bands were chosen specifically so this is safe without any contrast computation.

**Applying it** (`app/layout.tsx`): convert `RootLayout` to `async` (mirroring `Header`'s existing pattern), call `getServerSession(authOptions)`, and if signed in, `prisma.user.findUnique({ where: { id }, select: { backgroundColor: true } })`; render `<html data-bg-preset={backgroundColor ?? "default"} ...>`. One extra PK-indexed lookup per page load — acceptable per CLAUDE.md's "small indexed queries" guidance. (No `SessionProvider`/client session state exists anywhere in this codebase today, so embedding the color in a client-refreshed session is not the right path — stick with the server-side lookup pattern already used by `Header.tsx`.)

**API**: `app/api/user/preferences/route.ts`, `PATCH` — validates `backgroundColor` against the preset keys in `lib/theme/presets.ts` (or `null` to reset to default), then `prisma.user.update({ where: { id }, data: { backgroundColor } })`, gated by `getServerSession`.

**UI**: new `app/settings/page.tsx` (auth-gated, redirect to `/signin` like `/history`), rendering `components/BackgroundColorPicker.tsx` (`"use client"`) — a row of preset swatch buttons (each swatch's `light` hex shown purely as a preview color, not a freeform input) plus a "Default" option; on click, `fetch(PATCH ...)` then `router.refresh()` so `RootLayout`'s `data-bg-preset` updates immediately without a full reload.

**Header**: add `<Link href="/settings">Settings</Link>` alongside the History link (same diff as Section C).

---

## F. Testing plan

**Pure-function unit tests**, mirroring `lib/quiz/stats.test.ts`'s style:
- `lib/quiz/wordHistory.test.ts` — `buildTopicRollups`: empty input; single word/single attempt; same word across two attempts (later `createdAt` wins); same word twice within one attempt (higher `orderIndex` wins; `attemptCount` counts answer-rows, not sessions); topic isolation; `testsCount`/`questionsCount` aggregation. `confidencePercent`: empty → `null`; all-correct → 100. `computeConfidenceTier`: every boundary explicitly (79.99/80, 59.99/60, 39.99/40, 0, 100, `null`).
- `lib/quiz/topicSummary.test.ts` — `buildTopicSummaries` always returns exactly 4 entries in `TOPICS` order; correct zero-defaults for topics absent from the input.

**Component tests** (RTL, mirroring `QuizProgressSmilies.test.tsx`):
- `WordStatusBadge`, `ConfidenceMeter`, `ConfidenceBadgeLetter` — correct label/aria-label per state/tier, including the "worried" tier's distinct wording.
- `WordHistoryTable` — empty-state text; one row per word with correct field values.
- `WordHistoryTabs` — default active tab; clicking switches the visible panel (`userEvent`).
- `TopicSummaryChart` — 4 rows in fixed order; bar widths correct for known inputs including the all-zero case.
- `BackgroundColorPicker` — one swatch per preset; click triggers the expected `fetch` PATCH body and `router.refresh` (mock `next/navigation`).

No new route-handler tests for `app/api/user/preferences/route.ts` — there are no existing tests for any `app/api/**` route today (not even `quiz/submit`), so this stays consistent with the current convention of testing only `lib/*` and components.

---

## G. Sequencing

1. **Schema + seed fix** (A): diagnostics against the real DB, `Word` unique constraint + `User.backgroundColor` + `QuizAnswer` index, one combined migration, `seed.ts` rewritten to `upsert`, `import-words.ts` gets `skipDuplicates: true`.
2. **Shared data layer** (B): `lib/quiz/wordHistory.ts` + `lib/quiz/topicSummary.ts`, fully unit-tested before any UI work — both Features 1 and 2 depend on this.
3. **Feature 1** (C): components, History page wiring, Header "History" link.
4. **Feature 2** (D): chart components (extracting `lib/quiz/confidenceStyles.ts` once both consumers exist), Home page layout restructure.
5. **Feature 3** (E): independent of 1/2/B aside from the shared migration — palette, CSS, `layout.tsx` async conversion, API route, `/settings` page, Header "Settings" link (bundled with step 3's Header edit).
6. **Final pass**: `npm run lint`, `npm run test`, manual smoke test of all 7 presets in both OS light and dark mode, manual `npx prisma migrate deploy` against the Neon prod DB as part of deployment (no CI automates this today).

### Critical files
- `prisma/schema.prisma`, `prisma/seed.ts`, `prisma/import-words.ts`
- `lib/quiz/wordHistory.ts` (new), `lib/quiz/topicSummary.ts` (new), `lib/quiz/confidenceStyles.ts` (new), `lib/theme/presets.ts` (new), `lib/ui/statusColors.ts` (new)
- `app/history/page.tsx`, `app/page.tsx`, `app/layout.tsx`, `app/settings/page.tsx` (new), `app/api/user/preferences/route.ts` (new)
- `app/globals.css`, `components/Header.tsx`, `components/QuizProgressSmilies.tsx`

## Verification
- `npm run test` — all new pure-function and component tests pass alongside existing suite.
- `npm run lint` and `npm run build` — no type/lint errors from the schema/client regeneration or new components.
- `npx prisma migrate dev` runs cleanly against a local dev DB seeded via the fixed `prisma/seed.ts` (run twice in a row to confirm idempotency — word ids stay stable, no duplicate-key errors).
- Manual walkthrough: sign in, take a quiz in each topic, visit `/history` (confirm tabs, per-word statuses/attempt counts, confidence meter matches manual calculation), visit `/` (confirm chart renders, badges match History page's tiers), visit `/settings` (confirm each preset applies immediately and persists across a reload/re-login), toggle OS light/dark mode with a preset active to confirm text stays readable.
