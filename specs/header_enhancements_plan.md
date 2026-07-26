# Header Nav + Quiz Progress Smilies

## Context

Two small UI enhancements from `specs/enhancements_signout_and_others.md`: (1) a persistent top header with a home-linking logo, the signed-in student's name, and a sign-out control, present on every page, and (2) a row of emoji "smilies" at the bottom of the question card during a quiz, one per question, showing grey (unanswered) → green/smiling (correct) or red/sad (incorrect) as each question is answered.

Confirmed decisions (via question to the user):
- Header renders on **every page**, wired once into the root layout — not per-page.
- Logo is a **text wordmark** ("11+ Vocab"), no image asset.
- Header also shows the **logged-in student's name** (falls back to email if no name set, matching the existing `session.user.name ?? session.user.email` convention already used in `app/page.tsx`).
- Smilies are a **passive indicator only** — no click-to-jump.
- Icon style is **emoji**.

## 1. Header

New file `components/Header.tsx` — an async server component (matches this app's existing pattern of calling `getServerSession` directly in server components; there's no client session provider anywhere in the app, so don't introduce one):

```tsx
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function Header() {
  const session = await getServerSession(authOptions);

  return (
    <header className="border-b border-black/[.08] dark:border-white/[.145]">
      <div className="mx-auto flex w-full max-w-md items-center justify-between px-6 py-4">
        <Link href="/" className="font-semibold">
          11+ Vocab
        </Link>
        {session?.user && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {session.user.name ?? session.user.email}
            </span>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- NextAuth API route, not an app page */}
            <a href="/api/auth/signout" className="text-sm text-zinc-500 underline">
              Sign out
            </a>
          </div>
        )}
      </div>
    </header>
  );
}
```

- Inner `div` uses `max-w-md` to align with every page's existing `<main className="mx-auto ... max-w-md">` content width.
- Right side groups the student's name and "Sign out" together in a flex row; name falls back to email (same `?? ` pattern already used in `app/page.tsx`).
- No sign-in/sign-up link when signed out — that slot stays empty; per-page CTAs already cover it.
- Named export (matches this codebase's convention — all existing components use named exports, not default).

**`app/layout.tsx`**: import `Header` and render it as the first child inside `<body>`, before `{children}`:
```tsx
<body className="min-h-full flex flex-col">
  <Header />
  {children}
</body>
```
Verified this is layout-safe: `body` is already `flex flex-col`, every page's own `<main>` uses `flex-1` (some also `justify-center`) to fill/center the *remaining* space — adding a fixed-height header sibling above it needs no changes to any of the 8 existing pages.

**`app/page.tsx`**: remove the now-redundant inline `Sign out` `<a>` link (the global header covers it everywhere, including `/`). Leave the "Signed in as ..." text, "Start a quiz"/"Progress history" links, and the signed-out "Sign in"/"Sign up" links untouched — those are page content, not header nav. (The home page's "Signed in as ..." text now duplicates the header's name display, but that's acceptable — it's page content confirming identity in context, not navigation, same reasoning as keeping the primary action buttons.)

No new test file for `Header.tsx` — this codebase has no precedent for testing server components / mocking `getServerSession` (existing tests only cover pure presentational components; `app/page.tsx`, which does the identical conditional-session pattern, has no test either). Verify manually instead.

## 2. Quiz progress smilies

**`components/QuizPlayClient.tsx`**: `AnsweredQuestion` currently lacks `isCorrect` — the check-answer response's `data.isCorrect` is used to set the transient `feedback` state but discarded once `feedback` resets on `handleNext`. Add it:
```tsx
interface AnsweredQuestion {
  wordId: string;
  questionType: QuestionType;
  variant?: Variant;
  prompt: string;
  selectedText: string;
  isCorrect: boolean;
}
```
and populate it in `handleSelect`'s existing `setAnswers` call using the same `data.isCorrect` already used for `feedback`. Confirmed safe: `app/api/quiz/submit/route.ts` does no strict schema validation on the submitted `answers` array — an extra `isCorrect` field is simply ignored by both the route and `validateAnswers`, and server-side re-validation still independently determines correctness regardless of what the client sends.

New file `components/QuizProgressSmilies.tsx` (presentational, matches `ScoreSummary.tsx`/`MissedQuestionsReview.tsx` style — props in, JSX out, no internal state):
```tsx
export type AnswerStatus = "unanswered" | "correct" | "incorrect";

interface QuizProgressSmiliesProps {
  statuses: AnswerStatus[];
}

const EMOJI: Record<AnswerStatus, string> = { unanswered: "😐", correct: "😊", incorrect: "😞" };
const CHIP_CLASS: Record<AnswerStatus, string> = {
  unanswered: "border-zinc-300 bg-zinc-100 text-zinc-400 grayscale dark:border-zinc-600 dark:bg-zinc-800",
  correct: "border-green-500 bg-green-100 dark:bg-green-900/40",
  incorrect: "border-red-500 bg-red-100 dark:bg-red-900/40",
};

export function QuizProgressSmilies({ statuses }: QuizProgressSmiliesProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2" role="list" aria-label="Quiz progress">
      {statuses.map((status, i) => (
        <span
          key={i}
          role="listitem"
          aria-label={`Question ${i + 1}: ${status}`}
          className={`flex h-8 w-8 items-center justify-center rounded-full border text-base leading-none ${CHIP_CLASS[status]}`}
        >
          {EMOJI[status]}
        </span>
      ))}
    </div>
  );
}
```
Single prop (`statuses`), no separate `total` count — the array's length *is* the quiz length, avoiding two sources of truth. Grey state uses Tailwind's `grayscale` filter on the emoji glyph itself (CSS `color` doesn't recolor full-color emoji, only `filter` does); green/red states are conveyed via the chip's `bg-*`/`border-*`, mirroring `QuestionCard.tsx`'s existing correct/incorrect option-highlight classes for visual consistency. Purely presentational (`<span>`, no `onClick`) — satisfies "passive only."

**Placement**: rendered as a **sibling immediately after `<QuestionCard />`** in `QuizPlayClient.tsx`, not threaded into `QuestionCard` as a new prop — `QuestionCard`'s contract is scoped to a single question, and injecting quiz-wide state there would break that scoping for no benefit over a sibling element in the same visual group.

**Derivation** in `QuizPlayClient.tsx`, computed alongside `const question = questions[currentIndex];`:
```tsx
const smileyStatuses: AnswerStatus[] = Array.from({ length: questions.length }, (_, i) =>
  answers[i] === undefined ? "unanswered" : answers[i].isCorrect ? "correct" : "incorrect"
);
```
Then render `<QuizProgressSmilies statuses={smileyStatuses} />` right after `<QuestionCard ... />` and before the `{feedback && <button>...}` block.

New test file `components/QuizProgressSmilies.test.tsx` (Vitest + RTL, matching existing convention): renders the right number of `listitem`s for a given `statuses` array, and correct `aria-label` per status/position.

## Build order

**A. Header** (independent): create `Header.tsx` → wire into `app/layout.tsx` → remove redundant sign-out link from `app/page.tsx` → verify: `npm run lint`, `npm run build`, manual check on the dev server (signed-out `/` shows only the wordmark; signed-in shows wordmark + student name + Sign out on `/`, `/quiz/setup`, `/history`; clicking wordmark returns home; `/signin`/`/signup` still look vertically centered beneath the header).

**B. Smilies** (independent of A): add `isCorrect` to `AnsweredQuestion` + populate in `handleSelect` → create `QuizProgressSmilies.tsx` → wire `smileyStatuses` + render into `QuizPlayClient.tsx` → create its test file → verify: `npm run test` (new test passes, existing `QuestionCard`/`ScoreSummary`/`MissedQuestionsReview` tests stay green) → `npm run lint` → `npm run build` → manual playthrough (smiley count matches chosen quiz length, all start grey, each turns green/red in the right position immediately after answering and stays that way through "Next question").

**Final**: `npm run test`, `npm run lint`, `npm run build` all green; one manual pass covering a signed-out page, a signed-in page, and a full quiz playthrough.

## Critical files

- `app/layout.tsx`
- `components/Header.tsx` (new)
- `app/page.tsx`
- `components/QuizPlayClient.tsx`
- `components/QuizProgressSmilies.tsx` (new)
