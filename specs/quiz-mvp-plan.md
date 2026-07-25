# Quiz MVP — Implementation Plan (as approved)

This is the plan approved before implementation began, produced from `specs/quiz-mvp.md`. See "Actual implementation notes" at the end for where the build deviated from or extended this plan.

## Context

`specs/quiz-mvp.md` defines the MVP for the 11+ vocabulary quiz app: logged-in users configure and take a multiple-choice quiz drawn from the DB-backed word bank, get immediate per-question feedback, see a results/review screen, and can view past attempts with simple stats. The repo was fully greenfield when this plan was written — only `CLAUDE.md` and `specs/` existed, no `package.json` or scaffolding yet. This plan covers scaffolding through a working MVP, following the stack and constraints fixed in `CLAUDE.md` (Next.js App Router, Tailwind, NextAuth + Google + Prisma adapter, Postgres/Neon via Prisma, Vitest, serverless-friendly query patterns).

Three points the spec explicitly left open were confirmed with the user before finalizing:
- **Quiz lengths**: `[5, 10, 20]`
- **History stats**: total attempts, overall average score %, best-performing topic (min. attempt count to avoid a single lucky run winning)
- **Topics**: fixed seeded list of plain strings (`synonyms`, `antonyms`, `spellings`, `general-vocabulary`), no `Topic` model, no admin UI

## Key design decisions

- **Three question types**, not two: `WORD_TO_DEFINITION`, `DEFINITION_TO_WORD`, `SYNONYM_ANTONYM`. `Word` gets nullable `synonym`/`antonym` fields so synonym/antonym questions don't need a second correlated table.
- **Distractors**: always sampled from other `Word` rows in the same topic — including for synonym/antonym questions (other words' synonym/antonym values, not just other words).
- **No `WordOption` table**: options for all question types are derived at generation time from other `Word` rows in the topic; nothing is precomputed/stored.
- **QuizAttempt + QuizAnswer (normalized, one row per question)**, not a JSON blob — keeps review/history queries plain indexed SQL. `QuizAnswer` denormalizes `promptText`/`correctText`/`selectedText` so history stays renderable even if the underlying `Word` is later edited/deleted.
- **Quiz generation is stateless**: nothing is written to the DB until submission. Generation returns the question set to the client (options only — **no correct answer included**, so a client can't just read it off the network response); submission independently re-derives the correct answer from the DB per `wordId`/`questionType`(/`variant` for synonym vs antonym) and computes score server-side. This is the "don't trust client scores" guarantee from `CLAUDE.md`.
- **Generation is O(1) DB queries regardless of length**: one `SELECT ... WHERE topic = $1 ORDER BY random() LIMIT length*4` (capped), then all question/option/distractor assembly happens in-memory against that pool. If the pool is smaller than `length`, return a 422-style error rather than silently shortening the quiz.
- **No separate `/quiz/results` route**: the play page swaps its own UI into a results view once submission completes (avoids sessionStorage/serialization). A refreshed results page is still recoverable via `app/history/[id]`, which replays a past attempt using the same review components.

## Data model (`prisma/schema.prisma`)

Beyond NextAuth's required `User`/`Account`/`Session`/`VerificationToken` (via Prisma adapter, per `CLAUDE.md`):

```prisma
enum Difficulty { EASY MEDIUM HARD }

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
}

enum QuestionType { WORD_TO_DEFINITION DEFINITION_TO_WORD SYNONYM_ANTONYM }

model QuizAttempt {
  id        String       @id @default(cuid())
  userId    String
  topic     String
  length    Int
  score     Int
  createdAt DateTime     @default(now())
  user      User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  answers   QuizAnswer[]

  @@index([userId, createdAt])
  @@index([userId, topic])
}

model QuizAnswer {
  id            String       @id @default(cuid())
  quizAttemptId String
  wordId        String
  questionType  QuestionType
  promptText    String
  correctText   String
  selectedText  String
  isCorrect     Boolean
  orderIndex    Int
  quizAttempt   QuizAttempt  @relation(fields: [quizAttemptId], references: [id], onDelete: Cascade)

  @@index([quizAttemptId])
}
```

`topic` stays a plain `String` (fixed list defined in `lib/quiz/constants.ts` and the seed script), per the confirmed decision.

## Quiz generation (`lib/quiz/generateQuiz.ts`)

1. One query: `SELECT * FROM "Word" WHERE topic = $1 ORDER BY random() LIMIT $2` (`$2 = min(length * 4, 200)`).
2. If `pool.length < length`, error out (client should offer a shorter length/different topic).
3. Take first `length` pool words as question subjects (already randomized).
4. Assign a question type per subject via round-robin + shuffle, falling back away from `SYNONYM_ANTONYM` when a word has neither `synonym` nor `antonym`.
5. Build each question's correct value + 3 distractors from the remaining pool in-memory, deduping on text collisions; for `SYNONYM_ANTONYM`, choose synonym-or-antonym mode per word (based on what's populated) and pull distractors from the same field on other pool words.
6. Shuffle each question's 4 options (Fisher-Yates).
7. Return `{ topic, length, questions: [{ wordId, questionType, variant?, prompt, options }] }` — no correct-answer field.

`lib/quiz/validateAnswers.ts` re-derives correctness on submission: fetch the referenced `Word` rows in one `WHERE id IN (...)` query, compute each question's correct text from `questionType`(+`variant`), compare against submitted `selectedText`, tally `score`.

## API routes

- `POST /app/api/quiz/generate/route.ts` — session required; body `{ topic, length }` (length validated against `[5,10,20]`); returns question set (see above).
- `POST /app/api/quiz/submit/route.ts` — session required; body `{ topic, length, answers: [{ wordId, questionType, variant?, prompt, selectedText }] }`; re-validates against DB, creates `QuizAttempt` + nested `QuizAnswer` rows in one write, returns `{ attemptId, score, length, results: [...] }`.
- `GET /app/api/quiz-attempts/route.ts` — session required; returns the user's attempts (most recent first) + computed stats (total attempts, average score %, best topic w/ min attempt threshold), computed in-memory from one `findMany` query.
- `GET /app/api/quiz-attempts/[id]/route.ts` — session required; ownership-checked (404 if not owner); returns one attempt with its `answers`, for the history detail/review page.

## Pages & components (`app/`, App Router)

```
app/
  layout.tsx                      # root layout, session provider
  page.tsx                        # landing/dashboard: sign-in, or links to setup/history
  api/auth/[...nextauth]/route.ts
  api/quiz/generate/route.ts
  api/quiz/submit/route.ts
  api/quiz-attempts/route.ts
  api/quiz-attempts/[id]/route.ts
  quiz/setup/page.tsx             # topic + length pickers -> calls generate, navigates to play
  quiz/play/page.tsx               # client component: one-question-per-screen, then swaps to in-page results view on submit
  history/page.tsx                 # attempt list + stats (server component, direct Prisma query)
  history/[id]/page.tsx            # replay one past attempt's review
  components/
    TopicSelect.tsx, LengthSelect.tsx, QuestionCard.tsx,
    ScoreSummary.tsx, MissedQuestionsReview.tsx, AttemptList.tsx, StatsPanel.tsx
lib/
  prisma.ts                        # module-level singleton
  auth.ts                          # shared authOptions (Google + PrismaAdapter)
  quiz/generateQuiz.ts, validateAnswers.ts, constants.ts (TOPICS, ALLOWED_QUIZ_LENGTHS = [5,10,20])
```

Every page under `app/quiz/*` and `app/history*` is a server component gating on `getServerSession(authOptions)` (redirect if absent), consistent with `CLAUDE.md`. API routes independently re-check session as defense in depth.

## Seed script (`prisma/seed.ts`)

In-file word arrays (not app-facing, so it doesn't violate "no hardcoded word data in components/logic") covering the 4 fixed topics, ~15–25 words each, spanning all 3 difficulties, with `synonym`/`antonym` populated especially on the `synonyms`/`antonyms` topic words. `deleteMany()` + `createMany()` for idempotent reseeding. Add `"prisma": {"seed": "tsx prisma/seed.ts"}` to `package.json` (with `tsx` as a dev dependency) so `npx prisma db seed` works.

## Testing plan (Vitest)

Worth testing now (pure functions, no DB needed):
- `generateQuiz.ts`: correct question count, correct answer always present in options, no duplicate option text, synonym/antonym only assigned when data supports it (with fallback), options genuinely shuffled/structurally sound.
- `validateAnswers.ts`: correct scoring including a test that a tampered/incorrect `selectedText` claiming correctness is still scored server-side as incorrect.
- Stats computation (average %, best topic incl. min-attempt threshold, zero-attempts edge case) as an extracted pure function.
- Component tests for `QuestionCard` (click → immediate feedback, further selection disabled) and `ScoreSummary`/`MissedQuestionsReview`.

Not worth it yet: NextAuth/OAuth flow itself, real-DB integration tests, full page-level click-through integration tests, statistical shuffle-distribution assertions.

## Build order / milestones

1. **Scaffold + auth + schema + seed** — `create-next-app` per `CLAUDE.md`, install Prisma/NextAuth/Vitest deps, write schema, `prisma migrate dev`, `lib/prisma.ts`, `lib/auth.ts`, NextAuth route, seed script + `prisma db seed`. Verify: Prisma Studio shows seeded words; Google sign-in creates `User`/`Account`/`Session`.
2. **Quiz generation + setup page** — `generateQuiz.ts` + unit tests, `/api/quiz/generate`, `quiz/setup` page. Verify: generation returns a well-formed mixed-type question set for a signed-in user.
3. **Quiz-taking + submission** — `quiz/play` page + `QuestionCard`, `validateAnswers.ts` + unit tests, `/api/quiz/submit`. Verify: full click-through gives correct immediate feedback; DB rows are accurate; manually tamper a submitted answer via devtools to confirm server-side score doesn't trust it.
4. **Results screen** — in-page results view, `ScoreSummary`, `MissedQuestionsReview`, "start another quiz." Verify: score and missed-question list match actual answers.
5. **Progress history** — `history` + `history/[id]` pages, `AttemptList`, `StatsPanel`, stats function + tests, both `quiz-attempts` API routes. Verify: chronological list, correct stats, attempt replay works.
6. **Polish/hardening** — confirm auth gating on all protected pages (including direct-URL access while signed out), confirm Prisma singleton survives dev hot-reload, run `npm run test`/`lint`/`build` clean.

## Critical files

- `prisma/schema.prisma`
- `lib/quiz/generateQuiz.ts`
- `lib/quiz/validateAnswers.ts`
- `app/api/quiz/generate/route.ts`
- `app/api/quiz/submit/route.ts`
- `prisma/seed.ts`

---

# Actual implementation notes

Everything above was implemented and all 6 milestones completed. This section records where the build deviated from or added to the plan above, and what's still outstanding.

## Deviation: added `POST /api/quiz/check-answer`

Not in the original plan. Needed to reconcile two commitments made together above: immediate per-question feedback (spec requirement) and never sending correct answers in the bulk `/api/quiz/generate` response (the anti-cheat trust boundary). Without a way to check a single answer server-side, one of those two would have had to give.

- Session-gated, one indexed `Word` lookup by primary key, computes correctness via the same `getCorrectAnswer` helper used elsewhere.
- Writes nothing to the DB — `QuizAttempt`/`QuizAnswer` rows are still only created in bulk on final `/api/quiz/submit`, exactly as planned.
- Called once per question as the user answers it, from `components/QuizPlayClient.tsx`.

`lib/quiz/generateQuiz.ts` was refactored to export `getCorrectAnswer(word, questionType, variant?)` as a shared helper, used by quiz generation, `validateAnswers.ts`, and `check-answer` alike, so "what counts as correct" has one source of truth.

## Deviation: Prisma 7 datasource/client setup

The plan assumed a `datasource.url` in `schema.prisma`, which the installed version (Prisma 7.9.0) no longer supports — the CLI errors with "the datasource property `url` is no longer supported in schema files." Prisma 7 requires a driver adapter passed to the `PrismaClient` constructor instead. Adjusted:

- Installed `@prisma/adapter-pg` + `pg` (+ `@types/pg`).
- `schema.prisma`'s `datasource` block has no `url`; the connection string lives in `prisma.config.ts` (used by the CLI for migrate/seed) and is passed directly to `PrismaPg` in `lib/prisma.ts` and `prisma/seed.ts`.
- `lib/prisma.ts`'s singleton pattern (the `globalThis` guard from `CLAUDE.md`) is unchanged in spirit, just wraps a `PrismaPg`-backed client instead of a bare `new PrismaClient()`.
- Generator provider was pinned to the classic `prisma-client-js` (Prisma 7 defaults to a new `prisma-client` ESM generator with a custom `output` path) so the client lands at the standard `@prisma/client` import path — needed for `@next-auth/prisma-adapter` compatibility and to match the CLAUDE.md-assumed import pattern.
- `.env.local` (not `.env`) is the single source of truth per `CLAUDE.md`; `prisma.config.ts` was adjusted to load `.env.local` explicitly since Prisma's own scaffold defaults to `.env`.

## Deviation: local dev database is Prisma's own `prisma dev` server, not Neon

No Docker or local Postgres was available in the environment. Used `npx prisma dev` (Prisma 7's built-in local Postgres, no account needed) for local development instead of a real Neon connection. Practical notes for whoever picks this up:

- The server must be started with `npx prisma dev` (add `-d`/`--detach` for background, or just run it and leave it running) before `npm run dev`, migrations, or seeding will work. It's currently running in the background from this session.
- This embedded server's shadow-database support is incomplete: `prisma migrate dev` fails with `Error: P1017 / unexpected message from server` when it tries to create a shadow database. Worked around by using `prisma db push` to apply the schema directly, then separately generating the migration SQL via `prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script` and hand-placing it at `prisma/migrations/20260725213032_init/migration.sql` (with `migration_lock.toml`), so there's a valid migration history ready for `prisma migrate deploy` against a real Postgres (Neon) later. The local dev DB's own `_prisma_migrations` bookkeeping table is not marked as having this migration applied (a `migrate resolve --applied` attempt also failed against this embedded server) — cosmetic only, doesn't affect the app.
- **Switching to real Neon for production** (or to test against real Postgres locally): replace `DATABASE_URL` in `.env.local`/Vercel env vars with the pooled Neon connection string, then run `npx prisma migrate deploy` to apply the saved migration cleanly (real Postgres supports shadow databases, so this should work without the workaround above).

## Deviation: seed data expanded beyond the plan's suggested volume

The plan suggested ~15–25 words per topic; the first pass at that volume (17–18 words/topic) was too small to support a 20-question quiz once the distractor-headroom requirement was considered (subjects consume the pool; distractors need to come from what's left). Expanded to 26–29 words per topic (111 words total) so all three confirmed quiz lengths (5/10/20) work for every topic.

## Not yet done: real auth verification

Google OAuth credentials (`GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` in `.env.local`) are still placeholders — creating a real OAuth client in Google Cloud Console is an external-account action outside what could be done in this session. Everything that could be verified without it was verified via direct Prisma smoke tests against the live dev DB (bypassing HTTP auth) and via curl checks that every protected page/route correctly gates on session:

- End-to-end generate → answer (including a deliberately tampered answer) → validate → persist, confirmed against the real local dev Postgres, including that the tampered answer was correctly scored as incorrect.
- History stats computation and ownership isolation (one user cannot read another's attempt), confirmed against the live DB.
- All of `/quiz/setup`, `/quiz/play`, `/history`, `/history/[id]` redirect signed-out visitors; all of `/api/quiz/generate`, `/api/quiz/submit`, `/api/quiz/check-answer`, `/api/quiz-attempts`, `/api/quiz-attempts/[id]` return 401 without a session.

Once real Google OAuth credentials are added, the one thing left to check by hand in a browser is the actual sign-in redirect round-trip and a full click-through of the UI.

## Final verification state

- `npm run lint` — clean
- `npm run test` — 22 tests passing across 6 files
- `npm run build` — clean production build, all 11 routes compiling
